import { z } from 'zod';
import { objectId } from './common.js';

export const sendMessageSchema = z
  .object({
    text: z.string().trim().max(2000, 'Message must be at most 2000 characters').default(''),
    clientMessageId: z.string().uuid('clientMessageId must be a UUID'),
    attachment: z
      .object({
        // ~3 MB file → ~4.2M base64 characters
        dataUri: z.string().startsWith('data:').max(4_300_000, 'File is too large'),
        name: z.string().trim().min(1).max(200),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((v) => v.text.length > 0 || v.attachment, {
    message: 'A message needs text or an attachment',
    path: ['text'],
  });

export const historyQuerySchema = z
  .object({
    before: objectId.optional(),
    after: objectId.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(30),
  })
  .refine((v) => !(v.before && v.after), { message: 'Use either before or after, not both' });
