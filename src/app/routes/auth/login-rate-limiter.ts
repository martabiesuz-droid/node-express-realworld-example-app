import { rateLimit, Options } from 'express-rate-limit';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 5;

/**
 * Creates a rate limiter middleware for the login route.
 * Accepts optional overrides so tests can use short windows without touching
 * environment variables.
 */
export const createLoginRateLimiter = (overrides: Partial<Options> = {}) =>
  rateLimit({
    windowMs: DEFAULT_WINDOW_MS,
    max: DEFAULT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        errors: { body: ['Too many login attempts, please try again later'] },
      });
    },
    ...overrides,
  });
