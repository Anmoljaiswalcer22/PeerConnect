import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { AUTH_COOKIE } from '../utils/cookies.js';
import { verifyToken } from '../utils/jwt.js';

/** Requires a valid session cookie; sets req.user (without password). */
export async function protectRoute(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token, 'auth');
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  req.user = user;
  next();
}
