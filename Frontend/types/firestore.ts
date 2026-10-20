import type {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

/**
 * Firestore document shapes for Estoria.
 *
 * These types mirror the documents written by the repositories and enforced
 * by `Backend/firestore.rules`. Using them with parser functions lets
 * `doc.data()` return properly typed objects instead of `DocumentData`
 * (which is `Record<string, unknown>` and effectively `any`).
 */

/** Raw shape stored at /users/{uid}/favorites/{movieId} */
export interface FavoriteDoc {
  movieId: string;
  addedAt: Date | null;
}

/** Raw shape stored at /users/{uid} */
export interface UserProfileDoc {
  displayName: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  photoURL: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Raw shape stored at /reviews/{reviewId} */
export interface ReviewDoc {
  id: string;
  movieId: string;
  userId: string;
  displayName: string;
  rating: number;
  text: string;
  status: 'published' | 'flagged' | 'hidden';
  createdAt: Date | null;
}

/**
 * Typed snapshot aliases so callers never reference raw `DocumentData`.
 */
export type TypedDocSnapshot<T> = DocumentSnapshot<T>;
export type TypedQueryDocSnapshot<T> = QueryDocumentSnapshot<T>;

/**
 * Converts a raw Firestore query document snapshot into a typed `FavoriteDoc`.
 * Required fields default safely when missing.
 */
export function parseFavoriteDoc(
  snapshot: TypedQueryDocSnapshot<DocumentData>,
): FavoriteDoc {
  const data = snapshot.data();
  return {
    movieId: String(data.movieId ?? snapshot.id),
    addedAt: data.addedAt?.toDate?.() ?? new Date(),
  } as FavoriteDoc;
}

/**
 * Converts a raw Firestore document snapshot into a typed `UserProfileDoc`.
 * Returns `null` when the document does not exist.
 */
export function parseUserProfileDoc(
  snapshot: TypedDocSnapshot<DocumentData>,
): UserProfileDoc | null {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    email: typeof data.email === 'string' ? data.email : '',
    role:
      data.role === 'admin' || data.role === 'moderator'
        ? data.role
        : 'user',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  } as UserProfileDoc;
}

/**
 * Converts a raw Firestore query document snapshot into a typed `ReviewDoc`.
 */
export function parseReviewDoc(
  snapshot: TypedQueryDocSnapshot<DocumentData>,
): ReviewDoc {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    movieId: String(data.movieId),
    userId: String(data.userId),
    displayName: String(data.displayName ?? 'Estoria member'),
    rating: Number(data.rating ?? 0),
    text: String(data.text ?? ''),
    status:
      data.status === 'flagged' || data.status === 'hidden'
        ? data.status
        : 'published',
    createdAt: data.createdAt?.toDate?.() ?? null,
  } as ReviewDoc;
}

