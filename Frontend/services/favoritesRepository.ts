import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '@/services/firebase';
import { describeFirebaseError } from '@/services/firebaseErrors';

/**
 * Favorites repository.
 *
 * READS and WRITES go straight to Firestore: /users/{uid}/favorites/* is
 * path-scoped, so the rules can only ever return or modify the caller's
 * own rows. Each movieId is used as the document ID, making toggles
 * idempotent (create = add, delete = remove).
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
let pendingToggleMovieId: string | null = null;

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
  const uid = requireAuthUid();
  const db = getDb();
  const favoriteRef = doc(db, 'users', uid, 'favorites', movieId);

  try {
    const snapshot = await getDoc(favoriteRef);

    if (snapshot.exists()) {
      // Movie is already favorited — remove it.
      await deleteDoc(favoriteRef);
      return false;
    }

    // Movie is not favorited — add it with a client-side timestamp.
    await setDoc(favoriteRef, {
      movieId,
      addedAt: Timestamp.fromDate(new Date()),
    });
    return true;
  } catch (error) {
    throw new Error(describeFirebaseError(error));
  } finally {
    pendingToggle = null;
    pendingToggleMovieId = null;
    // Clear the rate-limit timestamp on failure so the user can retry
    // immediately instead of being locked out by a failed call.
    lastToggleStartedAt = 0;
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

  // Only collapse rapid taps on the same movie. A tap on a different movie
  // must hit the server so each toggle reconciles with its own result.
  if (pendingToggle && pendingToggleMovieId === movieId) {
    return pendingToggle;
  }

  const sinceLast = Date.now() - lastToggleStartedAt;
  if (sinceLast < CLIENT_MIN_TOGGLE_INTERVAL_MS) {
    throw new Error(describeFirebaseError({ code: 'resource-exhausted' }));
  }

  lastToggleStartedAt = Date.now();
  pendingToggleMovieId = movieId;
  pendingToggle = runToggle(movieId);
  return pendingToggle;
}
