import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { and, eq, gt, or, sql } from 'drizzle-orm';
import type { Clock } from './clock.ts';
import type { Db } from './db/client.ts';
import { sessions, users } from './db/schema.ts';
import { GameError } from './errors.ts';

export const SESSION_COOKIE = 'rv_session';
export const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;

export type User = typeof users.$inferSelect;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function register(
  db: Db, clock: Clock, input: { username: string; email: string; password: string; locale: string },
): Promise<User> {
  const existing = await db.select({ username: users.username }).from(users).where(
    or(eq(sql`lower(${users.username})`, input.username.toLowerCase()), eq(sql`lower(${users.email})`, input.email.toLowerCase())),
  );
  if (existing.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) throw new GameError('username_taken', 409);
  if (existing.length) throw new GameError('email_taken', 409);
  const passwordHash = await hash(input.password);
  try {
    const [user] = await db.insert(users).values({
      username: input.username, email: input.email, passwordHash, locale: input.locale, createdAt: clock.now(),
    }).returning();
    return user!;
  } catch (e) {
    // Lost a race against a concurrent registration with the same name or email.
    if ((e as { code?: string }).code === '23505' || (e as { cause?: { code?: string } }).cause?.code === '23505') {
      throw new GameError('username_taken', 409);
    }
    throw e;
  }
}

export async function login(db: Db, input: { identifier: string; password: string }): Promise<User> {
  const id = input.identifier.toLowerCase();
  const [user] = await db.select().from(users).where(
    or(eq(sql`lower(${users.username})`, id), eq(sql`lower(${users.email})`, id)),
  );
  // Same error for unknown user and wrong password.
  if (!user || !(await verify(user.passwordHash, input.password))) throw new GameError('invalid_credentials', 401);
  if (user.status !== 'active') throw new GameError('account_banned', 403);
  return user;
}

export async function createSession(db: Db, clock: Clock, userId: number): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const now = clock.now();
  await db.insert(sessions).values({
    tokenHash: hashToken(token), userId, createdAt: now, expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
  });
  return token;
}

export async function sessionUser(db: Db, clock: Clock, token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const [row] = await db.select({ user: users }).from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, clock.now())));
  if (!row || row.user.status !== 'active') return null;
  return row.user;
}

export async function destroySession(db: Db, token: string | undefined): Promise<void> {
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
