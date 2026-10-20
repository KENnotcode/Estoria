import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { getDb, getFunctionsClient } from '@/services/firebase';
import { describeFirebaseError } from '@/services/firebaseErrors';
import { parseReviewDoc } from '@/types/firestore';

/**
 * Reviews repository (shared collection).
 *
 * Reviews are the app's only shared documents: any signed-in user can
 * read them, but authorship (`userId`) is fixed at creation and enforced
 * by the rules — you can never read, edit, or delete someone else's
 * review unless you hold the moderator claim.
 *
 * WRITES go through the `submitReview` callable: server-side validation
 * plus a transactional rate limit (10 reviews / 10 minutes, 10s minimum
 * spacing) before any document is created.
 */

export type ReviewStatus = 'published' | 'flagged' | 'hidden';

export type Review = {
  id: string;
  movieId: string;
  userId: string;
  displayName: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: Date | null;
};

const MOVIE_ID_PATTERN = /^[0-9]{1,10}$/;
const REVIEW_PAGE_SIZE = 20;

export async function fetchReviewsForMovie(movieId: string): Promise<Review[]> {
  if (!MOVIE_ID_PATTERN.test(movieId)) {
    return [];
  }

  try {
    // Filtering here is defense in depth: the rules limit every review
    // read to signed-in users, and the caller only ever sees published
    // rows plus anything they authored or moderate.
    const snapshot = await getDocs(
      query(
        collection(getDb(), 'reviews'),
        where('movieId', '==', movieId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(REVIEW_PAGE_SIZE),
      ),
    );

    return snapshot.docs.map((reviewDoc) => {
      const doc = parseReviewDoc(reviewDoc);
      return {
        id: doc.id,
        movieId: doc.movieId,
        userId: doc.userId,
        displayName: doc.displayName,
        rating: doc.rating,
        text: doc.text,
        status: doc.status,
        createdAt: doc.createdAt,
      };
    });
  } catch (error) {
    throw new Error(describeFirebaseError(error));
  }
}

export async function submitReview(input: {
  movieId: string;
  rating: number;
  text: string;
}): Promise<string> {
  // Client-side mirror of the server checks: fail fast with a clear
  // message instead of a round-trip that can only end in invalid-argument.
  if (!MOVIE_ID_PATTERN.test(input.movieId)) {
    throw new Error('This movie cannot be reviewed.');
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 10) {
    throw new Error('Rating must be a whole number from 1 to 10.');
  }
  const text = input.text.trim();
  if (text.length < 1 || text.length > 2000) {
    throw new Error('Reviews must be 1 to 2000 characters.');
  }

  try {
    const submit = httpsCallable<{ movieId: string; rating: number; text: string }, { reviewId: string }>(
      getFunctionsClient(),
      'submitReview',
    );
    const result = await submit({ movieId: input.movieId, rating: input.rating, text });
    return result.data.reviewId;
  } catch (error) {
    throw new Error(describeFirebaseError(error));
  }
}
