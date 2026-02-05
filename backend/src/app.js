import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { logger } from './utils/logger.js';
import { openApiSpec } from './docs/openapi.js';
import apiRoutes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Only these routes accept large bodies (base64 images/files). Everything else: 100 KB.
const LARGE_BODY_ROUTES = /^\/api\/(messages\/send\/|auth\/update-profile)/;
const smallJson = express.json({ limit: '100kb' });
const largeJson = express.json({ limit: '6mb' });

/**
 * Builds the Express app without starting a server, so tests can import it
 * with Supertest and Socket.IO can attach to the same HTTP server.
 */
export function createApp() {
  const app = express();

  // Render (and Vercel's /api proxy) sit in front of us; trust their
  // X-Forwarded-* headers so req.ip / req.secure are the real client values.
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');

  // API docs (registered before helmet's strict CSP, which would block the Swagger UI)
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'PeerConnect API' }));

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url.startsWith('/api/health') },
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    }),
  );
  app.use((req, res, next) => (LARGE_BODY_ROUTES.test(req.path) ? largeJson : smallJson)(req, res, next));
  app.use(cookieParser());

  app.get('/', (_req, res) => {
    res.json({ success: true, data: { name: 'PeerConnect API', health: '/api/health', docs: '/api/docs' } });
  });

  app.use('/api', apiLimiter, apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
