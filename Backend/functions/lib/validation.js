"use strict";
/**
 * Server-side payload validation for callable functions.
 *
 * These checks mirror `firestore.rules` one-for-one. Rules are the trust
 * boundary for anything a client writes directly; these checks run BEFORE
 * any database work so the functions fail fast on malformed input and the
 * two layers never drift apart in what they accept.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVIEW_TEXT_MAX = exports.REVIEW_TEXT_MIN = exports.DISPLAY_NAME_MAX = exports.MOVIE_ID_PATTERN = exports.ValidationError = void 0;
exports.requireString = requireString;
exports.requireMovieId = requireMovieId;
exports.requireRating = requireRating;
exports.requireReviewText = requireReviewText;
exports.requireRole = requireRole;
exports.requireUid = requireUid;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
exports.MOVIE_ID_PATTERN = /^[0-9]{1,10}$/;
exports.DISPLAY_NAME_MAX = 50;
exports.REVIEW_TEXT_MIN = 1;
exports.REVIEW_TEXT_MAX = 2000;
function requireString(value, field, maxLength) {
    if (typeof value !== 'string' || value.length < 1 || value.length > maxLength) {
        throw new ValidationError(`${field} must be a string of 1-${maxLength} characters.`);
    }
    return value;
}
function requireMovieId(value) {
    const id = requireString(value, 'movieId', 10);
    if (!exports.MOVIE_ID_PATTERN.test(id)) {
        throw new ValidationError('movieId must be a numeric TMDB id.');
    }
    return id;
}
function requireRating(value) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 10) {
        throw new ValidationError('rating must be an integer between 1 and 10.');
    }
    return value;
}
function requireReviewText(value) {
    return requireString(value, 'text', exports.REVIEW_TEXT_MAX);
}
const ROLES = ['user', 'moderator', 'admin'];
function requireRole(value) {
    if (typeof value !== 'string' || !ROLES.includes(value)) {
        throw new ValidationError(`role must be one of: ${ROLES.join(', ')}.`);
    }
    return value;
}
function requireUid(value) {
    return requireString(value, 'uid', 128);
}
//# sourceMappingURL=validation.js.map