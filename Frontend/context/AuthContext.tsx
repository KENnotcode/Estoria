import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getFirebaseAuth } from '@/services/firebase';
import { describeFirebaseError } from '@/services/firebaseErrors';
import { createUserProfile, fetchUserProfile } from '@/services/usersRepository';

/**
 * Authentication backed by Firebase Auth. Firestore user profiles are
 * the authorization-bearing documents (see Backend/firestore.rules);
 * roles themselves live in Auth custom claims, never in writable
 * profile fields.
 */

export type Account = {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
};

type AuthContextValue = {
  account: Account | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function fallbackNameFromEmail(email: string): string {
  const handle = email.split('@')[0] ?? '';
  return handle.length >= 1 ? handle : 'Estoria member';
}

function describeAuthFailure(error: unknown): string {
  // Repository operations already convert Firebase failures into a safe
  // user-facing Error. Preserve that message instead of converting it to the
  // generic fallback a second time.
  if (error instanceof Error && !hasFirebaseErrorCode(error)) {
    return error.message || 'Something went wrong. Please try again.';
  }
  return describeFirebaseError(error);
}

function hasFirebaseErrorCode(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}

/**
 * Builds the view-model account from the Auth user plus their profile
 * document. The profile is the source of truth for the display name; the
 * Auth display name is the fallback for sessions that predate it.
 */
async function toAccount(user: User): Promise<Account> {
  const base = {
    uid: user.uid,
    email: user.email ?? '',
  };

  try {
    const profile = await fetchUserProfile(user.uid);
    if (profile) {
      return {
        ...base,
        name: profile.displayName.length >= 1 ? profile.displayName : fallbackNameFromEmail(base.email),
        photoURL: profile.photoURL,
      };
    }
  } catch {
    // A profile read failure must not break the session; fall through to
    // the Auth-derived name. The session itself is still valid.
  }

  return {
    ...base,
    name: user.displayName?.trim() || fallbackNameFromEmail(base.email),
    photoURL: user.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Signed out: clear the session AND the loading flag. Skipping the
        // loading flag here leaves the auth gate stuck and the app falls
        // through to the main UI unauthenticated.
        if (active) {
          setAccount(null);
          setIsLoading(false);
        }
        return;
      }

      // The listener must not block initial render on a profile fetch;
      // isLoading is cleared by the first auth event regardless.
      void toAccount(user)
        .then((nextAccount) => {
          if (active) setAccount(nextAccount);
        })
        .catch(() => {
          if (active) {
            setAccount({
              uid: user.uid,
              email: user.email ?? '',
              name: user.displayName?.trim() || fallbackNameFromEmail(user.email ?? ''),
              photoURL: user.photoURL,
            });
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim().toLowerCase(), password);
    } catch (error) {
      throw new Error(describeAuthFailure(error));
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        normalizedEmail,
        password,
      );

      await updateProfile(credential.user, { displayName: name.trim() });

      // The profile write is rules-validated to role 'user'; ownership is
      // the uid the Auth system just issued, so it cannot be mismatched.
      await createUserProfile({
        uid: credential.user.uid,
        displayName: name.trim(),
        email: normalizedEmail,
      });
    } catch (error) {
      throw new Error(describeAuthFailure(error));
    }
  }, []);

  /**
   * Sends a password-reset email. Does not sign anyone in and never reveals
   * whether the address exists — Firebase sends the mail only to known
   * addresses but reports the same success either way.
   */
  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim().toLowerCase());
    } catch (error) {
      // When email enumeration protection is off, Firebase reports unknown
      // addresses with the sign-in wording, which reads wrong for a reset.
      if ((error as { code?: unknown })?.code === 'auth/user-not-found') {
        throw new Error('No Estoria account uses that email address.');
      }
      throw new Error(describeAuthFailure(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(getFirebaseAuth());
    } catch (error) {
      throw new Error(describeAuthFailure(error));
    }
  }, []);

  const value = useMemo(
    () => ({ account, isLoading, signIn, signUp, sendPasswordReset, signOut }),
    [account, isLoading, signIn, signUp, sendPasswordReset, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
