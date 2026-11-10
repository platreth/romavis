import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url().default('postgres://romavis:romavis@localhost:5433/romavis'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('127.0.0.1'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Comma-separated origins allowed to send state-changing requests. */
  APP_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000'),
});

export const env = schema.parse(process.env);
export const allowedOrigins = new Set(env.APP_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean));
