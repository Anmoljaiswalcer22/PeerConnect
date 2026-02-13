import { env } from '../config/env.js';
import { AUTH_TOKEN_TTL_SECONDS, signAuthToken } from './jwt.js';

export const AUTH_COOKIE = 'pc_token';

/**
 * httpOnly: JavaScript can't read it (XSS can't steal it).
 * secure:   HTTPS only in production.
 * sameSite: "lax" blocks cross-site POSTs (CSRF) while allowing normal navigation.
 * The browser only ever sees the Vercel domain (via the /api proxy), so this is
 * a first-party cookie and works in Safari/iOS too.
 */
const baseOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
});

export function setAuthCookie(res, userId) {
  res.cookie(AUTH_COOKIE, signAuthToken(userId), {
    ...baseOptions(),
    maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, baseOptions());
}
