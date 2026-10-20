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
  createdAt: Date | null;
  updatedAt: Date | null;
};

const DISPLAY_NAME_MIN = 1;
const DISPLAY_NAME_MAX = 50;
const EMAIL_MAX = 254;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
    if (updates.photoURL !== null && updates.photoURL.trim().length > 500) {
      throw new ProfileValidationError('Photo URL is too long.');
    }
    patch.photoURL = updates.photoURL;
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
