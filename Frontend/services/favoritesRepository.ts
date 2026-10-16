import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getDb, getFirebaseAuth, getFunctionsClient } from '@/services/firebase';
import { describeFirebaseError } from '@/services/firebaseErrors';

/**
 * Favorites repository.
 *
 * READS go straight to Firestore: /users/{uid}/favorites/* is
 * path-scoped, so the rules can only ever return the caller's own rows.
 *
 * WRITES go through the `toggleFavorite` callable, which validates the
 * payload and enforces the rate limit in a transaction BEFORE touching
 * any favorite document. Direct client writes are allowed by the rules
 * but skip rate limiting and lose the atomic toggle, so the callable is
 * the only write path in the app.
 */

export type Favorite = {
  movieId: string;
  addedAt: Date | null;
};

const FAVORITE_MOVIE_ID = /^[0-9]{1,10}$/;

/**
 * Client-side throttle: mirrors the server's 2s minimum interval so rapid
 * heart-taps collapse instead of burning the server's rate budget.
 * If a toggle is already in flight, the next tap awaits that result.
 */
const CLIENT_MIN_TOGGLE_INTERVAL_MS = 2_500;
let lastToggleStartedAt = 0;
let pendingToggle: Promise<boolean> | null = null;

function requireAuthUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) {
    throw new Error(describeFirebaseError({ code: 'unauthenticated' }));
  }
  return uid;
}

export async function fetchFavorites(): Promise<Favorite[]> {
  const uid = requireAuthUid();

  try {
    // No `where` clause needed: the collection path itself is scoped to
    // the caller's uid. The rules enforce this — a tampered path fails.
    const snapshot = await getDocs(
      query(collection(getDb(), 'users', uid, 'favorites'), orderBy('addedAt', 'desc')),
    );

    return snapshot.docs.map((favoriteDoc) => {
      const data = favoriteDoc.data();
      return {
        movieId: String(data.movieId ?? favoriteDoc.id),
        addedAt: data.addedAt?.toDate?.() ?? null,
      };
    });
  } catch (error) {
    throw new Error(describeFirebaseError(error));
  }
}

async function runToggle(movieId: string): Promise<boolean> {
  try {
    const toggle = httpsCallable<{ movieId: string }, { movieId: string; isFavorite: boolean }>(
      getFunctionsClient(),
      'toggleFavorite',
    );
    const result = await toggle({ movieId });
    return result.data.isFavorite;
  } catch (error) {
    // Callable failures carry a safe message (rate limit, invalid input,
    // unauthenticated). Fall back to raw error text only as a last resort.
    throw error instanceof Error ? new Error(describeFirebaseError(error)) : error;
  } finally {
    pendingToggle = null;
  }
}

/**
 * Adds or removes a favorite. Returns the new state (`true` = favorited).
 * Throws with a user-facing message when throttled or not signed in.
 */
export async function toggleFavorite(movieId: string): Promise<boolean> {
  if (!FAVORITE_MOVIE_ID.test(movieId)) {
    throw new Error('This movie cannot be favorited.');
  }

  if (pendingToggle) {
    return pendingToggle;
  }

  const sinceLast = Date.now() - lastToggleStartedAt;
  if (sinceLast < CLIENT_MIN_TOGGLE_INTERVAL_MS) {
    throw new Error(describeFirebaseError({ code: 'resource-exhausted' }));
  }

  lastToggleStartedAt = Date.now();
  pendingToggle = runToggle(movieId);
  return pendingToggle;
}
