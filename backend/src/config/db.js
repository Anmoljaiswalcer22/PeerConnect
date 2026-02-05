import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Reject unknown query fields. Query-operator injection (e.g. {"$ne": ""}) is
// prevented by validating every request with zod, so only strings and
// ObjectIds ever reach a query.
mongoose.set('strictQuery', true);

const READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/** Hide the password when a connection string is logged. */
export const maskUri = (uri) => uri.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:****@');

/** Turn common Atlas failures into a hint the developer can act on. */
const explain = (error) => {
  const msg = String(error?.message ?? '');
  if (/bad auth|authentication failed/i.test(msg)) {
    return 'Wrong database username or password. Check Atlas → Database Access, and URL-encode special characters in the password.';
  }
  if (/whitelist|IP.*not.*allowed|Could not connect to any servers/i.test(msg)) {
    return 'Your IP address is not allowed. In Atlas → Network Access add your current IP (local) or 0.0.0.0/0 (Render).';
  }
  if (/ENOTFOUND|querySrv|ETIMEOUT/i.test(msg)) {
    return 'The cluster host could not be resolved. Re-copy the connection string from Atlas and check your internet/DNS.';
  }
  return 'See the error above. Make sure the cluster is running and the connection string is correct.';
};

export const getDbState = () => READY_STATES[mongoose.connection.readyState] ?? 'unknown';

export async function connectDB() {
  mongoose.connection.on('connected', () => logger.info({ db: env.MONGODB_DB_NAME }, 'MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));

  logger.info({ uri: maskUri(env.MONGODB_URI) }, 'Connecting to MongoDB…');

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10_000,
      autoIndex: !env.isProduction,
    });
  } catch (error) {
    logger.fatal({ err: error }, `Could not connect to MongoDB. Hint: ${explain(error)}`);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
