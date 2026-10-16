"use strict";
/**
 * Transactional write rate limiting.
 *
 * The marker document `rateLimits/{uid}` is written ONLY here, with the
 * Admin SDK, in the SAME Firestore transaction as the write it gates.
 * Because the transaction is atomic, two concurrent callables for the same
 * user cannot both observe a stale count; the loser of the read-modify-write
 * is retried by Firestore automatically.
 *
 * The marker is also the source for the `get()` check in firestore.rules,
 * so direct client writes respect markers the server has already written.
 * Clients can never read or forge these documents (rules deny them outright).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.LIMITS = void 0;
exports.enforceRateLimit = enforceRateLimit;
const firestore_1 = require("firebase-admin/firestore");
exports.LIMITS = {
    favorite: { minIntervalMs: 2_000, maxPerWindow: 60, windowMs: 10 * 60_000 },
    review: { minIntervalMs: 10_000, maxPerWindow: 10, windowMs: 10 * 60_000 },
};
class RateLimitError extends Error {
    retryAfterMs;
    constructor(retryAfterMs) {
        super(`Too many writes. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`);
        this.name = 'RateLimitError';
        this.retryAfterMs = retryAfterMs;
    }
}
exports.RateLimitError = RateLimitError;
function readMarker(snapshotExists, data, action) {
    if (!snapshotExists || !data) {
        return null;
    }
    const count = data[`${action}Count`];
    const windowStart = data[`${action}WindowStart`];
    const nextAt = data[`${action}NextAt`];
    if (typeof count !== 'number' || !(windowStart instanceof firestore_1.Timestamp) || !(nextAt instanceof firestore_1.Timestamp)) {
        return null;
    }
    return { count, windowStart, nextAt };
}
/**
 * Validates a write against the caller's marker and returns the marker
 * patch the caller MUST include in the same transaction (merged onto the
 * rateLimits/{uid} document). Throws RateLimitError when the write is too
 * soon or exceeds the window budget.
 */
async function enforceRateLimit(transaction, db, uid, action) {
    const markerRef = db.doc(`rateLimits/${uid}`);
    const snapshot = await transaction.get(markerRef);
    const config = exports.LIMITS[action];
    const now = new Date();
    const marker = readMarker(snapshot.exists, snapshot.data(), action);
    if (marker && now.getTime() < marker.nextAt.toDate().getTime()) {
        throw new RateLimitError(marker.nextAt.toDate().getTime() - now.getTime());
    }
    const windowStartedAt = marker?.windowStart.toDate().getTime() ?? 0;
    const windowActive = now.getTime() - windowStartedAt < config.windowMs;
    const usedInWindow = marker && windowActive ? marker.count : 0;
    if (usedInWindow + 1 > config.maxPerWindow) {
        const windowEndsAt = windowStartedAt + config.windowMs;
        throw new RateLimitError(windowEndsAt - now.getTime());
    }
    return {
        [`${action}Count`]: usedInWindow + 1,
        [`${action}WindowStart`]: windowActive && marker ? marker.windowStart : firestore_1.FieldValue.serverTimestamp(),
        [`${action}NextAt`]: firestore_1.Timestamp.fromMillis(now.getTime() + config.minIntervalMs),
    };
}
//# sourceMappingURL=rateLimit.js.map