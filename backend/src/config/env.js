import 'dotenv/config';
import { z } from 'zod';

/**
 * All configuration comes from environment variables and is validated once at
 * startup. If anything is missing or malformed the server refuses to start and
 * prints exactly which variable is wrong, instead of failing later at runtime.
 */
const csv = (value) =>
  value
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean);

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),

  MONGODB_URI: z
    .string({ required_error: 'MONGODB_URI is required (see .env.example)' })
    .trim()
    .regex(/^mongodb(\+srv)?:\/\//, 'MONGODB_URI must start with mongodb:// or mongodb+srv://')
    .refine((v) => !v.includes('<db_password>') && !v.includes('<password>'), {
      message: 'MONGODB_URI still contains the <db_password> placeholder',
    }),
  MONGODB_DB_NAME: z.string().trim().min(1).default('peerconnect'),

  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required (see .env.example for how to generate one)' })
    .min(32, 'JWT_SECRET must be at least 32 characters long'),

  CLIENT_URLS: z.string().default('http://localhost:5173').transform(csv),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Optional: without these, profile pictures and attachments are disabled.
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Invalid environment configuration:\n');
  for (const issue of parsed.error.issues) {
    console.error(`   • ${issue.path.join('.') || 'env'}: ${issue.message}`);
  }
  console.error('\n   Fix your .env file (local) or Render environment variables (production).\n');
  process.exit(1);
}

const data = parsed.data;

export const env = Object.freeze({
  ...data,
  isProduction: data.NODE_ENV === 'production',
  isDevelopment: data.NODE_ENV === 'development',
  isTest: data.NODE_ENV === 'test',
  uploadsEnabled: Boolean(data.CLOUDINARY_CLOUD_NAME && data.CLOUDINARY_API_KEY && data.CLOUDINARY_API_SECRET),
});
