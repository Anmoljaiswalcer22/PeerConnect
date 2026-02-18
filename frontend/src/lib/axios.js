import axios from 'axios';

/**
 * Every request goes to the same origin under /api:
 *  - development: Vite proxies /api → http://localhost:5001 (vite.config.js)
 *  - production:  Vercel rewrites /api → your Render backend (vercel.json)
 * So no API URL is hardcoded and the auth cookie stays first-party.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  // Render's free tier can take ~50 s to wake up after sleeping.
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

/* A 401 on a normal request means the session expired: let the auth store react. */
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

const AUTH_ENDPOINTS = ['/auth/check', '/auth/login', '/auth/signup', '/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url ?? '';
    if (status === 401 && !AUTH_ENDPOINTS.some((path) => url.startsWith(path))) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** A human-readable message from any axios error. */
export function getErrorMessage(error, fallback = 'Something went wrong') {
  const apiMessage = error?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond';
  if (error?.response?.status === 413) return 'That file is too large';
  if (error?.response?.status >= 500) return 'The server is unavailable right now';
  if (!error?.response) return 'Cannot reach the server. Check your connection.';
  return fallback;
}

/** Field-level validation errors from the API: { fieldName: message } */
export function getFieldErrors(error) {
  const details = error?.response?.data?.error?.details;
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(details.filter((d) => d.field).map((d) => [d.field, d.message]));
}
