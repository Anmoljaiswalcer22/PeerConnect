import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'peerconnect';

/**
 * Two kinds of token, both signed with JWT_SECRET:
 *  - "auth":   7-day session token, stored only in an httpOnly cookie.
 *  - "socket": 2-minute token handed to the Socket.IO client for the handshake.
 *              The socket connects straight to Render (Vercel can't proxy
 *              WebSockets), where the Vercel-domain cookie isn't sent.
 * The `typ` claim stops one kind being used in place of the other.
 */
export const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export function signAuthToken(userId) {
  return jwt.sign({ sub: String(userId), typ: 'auth' }, env.JWT_SECRET, {
    expiresIn: AUTH_TOKEN_TTL_SECONDS,
    issuer: ISSUER,
  });
}

export function signSocketToken(userId) {
  return jwt.sign({ sub: String(userId), typ: 'socket' }, env.JWT_SECRET, {
    expiresIn: 120,
    issuer: ISSUER,
  });
}

/** Throws if the token is invalid, expired, or of the wrong type. */
export function verifyToken(token, expectedType) {
  const payload = jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER, algorithms: ['HS256'] });
  if (payload.typ !== expectedType || typeof payload.sub !== 'string') {
    throw new Error('Invalid token type');
  }
  return payload;
}
