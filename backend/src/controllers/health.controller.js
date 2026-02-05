import { env } from '../config/env.js';
import { getDbState } from '../config/db.js';

/**
 * Liveness + dependency check. Always answers 200 while the process is up
 * (so Render doesn't restart the service during a brief Atlas blip) and reports
 * the database state separately.
 */
export function getHealth(_req, res) {
  const database = getDbState();

  res.status(200).json({
    success: true,
    data: {
      status: database === 'connected' ? 'ok' : 'degraded',
      service: 'peerconnect-api',
      environment: env.NODE_ENV,
      database,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
}
