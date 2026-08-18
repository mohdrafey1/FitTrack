/**
 * Minimal per-user fixed-window rate limiter.
 *
 * Deliberately dependency-free and in-memory. On a single long-lived server
 * that is a hard limit; on Vercel's serverless runtime each instance keeps its
 * own counters, so it is a best-effort brake on runaway usage rather than a
 * guarantee. It exists to stop one account burning an API quota, not as a
 * security control — move to a shared store if that changes.
 */

/**
 * @param {object} options
 * @param {number} options.max        requests allowed per window
 * @param {number} options.windowMs   window length in milliseconds
 * @param {string} options.message    message returned when the limit is hit
 */
function rateLimitPerUser({ max, windowMs, message }) {
    const hits = new Map();

    // Drop expired entries occasionally so the map cannot grow without bound.
    const sweep = (now) => {
        for (const [key, entry] of hits) {
            if (now - entry.start >= windowMs) hits.delete(key);
        }
    };

    return (req, res, next) => {
        const key = req.user?.id || req.user?._id?.toString() || req.ip;
        const now = Date.now();

        if (hits.size > 5000) sweep(now);

        const entry = hits.get(key);
        if (!entry || now - entry.start >= windowMs) {
            hits.set(key, { start: now, count: 1 });
            return next();
        }

        if (entry.count >= max) {
            const retryAfter = Math.ceil((entry.start + windowMs - now) / 1000);
            res.set("Retry-After", String(retryAfter));
            return res.status(429).json({
                success: false,
                message,
                retryAfter,
            });
        }

        entry.count += 1;
        next();
    };
}

module.exports = { rateLimitPerUser };
