import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { z } from 'zod';
import { SESSION_COOKIE, SESSION_TTL_MS, createSession, destroySession, login, register, sessionUser, type User } from './auth.ts';
import { eq } from 'drizzle-orm';
import { UNITS } from '@romavis/shared';
import { cancelBuild, cityView, playerCityIds, queueBuild } from './city.ts';
import { players } from './db/schema.ts';
import {
  armyView, collectTribute, listReports, markReportsRead, movementsView, recallMovement, recruit, returnSupport, sendMovement,
} from './military.ts';
import type { Push } from './stacks.ts';
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
const recruitBody = z.object({ unit: z.string().min(1).max(32), count: z.number().int().min(1).max(100_000) });
const unitCount = z.number().int().min(0).max(1_000_000).optional();
const sendBody = z.object({
  fromCityId: z.number().int().positive(),
  toSiteId: z.number().int().positive(),
  type: z.enum(['attack', 'support', 'raid']),
  units: z.object(Object.fromEntries(UNITS.map((u) => [u, unitCount])) as Record<(typeof UNITS)[number], typeof unitCount>).strict(),
});
const supportBody = z.object({ hostCityId: z.number().int().positive(), homeCityId: z.number().int().positive() });
const nightWatchBody = z.object({ startHour: z.number().int().min(0).max(23) });
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
  const publicPlayer = async (p: Player) => ({
    id: p.id, cityIds: await playerCityIds(db, p.id), protectedUntil: p.protectedUntil?.getTime() ?? null,
    nightWatchStart: p.nightWatchStart, gloriaBattle: p.gloriaBattle,
  });
  const cityResponse = async (player: Player, cityId: number) => {
    const city = await cityView(db, player.id, cityId);
    return { serverTime: clock.now().getTime(), city: { ...city, ...(await armyView(db, player, cityId, city.landmassId)) } };
  };
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
      player: player ? await publicPlayer(player) : null,
    };
  });

  app.post('/api/world/join', async (req) => {
    const user = await requireUser(req);
    const world = await requireWorld();
    const { player, cityId } = await joinWorld(db, clock, user, world.id);
    void cityId;
    return { player: await publicPlayer(player) };
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
    return cityResponse(player, parse(idParam, (req.params as { id: string }).id));
  });

  /** Run a command: catch the world up, apply it in one transaction, then tell affected players. */
  const command = async (req: FastifyRequest, run: (ctx: { tx: Tx; now: Date; world: World; player: Player }) => Promise<Push[] | void>) => {
    const { world, player } = await requirePlayer(req);
    await scheduler.processDue();
    const now = clock.now();
    if (now >= world.endsAt) throw new GameError('round_over', 409);
    const pushes = await db.transaction((tx) => run({ tx, now, world, player }));
    scheduler.wake();
    if (pushes) void scheduler.push(pushes).catch(() => {});
    return player;
  };
  const cityId = (req: FastifyRequest) => parse(idParam, (req.params as { id: string }).id);

  app.post('/api/cities/:id/build', async (req) => {
    const id = cityId(req);
    const { building } = parse(buildBody, req.body);
    const player = await command(req, ({ tx, now, world, player }) => queueBuild(tx, now, world.speed, player.id, id, building));
    return cityResponse(player, id);
  });

  app.delete('/api/cities/:id/build/:orderId', async (req) => {
    const id = cityId(req);
    const orderId = parse(idParam, (req.params as { orderId: string }).orderId);
    const player = await command(req, ({ tx, now, world, player }) => cancelBuild(tx, now, world.speed, player.id, id, orderId));
    return cityResponse(player, id);
  });

  app.post('/api/cities/:id/recruit', async (req) => {
    const id = cityId(req);
    const body = parse(recruitBody, req.body);
    const player = await command(req, ({ tx, now, world, player }) => recruit(tx, now, world.speed, player.id, id, body.unit, body.count));
    return cityResponse(player, id);
  });

  app.post('/api/cities/:id/collect-tribute', async (req) => {
    const id = cityId(req);
    const player = await command(req, ({ tx, now, world, player }) => collectTribute(tx, now, world, player, id));
    return cityResponse(player, id);
  });

  app.get('/api/movements', async (req) => {
    const { player } = await requirePlayer(req);
    await scheduler.processDue();
    return { serverTime: clock.now().getTime(), ...(await movementsView(db, player)) };
  });

  app.post('/api/movements', async (req) => {
    const body = parse(sendBody, req.body);
    const player = await command(req, ({ tx, now, world, player }) => sendMovement(tx, now, world, player, body));
    return { serverTime: clock.now().getTime(), ...(await movementsView(db, player)) };
  });

  app.post('/api/movements/:id/recall', async (req) => {
    const id = cityId(req);
    const player = await command(req, ({ tx, now, world, player }) => recallMovement(tx, now, world, player, id));
    return { serverTime: clock.now().getTime(), ...(await movementsView(db, player)) };
  });

  app.post('/api/support/return', async (req) => {
    const body = parse(supportBody, req.body);
    await command(req, ({ tx, now, world, player }) => returnSupport(tx, now, world, player, body.hostCityId, body.homeCityId));
    return { ok: true };
  });

  app.get('/api/reports', async (req) => {
    const { player } = await requirePlayer(req);
    await scheduler.processDue();
    return { reports: await listReports(db, player) };
  });

  app.post('/api/reports/read', async (req) => {
    const { player } = await requirePlayer(req);
    await markReportsRead(db, player, clock.now());
    return { ok: true };
  });

  // The night watch window is chosen once and stays for the round.
  app.post('/api/player/night-watch', async (req) => {
    const { startHour } = parse(nightWatchBody, req.body);
    const player = await command(req, async ({ tx, player }) => {
      const [fresh] = await tx.select().from(players).where(eq(players.id, player.id)).for('update');
      if (fresh?.nightWatchStart != null) throw new GameError('night_watch_set', 409);
      await tx.update(players).set({ nightWatchStart: startHour }).where(eq(players.id, player.id));
    });
    return { player: await publicPlayer({ ...player, nightWatchStart: startHour }) };
  });

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
