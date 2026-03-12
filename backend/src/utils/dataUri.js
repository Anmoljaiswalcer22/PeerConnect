import { ApiError } from './ApiError.js';

export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3 MB
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const FILE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const DATA_URI = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-z0-9+/]+={0,2})$/i;

/**
 * Parse and check a base64 data URI. Returns { mimeType, bytes }.
 * The allowed types and size limit are enforced on the server, not trusted from the client.
 */
export function inspectDataUri(dataUri, { allowed, maxBytes }) {
  const match = DATA_URI.exec(dataUri);
  if (!match) throw ApiError.badRequest('File data is not a valid base64 data URI');

  const mimeType = match[1].toLowerCase();
  if (!allowed.includes(mimeType)) {
    throw ApiError.badRequest(`Files of type ${mimeType} are not allowed`);
  }

  const bytes = Buffer.byteLength(match[2], 'base64');
  if (bytes > maxBytes) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', `File is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB)`);
  }

  return { mimeType, bytes };
}
