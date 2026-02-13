import { z } from 'zod';

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .email('Enter a valid email address');

const fullName = z
  .string({ required_error: 'Full name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be at most 50 characters');

export const signupSchema = z
  .object({
    fullName,
    email,
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      // bcrypt only uses the first 72 bytes
      .max(72, 'Password must be at most 72 characters')
      .regex(/[A-Za-z]/, 'Password must contain a letter')
      .regex(/\d/, 'Password must contain a number'),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').max(72),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    fullName: fullName.optional(),
    // base64 data URI from the browser; type/size are checked again in the service
    profilePic: z.string().startsWith('data:image/', 'Profile picture must be an image').max(3_000_000).optional(),
  })
  .strict()
  .refine((v) => v.fullName !== undefined || v.profilePic !== undefined, {
    message: 'Nothing to update',
  });
