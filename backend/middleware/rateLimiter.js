// Simple rate limiter for API endpoints
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.resetTime > 60000) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  limit(maxRequests = 100, windowMs = 60000) {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      if (!this.requests.has(key)) {
        this.requests.set(key, { count: 1, resetTime: now });
        return next();
      }

      const data = this.requests.get(key);
      
      if (now - data.resetTime > windowMs) {
        data.count = 1;
        data.resetTime = now;
        return next();
      }

      if (data.count >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((windowMs - (now - data.resetTime)) / 1000)
        });
      }

      data.count++;
      next();
    };
  }
}

const rateLimiter = new RateLimiter();

export const apiLimiter = rateLimiter.limit(1000, 60000);
export const authLimiter = rateLimiter.limit(100, 60000);
export const reportLimiter = rateLimiter.limit(500, 60000);

export default rateLimiter;