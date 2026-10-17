"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceUserCreationPolicy = exports.setRole = exports.submitReview = exports.toggleFavorite = void 0;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const identity_1 = require("firebase-functions/v2/identity");
const rateLimit_1 = require("./rateLimit");
const validation_1 = require("./validation");
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
/** Disposable-mail domains rejected at account creation. */
const BLOCKED_EMAIL_DOMAINS = new Set([
    'mailinator.com',
    'guerrillamail.com',
    '10minutemail.com',
    'trashmail.com',
    'yopmail.com',
]);
const DISPLAY_NAME_MAX = 50;
function requireSignedInUid(authData) {
    if (!authData) {
        throw new https_1.HttpsError('unauthenticated', 'You must be signed in to continue.');
    }
    return authData.uid;
}
/** Maps internal validation errors to callable error codes. */
function mapKnownErrors(error) {
    if (error instanceof https_1.HttpsError) {
        throw error;
    }
    if (error instanceof validation_1.ValidationError) {
        throw new https_1.HttpsError('invalid-argument', error.message);
    }
    if (error instanceof rateLimit_1.RateLimitError) {
        throw new https_1.HttpsError('resource-exhausted', error.message, {
            retryAfterMs: error.retryAfterMs,
        });
    }
    // Wrap any unexpected error (Firestore errors, etc.) as an internal
    // callable error so the client always receives a recognized error code
    // instead of an opaque failure.
    throw new https_1.HttpsError('internal', 'An internal error occurred while processing your request.');
}
/** Matches the firestore.rules displayName length limit. */
function clampDisplayName(value, fallback) {
    if (typeof value !== 'string') {
        return fallback;
    }
    const trimmed = value.trim().slice(0, DISPLAY_NAME_MAX);
    return trimmed.length >= 1 ? trimmed : fallback;
}
exports.toggleFavorite = (0, https_1.onCall)(async (request) => {
    try {
        const uid = requireSignedInUid(request.auth);
        const movieId = (0, validation_1.requireMovieId)(request.data?.movieId);
        const favoriteRef = db.doc(`users/${uid}/favorites/${movieId}`);
        const markerRef = db.doc(`rateLimits/${uid}`);
        return await db.runTransaction(async (transaction) => {
            // Order matters: rate-check first so an abusive client burns the
            // window before any favorite document is touched.
            const markerPatch = await (0, rateLimit_1.enforceRateLimit)(transaction, db, uid, 'favorite');
            transaction.set(markerRef, markerPatch, { merge: true });
            const snapshot = await transaction.get(favoriteRef);
            if (snapshot.exists) {
                transaction.delete(favoriteRef);
                return { movieId, isFavorite: false };
            }
            transaction.set(favoriteRef, {
                movieId,
                addedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            return { movieId, isFavorite: true };
        });
    }
    catch (error) {
        return mapKnownErrors(error);
    }
});
exports.submitReview = (0, https_1.onCall)(async (request) => {
    const uid = requireSignedInUid(request.auth);
    try {
        const data = (request.data ?? {});
        const movieId = (0, validation_1.requireMovieId)(data.movieId);
        const rating = (0, validation_1.requireRating)(data.rating);
        const text = (0, validation_1.requireReviewText)(data.text);
        return await db.runTransaction(async (transaction) => {
            const markerPatch = await (0, rateLimit_1.enforceRateLimit)(transaction, db, uid, 'review');
            transaction.set(db.doc(`rateLimits/${uid}`), markerPatch, { merge: true });
            // Denormalize the author name so the review renders without a second
            // read, and so rules can size-check it like any other string field.
            const userSnapshot = await transaction.get(db.doc(`users/${uid}`));
            const tokenName = request.auth?.token?.name;
            const displayName = clampDisplayName(userSnapshot.get('displayName') ?? tokenName, 'Estoria member');
            const reviewRef = db.collection('reviews').doc();
            transaction.set(reviewRef, {
                movieId,
                userId: uid,
                displayName,
                rating,
                text,
                status: 'published',
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            return { reviewId: reviewRef.id };
        });
    }
    catch (error) {
        return mapKnownErrors(error);
    }
});
const CLAIMS_BY_ROLE = {
    user: null,
    moderator: { moderator: true },
    admin: { admin: true },
};
exports.setRole = (0, https_1.onCall)(async (request) => {
    if (request.auth?.token?.admin !== true) {
        throw new https_1.HttpsError('permission-denied', 'Only admins can change roles.');
    }
    try {
        const data = (request.data ?? {});
        const uid = (0, validation_1.requireUid)(data.uid);
        const role = (0, validation_1.requireRole)(data.role);
        // Auth claims first: the Firestore role field is only cosmetic, so if
        // the document write fails the callable fails while claims are simply
        // re-settable. Failing the claim write while writing the document would
        // create a signed-but-unprivileged admin, which rules reject anyway.
        await auth.setCustomUserClaims(uid, CLAIMS_BY_ROLE[role]);
        await db.doc(`users/${uid}`).set({ role, updatedAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
        return { uid, role };
    }
    catch (error) {
        return mapKnownErrors(error);
    }
});
// ---------------------------------------------------------------------------
// Blocking function: beforeUserCreated
// ---------------------------------------------------------------------------
// Account-creation policy. Rejects disposable email domains before the
// account exists. Extend here (allow-list, age gates) rather than in the
// client, which is not a trust boundary.
exports.enforceUserCreationPolicy = (0, identity_1.beforeUserCreated)((event) => {
    const email = (event.data?.email ?? '').toLowerCase();
    const domain = email.slice(email.lastIndexOf('@') + 1);
    if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
        throw new https_1.HttpsError('permission-denied', 'Please sign up with a permanent email address.');
    }
});
//# sourceMappingURL=index.js.map