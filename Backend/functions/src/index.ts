/**
 * Estoria Cloud Functions.
 *
 * Security posture:
 *   - All privileged writes go through callables here, not direct client
 *     writes. Every payload is validated server-side before any DB work.
 *   - Every write that can be abused (favorites toggling, review posting)
 *     is gated by a transactional rate limiter that writes the marker in
 *     the same transaction as the guarded write, so the limit and the
 *     write can never disagree.
 *   - firestore.rules remains the boundary for direct client access:
 *     the Admin SDK used here bypasses rules, so validation is duplicated
 *     here deliberately (fail fast) while rules still defend the client-
 *     writable paths.
 */

import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/v2/identity';

import { enforceRateLimit, RateLimitError } from './rateLimit';
import {
  ValidationError,
  requireMovieId,
  requireRating,
  requireReviewText,
  requireRole,
  requireUid,
  type Role,
} from './validation';

const db = getFirestore();
const auth = getAuth();

/** Disposable-mail domains rejected at account creation. */
const BLOCKED_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'trashmail.com',
  'yopmail.com',
]);

const DISPLAY_NAME_MAX = 50;

interface SignedInAuth {
  uid: string;
}

function requireSignedInUid(authData: SignedInAuth | undefined): string {
  if (!authData) {
    throw new HttpsError('unauthenticated', 'You must be signed in to continue.');
  }
  return authData.uid;
}

/** Maps internal validation errors to callable error codes. */
function mapKnownErrors(error: unknown): never {
  if (error instanceof ValidationError) {
    throw new HttpsError('invalid-argument', error.message);
  }
  if (error instanceof RateLimitError) {
    throw new HttpsError('resource-exhausted', error.message, {
      retryAfterMs: error.retryAfterMs,
    });
  }
  throw error;
}

/** Matches the firestore.rules displayName length limit. */
function clampDisplayName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim().slice(0, DISPLAY_NAME_MAX);
  return trimmed.length >= 1 ? trimmed : fallback;
}

// ---------------------------------------------------------------------------
// Callable: toggleFavorite
// ---------------------------------------------------------------------------
// Rate-limited because this is the highest-frequency write in the app
// (every heart tap on every movie card). Removing a favorite is limited
// too: delete-flooding is the same abuse as create-flooding.

interface ToggleFavoriteData {
  movieId: string;
}

export const toggleFavorite = onCall(async (request) => {
  const uid = requireSignedInUid(request.auth as SignedInAuth | undefined);

  try {
    const movieId = requireMovieId((request.data as ToggleFavoriteData | undefined)?.movieId);

    const favoriteRef = db.doc(`users/${uid}/favorites/${movieId}`);
    const markerRef = db.doc(`rateLimits/${uid}`);

    return await db.runTransaction(async (transaction) => {
      // Order matters: rate-check first so an abusive client burns the
      // window before any favorite document is touched.
      const markerPatch = await enforceRateLimit(transaction, db, uid, 'favorite');
      transaction.set(markerRef, markerPatch, { merge: true });

      const snapshot = await transaction.get(favoriteRef);
      if (snapshot.exists) {
        transaction.delete(favoriteRef);
        return { movieId, isFavorite: false };
      }

      transaction.set(favoriteRef, {
        movieId,
        addedAt: FieldValue.serverTimestamp(),
      });
      return { movieId, isFavorite: true };
    });
  } catch (error) {
    return mapKnownErrors(error);
  }
});

// ---------------------------------------------------------------------------
// Callable: submitReview
// ---------------------------------------------------------------------------
// Low max-per-window (10) and a 10s minimum spacing: review spam and
// brigading are the classic attacks on a shared review collection.

interface SubmitReviewData {
  movieId: string;
  rating: number;
  text: string;
}

export const submitReview = onCall(async (request) => {
  const uid = requireSignedInUid(request.auth as SignedInAuth | undefined);

  try {
    const data = (request.data ?? {}) as Partial<SubmitReviewData>;
    const movieId = requireMovieId(data.movieId);
    const rating = requireRating(data.rating);
    const text = requireReviewText(data.text);

    return await db.runTransaction(async (transaction) => {
      const markerPatch = await enforceRateLimit(transaction, db, uid, 'review');
      transaction.set(db.doc(`rateLimits/${uid}`), markerPatch, { merge: true });

      // Denormalize the author name so the review renders without a second
      // read, and so rules can size-check it like any other string field.
      const userSnapshot = await transaction.get(db.doc(`users/${uid}`));
      const tokenName = (request.auth as { token?: { name?: string } } | undefined)?.token?.name;
      const displayName = clampDisplayName(userSnapshot.get('displayName') ?? tokenName, 'Estoria member');

      const reviewRef = db.collection('reviews').doc();
      transaction.set(reviewRef, {
        movieId,
        userId: uid,
        displayName,
        rating,
        text,
        status: 'published',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { reviewId: reviewRef.id };
    });
  } catch (error) {
    return mapKnownErrors(error);
  }
});

// ---------------------------------------------------------------------------
// Callable: setRole
// ---------------------------------------------------------------------------
// The ONLY way privilege is granted. Custom claims are set in Auth; the
// users/{uid}.role document is kept in sync for display purposes only.
// firestore.rules authorizes on the claim, never on the document field,
// so a forged role field gains nothing.

interface SetRoleData {
  uid: string;
  role: Role;
}

const CLAIMS_BY_ROLE: Record<Role, Record<string, boolean> | null> = {
  user: null,
  moderator: { moderator: true },
  admin: { admin: true },
};

export const setRole = onCall(async (request) => {
  if ((request.auth as { token?: { admin?: unknown } } | undefined)?.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Only admins can change roles.');
  }

  try {
    const data = (request.data ?? {}) as Partial<SetRoleData>;
    const uid = requireUid(data.uid);
    const role = requireRole(data.role);

    // Auth claims first: the Firestore role field is only cosmetic, so if
    // the document write fails the callable fails while claims are simply
    // re-settable. Failing the claim write while writing the document would
    // create a signed-but-unprivileged admin, which rules reject anyway.
    await auth.setCustomUserClaims(uid, CLAIMS_BY_ROLE[role]);
    await db.doc(`users/${uid}`).set(
      { role, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    return { uid, role };
  } catch (error) {
    return mapKnownErrors(error);
  }
});

// ---------------------------------------------------------------------------
// Blocking function: beforeUserCreated
// ---------------------------------------------------------------------------
// Account-creation policy. Rejects disposable email domains before the
// account exists. Extend here (allow-list, age gates) rather than in the
// client, which is not a trust boundary.

export const enforceUserCreationPolicy = beforeUserCreated((event) => {
  const email = (event.data?.email ?? '').toLowerCase();
  const domain = email.slice(email.lastIndexOf('@') + 1);

  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    throw new HttpsError('permission-denied', 'Please sign up with a permanent email address.');
  }
});
