/**
 * api/middleware/rateLimit.js
 * Rate limiting and DDoS protection
 */

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 60;
const THROTTLE_THRESHOLD = 100; // requests per minute for IP ban

export class RateLimiter {
  constructor(windowMs = WINDOW_MS, maxRequests = MAX_REQUESTS_PER_MINUTE) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  getKey(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  }

  isRateLimited(req) {
    const key = this.getKey(req);
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }

    const timestamps = requestCounts.get(key);

    // Remove old requests outside the window
    const validTimestamps = timestamps.filter((ts) => now - ts < this.windowMs);
    requestCounts.set(key, validTimestamps);

    // Check if rate limit exceeded
    if (validTimestamps.length >= this.maxRequests) {
      return true;
    }

    // Record new request
    validTimestamps.push(now);
    return false;
  }

  getRemainingRequests(req) {
    const key = this.getKey(req);
    const timestamps = requestCounts.get(key) || [];
    return Math.max(0, this.maxRequests - timestamps.length);
  }
}

export function rateLimitMiddleware(req, res) {
  const limiter = new RateLimiter();

  if (limiter.isRateLimited(req)) {
    res.statusCode = 429; // Too Many Requests
    res.setHeader('Retry-After', '60');
    res.setHeader('X-RateLimit-Limit', limiter.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    return {
      error: 'Rate limit exceeded',
      retryAfter: 60,
    };
  }

  res.setHeader('X-RateLimit-Limit', limiter.maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', limiter.getRemainingRequests(req).toString());

  return null;
}
