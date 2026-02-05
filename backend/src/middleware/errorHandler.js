import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/** Convert known library errors into ApiErrors with a sensible status code. */
function normalize(err) {
  if (err instanceof ApiError) return err;

  // Malformed JSON body sent by the client
  if (err?.type === 'entity.parse.failed') {
    return ApiError.badRequest('Request body is not valid JSON');
  }
  if (err?.type === 'entity.too.large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  if (err instanceof ZodError) {
    return ApiError.badRequest(
      'Validation failed',
      err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    );
  }
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return ApiError.badRequest(
      'Validation failed',
      Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    );
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return ApiError.conflict(`A record with this ${field} already exists`);
  }
  return null;
}

// Express recognises error handlers by their 4 arguments, so `next` must stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const known = normalize(err);
  const status = known?.statusCode ?? 500;

  if (status >= 500) {
    (req.log ?? logger).error({ err }, 'Unhandled error');
  }

  res.status(status).json({
    success: false,
    error: {
      code: known?.code ?? 'INTERNAL_ERROR',
      message: known?.message ?? (env.isProduction ? 'Something went wrong' : err.message),
      ...(known?.details && { details: known.details }),
    },
  });
}
