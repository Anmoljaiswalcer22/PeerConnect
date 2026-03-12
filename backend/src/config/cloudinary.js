import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

if (env.uploadsEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function assertEnabled() {
  if (!env.uploadsEnabled) {
    throw new ApiError(
      503,
      'UPLOADS_DISABLED',
      'File uploads are not configured on this server. Add the CLOUDINARY_* environment variables.',
    );
  }
}

/**
 * Upload a base64 data URI. Images are stored as "image" resources (so
 * Cloudinary can serve resized versions); everything else as "raw".
 */
export async function uploadDataUri(dataUri, { folder, resourceType = 'image', filename } = {}) {
  assertEnabled();
  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `peerconnect/${folder}`,
      resource_type: resourceType,
      ...(filename && { filename_override: filename, use_filename: true, unique_filename: true }),
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (err) {
    logger.error({ err }, 'Cloudinary upload failed');
    throw new ApiError(502, 'UPLOAD_FAILED', 'The file could not be uploaded. Please try again.');
  }
}

/** Best-effort delete: never fails the request that triggered it. */
export async function deleteAsset(publicId, resourceType = 'image') {
  if (!env.uploadsEnabled || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    logger.warn({ err, publicId }, 'Cloudinary delete failed');
  }
}
