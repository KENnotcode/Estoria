import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import { describeFirebaseError } from '@/services/firebaseErrors';
import { parseUserProfileDoc } from '@/types/firestore';

/**
 * User profile repository.
 *
 * Profiles live at /users/{uid}: the path is the ownership boundary, so
 * rules already confine a caller to their own document. Everything writes
 * through here is pre-validated to match firestore.rules exactly — a
 * rejected write is a bug in one of the two layers, not the user's fault.
 */

export type UserRole = 'user' | 'moderator' | 'admin';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoURL: string | null;
  favoriteGenres: string[];
  isProfileComplete: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const DISPLAY_NAME_MIN = 1;
const DISPLAY_NAME_MAX = 50;
const EMAIL_MAX = 254;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHOTO_URL_MAX = 500;
const FAVORITE_GENRES_MAX = 10;
const GENRE_MAX = 40;

export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileValidationError';
  }
}

function requireDisplayName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < DISPLAY_NAME_MIN || trimmed.length > DISPLAY_NAME_MAX) {
    throw new ProfileValidationError(
      `Name must be ${DISPLAY_NAME_MIN}-${DISPLAY_NAME_MAX} characters.`,
    );
  }
  return trimmed;
}

function requireEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.length > EMAIL_MAX || !EMAIL_PATTERN.test(normalized)) {
    throw new ProfileValidationError('Enter a valid email address.');
  }
  return normalized;
}

function normalizePhotoURL(value: string | null): string | null {
  if (value !== null && value.trim().length > PHOTO_URL_MAX) {
    throw new ProfileValidationError('Photo URL is too long.');
  }
  return value;
}

function normalizeFavoriteGenres(value: string[]): string[] {
  // Defensive: drop blanks and duplicates instead of failing the whole
  // write over one malformed chip from an older client.
  const genres = Array.from(
    new Set(
      value
        .map((genre) => genre.trim())
        .filter((genre) => genre.length >= 1 && genre.length <= GENRE_MAX),
    ),
  );
  if (genres.length > FAVORITE_GENRES_MAX) {
    throw new ProfileValidationError(`Pick at most ${FAVORITE_GENRES_MAX} favorite genres.`);
  }
  return genres;
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snapshot = await getDoc(doc(getDb(), 'users', uid));
    if (!snapshot.exists()) {
      return null;
    }
    const docData = parseUserProfileDoc(snapshot);
    if (!docData) return null;
    return {
      uid: snapshot.id,
      displayName: docData.displayName,
      email: docData.email,
      role: docData.role,
      photoURL: docData.photoURL,
      favoriteGenres: docData.favoriteGenres,
      isProfileComplete: docData.isProfileComplete,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    };
  } catch (error) {
    throw new Error(describeFirebaseError(error));
  }
}

/**
 * Creates the caller's own profile. `role` is hard-coded to 'user' here:
 * privilege can only be granted by the admin-only setRole callable, which
 * sets an Auth custom claim. The rules reject any client attempt to
 * create a profile with a different role.
 */
export async function createUserProfile(input: {
  uid: string;
  displayName: string;
  email: string;
}): Promise<void> {
  const displayName = requireDisplayName(input.displayName);
  const email = requireEmail(input.email);

  try {
    await setDoc(doc(getDb(), 'users', input.uid), {
      displayName,
      email,
      role: 'user',
      // The post-signup setup sheet stays open until this flips to true.
      favoriteGenres: [],
      isProfileComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(describeFirebaseError(error));
  }
}

/**
 * Updates the caller's own profile. Email, role, and createdAt are not
 * accepted as parameters because the rules make them immutable for the
 * owner — keeping the call surface minimal prevents accidental writes
 * that can only fail.
 */
export async function updateUserProfile(
  uid: string,
  updates: { displayName?: string; photoURL?: string | null },
): Promise<void> {
  const patch: Record<string, unknown> = {};

  if (updates.displayName !== undefined) {
    patch.displayName = requireDisplayName(updates.displayName);
  }
  if (updates.photoURL !== undefined) {
    patch.photoURL = normalizePhotoURL(updates.photoURL);
  }
  if (Object.keys(patch).length === 0) {
    return;
  }

  patch.updatedAt = serverTimestamp();

  try {
    await updateDoc(doc(getDb(), 'users', uid), patch);
  } catch (error) {
    throw new Error(describeFirebaseError(error));
  }
}

/**
 * Finishes the post-signup setup sheet: persists the personalization fields
 * and flips isProfileComplete to true in a single write. The merge write
 * leaves createdAt/role/email untouched and still succeeds when the profile
 * document does not exist yet (the sheet can race the signup profile write).
 */
export async function completeUserProfile(input: {
  uid: string;
  displayName: string;
  photoURL: string | null;
  favoriteGenres: string[];
}): Promise<void> {
  const displayName = requireDisplayName(input.displayName);
  const photoURL = normalizePhotoURL(input.photoURL);
  const favoriteGenres = normalizeFavoriteGenres(input.favoriteGenres);

  try {
    await setDoc(
      doc(getDb(), 'users', input.uid),
      {
        displayName,
        photoURL,
        favoriteGenres,
        isProfileComplete: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    throw new Error(describeFirebaseError(error));
  }
}
