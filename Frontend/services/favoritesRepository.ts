import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '@/services/firebase';
import { describeFirebaseError } from '@/services/firebaseErrors';
import { parseFavoriteDoc } from '@/types/firestore';


export type Favorite = {
  movieId: string;
  addedAt: Date | null;
};

const FAVORITE_MOVIE_ID = /^[0-9]{1,10}$/;

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
    const snapshot = await getDocs(
      query(collection(getDb(), 'users', uid, 'favorites'), orderBy('addedAt', 'desc')),
    );

    return snapshot.docs.map((favoriteDoc) => {
      const doc = parseFavoriteDoc(favoriteDoc);
      return {
        movieId: doc.movieId,
        addedAt: doc.addedAt,
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
      await deleteDoc(favoriteRef);
      return false;
    }

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
    lastToggleStartedAt = 0;
  }
}

export async function toggleFavorite(movieId: string): Promise<boolean> {
  if (!FAVORITE_MOVIE_ID.test(movieId)) {
    throw new Error('This movie cannot be favorited.');
  }

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
