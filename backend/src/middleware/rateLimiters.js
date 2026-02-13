import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: (_req, _res, next) =>
    next(new ApiError(429, 'TOO_MANY_REQUESTS', 'Too many attempts. Please wait a few minutes and try again.')),
};

/** 10 sign-ups per hour per IP. */
export const signupLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 10 });

/**
 * 10 failed logins per 15 minutes per IP + email. Successful logins don't count,
 * and keying by email means one attacker can't lock out everyone behind the same proxy.
 */
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}|${String(req.body?.email ?? '').toLowerCase().slice(0, 254)}`,
});

/** General ceiling for the whole API. */
export const apiLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 300 });
