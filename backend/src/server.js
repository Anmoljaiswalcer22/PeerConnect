import http from 'node:http';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { initSocket } from './socket/index.js';
import { logger } from './utils/logger.js';

const app = createApp();
const server = http.createServer(app);
const io = initSocket(server);

async function start() {
  try {
    // Connect to Atlas first: there's no point accepting requests without a database.
    await connectDB();
  } catch {
    // Give the logger a moment to flush the hint before exiting.
    setTimeout(() => process.exit(1), 250);
    return;
  }

  if (!env.uploadsEnabled) {
    logger.warn('Cloudinary is not configured: profile pictures and attachments are disabled.');
  }

  server.listen(env.PORT, () => {
    logger.info(`🚀 PeerConnect API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    logger.info(`   Health check: http://localhost:${env.PORT}/api/health`);
    logger.info(`   API docs:     http://localhost:${env.PORT}/api/docs`);
  });
}

/** Render sends SIGTERM on every deploy; close sockets, finish requests, then exit. */
function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully…`);
  io.close(); // disconnects all sockets and closes the HTTP server
  server.close(async () => {
    await disconnectDB().catch(() => {});
    logger.info('Shutdown complete');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception, exiting');
  process.exit(1);
});

start();
