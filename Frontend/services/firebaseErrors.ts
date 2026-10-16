import { FunctionsError, type FunctionsErrorCode } from 'firebase/functions';

/**
 * Maps Firebase Auth / Firestore / Functions error codes onto messages that
 * are safe and useful to show in the UI. Raw Firebase errors carry
 * implementation detail (and occasionally internal state); the app should
 * never render them verbatim.
 */
export function describeFirebaseError(error: unknown): string {
  const code = extractErrorCode(error);
  if (!code) {
    return 'Something went wrong. Please try again.';
  }

  switch (code) {
    // --- Auth ---
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password do not match.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled for this app yet.';
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not enabled. In Firebase Console, open Authentication, click Get started, and enable Email/Password under Sign-in method.';
    case 'auth/invalid-api-key':
      return 'Firebase is configured with an invalid API key.';
    case 'auth/app-not-authorized':
      return 'This app is not authorized to use Firebase Authentication.';
    case 'auth/network-request-failed':
      return 'You appear to be offline. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment before trying again.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this change.';

    // --- Firestore ---
    case 'permission-denied':
      return 'You do not have access to do that.';
    case 'unauthenticated':
      return 'Your session expired. Please sign in again.';

    // --- Callables / rate limiting ---
    case 'resource-exhausted':
      return rateLimitMessage(error);
    case 'invalid-argument':
      return 'That request was rejected. Check your input and try again.';
    case 'internal':
    case 'unavailable':
      return 'The service is busy right now. Try again in a moment.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function extractErrorCode(error: unknown): string | null {
  if (error instanceof FunctionsError) {
    return error.code as FunctionsErrorCode;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown };
    return typeof code === 'string' ? code : null;
  }
  return null;
}

/** Server sends retryAfterMs as error details; prefer it when present. */
function rateLimitMessage(error: unknown): string {
  if (error instanceof FunctionsError) {
    const details = error.details as { retryAfterMs?: unknown } | undefined;
    const retryAfterMs = details?.retryAfterMs;
    if (typeof retryAfterMs === 'number' && retryAfterMs > 0) {
      const seconds = Math.ceil(retryAfterMs / 1000);
      return `You are doing that too quickly. Try again in ${seconds}s.`;
    }
  }
  return 'You are doing that too quickly. Try again in a moment.';
}
