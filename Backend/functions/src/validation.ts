/**
 * Server-side payload validation for callable functions.
 *
 * These checks mirror `firestore.rules` one-for-one. Rules are the trust
 * boundary for anything a client writes directly; these checks run BEFORE
 * any database work so the functions fail fast on malformed input and the
 * two layers never drift apart in what they accept.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const MOVIE_ID_PATTERN = /^[0-9]{1,10}$/;
export const DISPLAY_NAME_MAX = 50;
export const REVIEW_TEXT_MIN = 1;
export const REVIEW_TEXT_MAX = 2000;

export function requireString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maxLength) {
    throw new ValidationError(`${field} must be a string of 1-${maxLength} characters.`);
  }
  return value;
}

export function requireMovieId(value: unknown): string {
  const id = requireString(value, 'movieId', 10);
  if (!MOVIE_ID_PATTERN.test(id)) {
    throw new ValidationError('movieId must be a numeric TMDB id.');
  }
  return id;
}

export function requireRating(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 10) {
    throw new ValidationError('rating must be an integer between 1 and 10.');
  }
  return value;
}

export function requireReviewText(value: unknown): string {
  return requireString(value, 'text', REVIEW_TEXT_MAX);
}

export type Role = 'user' | 'moderator' | 'admin';

const ROLES: readonly Role[] = ['user', 'moderator', 'admin'];

export function requireRole(value: unknown): Role {
  if (typeof value !== 'string' || !(ROLES as readonly string[]).includes(value)) {
    throw new ValidationError(`role must be one of: ${ROLES.join(', ')}.`);
  }
  return value as Role;
}

export function requireUid(value: unknown): string {
  return requireString(value, 'uid', 128);
}
