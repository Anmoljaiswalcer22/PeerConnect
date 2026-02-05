import { env } from './env.js';

/**
 * Only origins listed in CLIENT_URLS may call the API from a browser with
 * credentials (cookies). Requests without an Origin header (Postman, curl,
 * server-to-server, Render health checks) are allowed through.
 * Reused by Socket.IO in Phase 5 so both share one allowlist.
 */
export const isAllowedOrigin = (origin) => !origin || env.CLIENT_URLS.includes(origin.replace(/\/$/, ''));

export const corsOptions = {
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};
