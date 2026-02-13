import * as authService from '../services/auth.service.js';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies.js';
import { signSocketToken } from '../utils/jwt.js';
import { ok } from '../utils/respond.js';

export async function signup(req, res) {
  const user = await authService.signup(req.valid.body);
  setAuthCookie(res, user._id);
  ok(res, { user }, 201);
}

export async function login(req, res) {
  const user = await authService.login(req.valid.body);
  setAuthCookie(res, user._id);
  ok(res, { user });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  ok(res, { message: 'Logged out' });
}

export function check(req, res) {
  ok(res, { user: req.user });
}

export function socketToken(req, res) {
  ok(res, { token: signSocketToken(req.user._id) });
}

export async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.user._id, req.valid.body);
  ok(res, { user });
}
