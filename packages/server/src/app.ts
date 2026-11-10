import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { z } from 'zod';
import { SESSION_COOKIE, SESSION_TTL_MS, createSession, destroySession, login, register, sessionUser, type User } from './auth.ts';
import { cancelBuild, cityView, playerCityIds, queueBuild } from './city.ts';
import type { Clock } from './clock.ts';
import type { Db, Tx } from './db/client.ts';
import { GameError } from './errors.ts';
import { Scheduler } from './scheduler.ts';
import { currentWorld, findPlayer, joinWorld, ringCities, ringMap, type Player, type World } from './world.ts';

export interface AppOptions {
  db: Db;
  clock: Clock;
  allowedOrigins?: Set<string>;
  secureCookies?: boolean;
  rateLimit?: boolean;
}

const registerBody = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_-]{3,20}$/),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(200),
  locale: z.enum(['en', 'fr']).default('en'),
});
const loginBody = z.object({ identifier: z.string().trim().min(1).max(254), password: z.string().min(1).max(200) });
const buildBody = z.object({ building: z.string().min(1).max(32) });
const idParam = z.coerce.number().int().positive();
const ringParam = z.coerce.number().int().min(0).max(1000);

function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new GameError('invalid_input', 400);
  return r.data;
}

export async function buildApp(opts: AppOptions): Promise<{ app: FastifyInstance; scheduler: Scheduler }> {
  const { db, clock } = opts;
  const app = Fastify({ logger: false, bodyLimit: 16 * 1024 });
  const sockets = new Map<number, Set<WebSocket>>();
  const scheduler = new Scheduler(db, clock, (userId, message) => {
    for (const s of sockets.get(userId) ?? []) if (s.readyState === s.OPEN) s.send(JSON.stringify(message));
  });

  await app.register(cookie);
  await app.register(websocket, { options: { maxPayload: 1024 } });
  if (opts.rateLimit !== false) await app.register(rateLimit, { max: 600, timeWindow: '1 minute' });
  const authLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

  app.setErrorHandler((err: unknown, _req, reply) => {
    const e = err as { statusCode?: number; message?: string };
    if (err instanceof GameError) return reply.status(err.status).send({ error: err.code });
    if (e.statusCode === 429) return reply.status(429).send({ error: 'rate_limited' });
    if (e.statusCode && e.statusCode < 500) return reply.status(e.statusCode).send({ error: 'invalid_input' });
    console.error(err);
    return reply.status(500).send({ error: 'internal' });
  });

  // State-changing requests must come from our own pages.
  app.addHook('onRequest', async (req) => {
    if (req.method === 'GET' || req.method === 'HEAD' || !opts.allowedOrigins) return;
    const origin = req.headers.origin;
    if (origin && !opts.allowedOrigins.has(origin)) throw new GameError('bad_origin', 403);
  });

  const token = (req: FastifyRequest) => req.cookies[SESSION_COOKIE];
  const requireUser = async (req: FastifyRequest): Promise<User> => {
    const user = await sessionUser(db, clock, token(req));
    if (!user) throw new GameError('unauthenticated', 401);
    return user;
  };
  const requireWorld = async (): Promise<World> => {
    const world = await currentWorld(db);
    if (!world) throw new GameError('no_world', 404);
    return world;
  };
  const requirePlayer = async (req: FastifyRequest): Promise<{ user: User; world: World; player: Player }> => {
    const user = await requireUser(req);
    const world = await requireWorld();
    const player = await findPlayer(db, user.id, world.id);
    if (!player) throw new GameError('not_joined', 409);
    return { user, world, player };
  };
  const publicUser = (u: User) => ({ id: u.id, username: u.username, locale: u.locale });
  const setSession = async (reply: FastifyReply, userId: number) => {
    reply.setCookie(SESSION_COOKIE, await createSession(db, clock, userId), {
      httpOnly: true, sameSite: 'lax', secure: opts.secureCookies ?? false, path: '/', maxAge: SESSION_TTL_MS / 1000,
    });
  };

  app.post('/api/auth/register', authLimit, async (req, reply) => {
    const user = await register(db, clock, parse(registerBody, req.body));
    await setSession(reply, user.id);
    return { user: publicUser(user) };
  });

  app.post('/api/auth/login', authLimit, async (req, reply) => {
    const user = await login(db, parse(loginBody, req.body));
    await setSession(reply, user.id);
    return { user: publicUser(user) };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    await destroySession(db, token(req));
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/auth/me', async (req) => ({ user: publicUser(await requireUser(req)) }));

  app.get('/api/world', async (req) => {
    const user = await requireUser(req);
    const world = await requireWorld();
    const player = await findPlayer(db, user.id, world.id);
    return {
      serverTime: clock.now().getTime(),
      world: {
        id: world.id, slug: world.slug, speed: world.speed, ringsGenerated: world.ringsGenerated,
        startsAt: world.startsAt.getTime(), endsAt: world.endsAt.getTime(),
      },
      player: player ? { id: player.id, cityIds: await playerCityIds(db, player.id) } : null,
    };
  });

  app.post('/api/world/join', async (req) => {
    const user = await requireUser(req);
    const world = await requireWorld();
    const { player, cityId } = await joinWorld(db, clock, user, world.id);
    return { player: { id: player.id, cityIds: [cityId] } };
  });

  app.get('/api/world/rings/:n', async (req) => {
    await requireUser(req);
    const world = await requireWorld();
    return { landmasses: await ringMap(db, world.id, parse(ringParam, (req.params as { n: string }).n)) };
  });

  app.get('/api/world/rings/:n/cities', async (req) => {
    await requireUser(req);
    const world = await requireWorld();
    return { cities: await ringCities(db, world.id, parse(ringParam, (req.params as { n: string }).n)) };
  });

  app.get('/api/cities/:id', async (req) => {
    const { player } = await requirePlayer(req);
    await scheduler.processDue();
    const city = await cityView(db, player.id, parse(idParam, (req.params as { id: string }).id));
    return { serverTime: clock.now().getTime(), city };
  });

  /** Run a city command: catch the world up, apply it in one transaction, return the new state. */
  const command = async (req: FastifyRequest, run: (ctx: { tx: Tx; now: Date; world: World; player: Player; cityId: number }) => Promise<void>) => {
    const { world, player } = await requirePlayer(req);
    const cityId = parse(idParam, (req.params as { id: string }).id);
    await scheduler.processDue();
    const now = clock.now();
    if (now >= world.endsAt) throw new GameError('round_over', 409);
    await db.transaction((tx) => run({ tx, now, world, player, cityId }));
    scheduler.wake();
    return { serverTime: clock.now().getTime(), city: await cityView(db, player.id, cityId) };
  };

  app.post('/api/cities/:id/build', (req) =>
    command(req, ({ tx, now, world, player, cityId }) =>
      queueBuild(tx, now, world.speed, player.id, cityId, parse(buildBody, req.body).building)));

  app.delete('/api/cities/:id/build/:orderId', (req) =>
    command(req, ({ tx, now, world, player, cityId }) =>
      cancelBuild(tx, now, world.speed, player.id, cityId, parse(idParam, (req.params as { orderId: string }).orderId))));

  app.get('/ws', { websocket: true }, async (socket, req) => {
    const user = await sessionUser(db, clock, token(req));
    if (!user) return socket.close(4401, 'unauthenticated');
    const set = sockets.get(user.id) ?? new Set();
    sockets.set(user.id, set.add(socket));
    socket.on('close', () => {
      set.delete(socket);
      if (set.size === 0) sockets.delete(user.id);
    });
  });

  return { app, scheduler };
}
