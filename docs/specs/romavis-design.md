# Romavis — Design (v2, MVP-scoped)

> Single source of truth. Supersedes `game-design-document.md` and `epic-1-core-engine.md`.
> `assets.md` remains valid only for its MVP section, as amended in §11 here.
> Status: draft for review. Items marked **[call]** are decisions made while writing this
> document and not yet confirmed by the project owner. They are listed again in §13.

---

## 1. Intent

Romavis is a browser strategy game set on the Mediterranean coast during the late Roman
Republic. Players found a city, grow its economy, raise troops, and compete in alliances
over a round that lasts a few weeks.

**Why it exists:** persistent browser strategy games are fun, but the established ones sell
gameplay advantages and reward being online at 3 a.m. Romavis is the same kind of game with
neither: nobody can buy power, and nobody has to click every five minutes or set alarms.

**Romavis is its own game.** It belongs to the city-building MMO strategy genre, but its
rosters, numbers, formulas, map structure and interface are designed here. No data, text,
art, layout or internal naming is taken from any other game. Where this document and an
older document in this repo disagree, this document wins.

## 2. Goals, non-goals, anti-goals

**Goals**

1. A first playable version that a small group (20–200 people) can actually finish a round of.
2. Every rule in the game is implemented once, in shared code, and used by both server and client.
3. The server is always right: no state lives only in memory, and a restart loses nothing.
4. French and English from the first screen.
5. Desktop first; every action also reachable by touch (no hover-only or right-click-only actions).

**Non-goals for the MVP** (see §12 for when they return)

- Gods, divine powers, mythical units, heroes
- Research tree
- Naval combat (ships are transport only)
- Multiple simultaneous worlds, world admin UI beyond a CLI
- Shop, payments, skins
- Forums, pacts, attack planner, city manager dashboards
- Sound, animation beyond simple movement markers
- Native mobile app

**Anti-goals** (the game has failed if any of these become true)

- Money buys any gameplay advantage.
- Playing well requires repetitive clicking on a timer, or a script.
- Playing well requires being awake at night.
- A world feels empty because it was sized for more players than it has.
- A rule exists in two implementations that can drift apart.

## 3. Identity

| | |
|---|---|
| Name | **Romavis** (the name "Imperium" is retired) |
| Setting | Late Republic, roughly 130–30 BC. No imperial-era content (no emperors, no Hadrian's Wall). |
| Tone | Historical, not mythological, in the MVP. Religion arrives later as Roman cult practice (augury, temples, festivals), not as borrowed Greek monsters. |
| Alliance word | **Foedus** (a treaty-bound league). "Legion" is never used for alliances; it is a military term. |
| Score word | **Gloria** |
| Languages | FR + EN. All display strings are i18n keys; code identifiers are plain English. |

## 4. Round structure

A **world** is one round. **[call]**

- Length: **28 days** at speed 1. Speed is a world setting (1–4) that divides all durations
  and multiplies production.
- One world open at a time in the MVP.
- The round ends at a fixed timestamp announced at creation. Final rankings are frozen and
  the world becomes read-only.
- Winner: the Foedus with the most Gloria, and separately the top individual player.
- **Beginner protection:** 72 h ÷ speed, or until the player launches their first attack on
  another player, whichever comes first.
- **Night watch [call]:** each player picks one fixed 8-hour window per round. During it,
  their cities defend at +100 %. This replaces server-wide night bonuses and removes the
  need to be awake.

## 5. World and map

### 5.1 Structure

- The world is a continuous 2D plane in **world units** (floats allowed for positions,
  integers stored ×100).
- **Landmasses** are placed on the sea. Each has 6–10 **city sites** and 3 **native
  settlements**, each with its own coordinates.
- Distance is always Euclidean between the two sites' own coordinates, so two cities on the
  same landmass are never at distance zero.

### 5.2 Sizing — the world grows with its players

There is no fixed 1000×1000 map. Landmasses are generated in rings around the centre,
deterministically from the world seed, **only as they are needed**:

- At creation: ring 0 and ring 1 (about 12 landmasses, ~100 city sites).
- When fewer than 20 % of generated city sites are free, the next ring is generated.
- New players are placed on the free site closest to the centre on a landmass that already
  has at least one player, falling back to the closest empty landmass.

Result: density stays roughly constant whether the world has 20 players or 2,000.

Generation parameters (starting values): landmass spacing ≥ 18 units, site spacing ≥ 2 units,
ring width 40 units.

### 5.3 Native settlements

Neutral villages. The relationship is **per player**, never shared, so one player cannot
spoil another's income.

- **Tribute:** each native settlement on a player's landmass pays that player a trickle of
  resources that accumulates up to an 8-hour cap. Collecting is one action for all
  settlements at once, whenever the player likes. No timers to hit.
- **Standing** (0–100, per player per settlement): tribute rate scales with standing.
  Standing rises slowly on its own.
- **Raid:** a player may attack a settlement with troops for a one-off haul. This costs
  standing with that settlement and fights its garrison (which scales with the settlement's
  level and the age of the round).

## 6. Economy

### 6.1 Resources

| Resource | Produced by | Notes |
|---|---|---|
| Timber | Lignarium | |
| Stone | Lapicidina | |
| Iron | Ferraria | |
| Population | Fundus (capacity, not a flow) | Consumed by building levels and units |

All amounts are **integers**. Production accrues lazily (see §9.3).

### 6.2 Buildings (MVP: 9)

| Building | Role | Max level |
|---|---|---|
| Forum | Unlocks buildings, speeds construction | 20 |
| Lignarium | Timber per hour | 20 |
| Lapicidina | Stone per hour | 20 |
| Ferraria | Iron per hour | 20 |
| Fundus | Population capacity | 20 |
| Horreum | Storage capacity | 20 |
| Castra | Recruits land units, speeds recruitment | 20 |
| Murus | City wall, defence multiplier | 20 |
| Portus | Builds transport ships (Milestone 2) | 10 |

Prerequisites: Castra needs Forum 3. Murus needs Forum 5. Portus needs Forum 8.

**Formulas (values in `shared/src/data.ts`, tuned with the economy simulator, §10):**

```
cost(building, L)       = baseCost[building] × 1.32^(L−1)          per resource, rounded
buildTime(building, L)  = baseTime[building] × 1.48^(L−1) ÷ (1 + 0.05 × forumLevel) ÷ speed
production(L)           = 30 × L × 1.08^L × speed                   per hour
storage(L)              = 1200 × 1.22^(L−1)                         per resource
populationCap(L)        = 80 × 1.17^(L−1)
wallBonus(L)            = 0.04 × L                                  (+80 % at level 20)
```

With these values the simulator's always-online player maxes the six economy buildings
around day 16 of 28 with nothing spent on troops, and reaches Forum 3 within the first
half day.

A new city starts with Forum 1, the three producers at 1, Fundus 1, Horreum 1 and
400 of each resource.

### 6.3 Build queue

- **3 slots** per city, for everyone. **[call]**
- Resources are deducted when an item is queued. Population is a capacity: levels that
  are built or queued count against it.
- Items run one after another. Cancelling refunds 100 % and shifts the queue. An order
  cannot be cancelled while a later order depends on it (a higher level of the same
  building, or a building it is a prerequisite for).
- Prerequisites are checked when queueing only. Buildings cannot be demolished in the MVP,
  so a prerequisite can never be lost afterwards.

## 7. Military (Milestone 2)

### 7.1 Units

Three classes: **infantry**, **cavalry**, **ranged**. Each unit attacks as its class and
has a defence value against each class.

| Unit | Class | Role | Attack | Def vs inf | Def vs cav | Def vs rng | Speed | Carry | Pop |
|---|---|---|---|---|---|---|---|---|---|
| Hastatus | infantry | Balanced line infantry | 10 | 10 | 6 | 8 | 6 | 20 | 1 |
| Triarius | infantry | Defensive spearman | 5 | 14 | 20 | 6 | 5 | 10 | 1 |
| Sagittarius | ranged | Defensive archer | 8 | 6 | 4 | 16 | 6 | 10 | 1 |
| Eques | cavalry | Fast raider | 28 | 8 | 10 | 4 | 12 | 60 | 3 |
| Navis oneraria | ship | Transport, no combat | — | — | — | — | 10 | — | 5 |

Speed is world units per hour at speed 1. A transport carries 25 population of troops.
Costs and recruitment times live in `shared/data`. These are starting values.

### 7.2 Movements

- Types: `attack`, `support`, `raid_natives`, `return`. (`transport` of resources: Milestone 3.)
- **Same landmass:** army travels by land at the speed of its slowest unit.
- **Different landmass:** the army needs enough transports for its population and travels
  at ship speed. Ships return with the survivors.
- Travel time = distance ÷ speed ÷ world speed, rounded up to the second.
- A movement can be recalled during its first 5 minutes ÷ speed; it returns taking as long
  as it has travelled.
- A player sees their own movements, and incoming movements against their cities (type and
  arrival time, not composition). Nothing else is ever sent to the client.

### 7.3 Units away from home

Every stack of units has a **home city** and a **location**:

```
UnitStack { home_city_id, location_city_id | movement_id, unit_type, count }
```

Units supporting another city are stacks whose location is that city. They defend it, cost
population in their home city, and can be recalled by their owner or sent home by the host.

### 7.4 Combat — Romavis formula

Resolved in one step at arrival. Deterministic given the stored seed.

```
A_c   = total attack of attackers of class c            (c ∈ infantry, cavalry, ranged)
A     = Σ A_c
D_c   = total defence of all defenders against class c
D     = Σ (A_c ÷ A) × D_c                               (defence weighted by what is attacking)
D     = D × (1 + wallBonus) × (2 if defender's night watch is active) + cityBase
luck  = uniform in [−0.10, +0.10] from the stored seed
r     = A × (1 + luck) ÷ D
q     = max(r, 1 ÷ r)

winner's losses = 0.5 × q^−1.5      (fraction of every stack)
loser's losses  = min(1, 0.5 × q^1.5)
attacker wins if r > 1
```

- An even fight (q = 1) costs both sides half. At q ≈ 1.6 the loser is wiped out.
- `cityBase = 20 × (1 + murusLevel)` so an empty city is not free.
- Losses are applied per stack with rounding that preserves the totals.
- If the attacker wins, survivors loot up to their total carry, split evenly across the
  three resources, never taking the Horreum's protected share (10 % of capacity).
- Surviving attackers return automatically. Surviving defenders stay.
- Both sides get a **battle report** containing the inputs, seed, luck, and losses.

### 7.5 Gloria

```
Gloria = building points (Σ level² over buildings, all cities)
       + battle points  (population value of enemy units destroyed)
```

Foedus Gloria is the sum of its members'.

## 8. Social (Milestone 3)

- **Foedus:** create, invite, join, leave, kick. Roles: leader, officer, member.
  Cap: **max(5, 10 % of the world's active players)**, recomputed daily, never shrinking
  below current membership. **[call]**
- **Messages:** player to player, and one Foedus-wide thread.
- **Rankings:** players and Foedera by Gloria, recomputed every 10 minutes.
- **Reports:** battle, raid, support arrival. Shareable by unguessable link.
- **Inactive players:** after 7 days ÷ speed without login, cities become neutral and
  raidable; they stay on the map.
- **Conquest [call]:** a city can be captured by winning an attack that includes a
  **Colonia** unit (expensive, slow, 20 pop) while the defender has no surviving troops.
  A player's last city cannot be captured. Founding a second city on a free site uses the
  same unit. City count is limited by Gloria thresholds defined in `shared/data`.

## 9. Architecture

### 9.1 Stack **[call]**

One language end to end, so rules are written once.

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces |
| `packages/shared` | TypeScript. Game data (JSON) + pure functions for every formula. No I/O. |
| `packages/server` | Node 24 + Fastify + PostgreSQL 16 + Drizzle ORM + `ws` |
| `packages/client` | React + Vite + TypeScript. Map in PixiJS 8 driven imperatively (not `@pixi/react`) with `pixi-viewport`. Panels in React. TanStack Query + Zustand. `react-i18next`. |
| Auth | Server-side sessions in Postgres, httpOnly SameSite cookie, argon2id |
| Local dev | `docker compose` for Postgres only |
| Hosting | One small VPS. No Redis, no queue service. |

The earlier Elixir/Phoenix plan is dropped: it is a fine platform, but it would put the
rules in two languages (server and client tools), and nothing at this scale needs it.

### 9.2 Source of truth

**PostgreSQL holds all state.** The server process keeps nothing that cannot be rebuilt
from the database. Any in-memory structure (the next-event timer) is a cache.

### 9.3 Time, events and commands

**Clock.** All code takes "now" from an injected clock. Tests and the simulator control it.

**Lazy resources.** Reads never write: a view computes current amounts on the fly. A city stores `timber, stone, iron, resources_at`. `settle(city, t)`
adds production from `resources_at` to `t`, caps at storage, and sets `resources_at = t`.
It is called, inside the same transaction, **before** anything reads or changes a city's
resources or production rate: every command, every event that touches the city.

**Events.** One table:

```
game_event { id, world_id, type, due_at, payload jsonb, done_at null }
index on (world_id, due_at) where done_at is null
```

Types: `build_done`, `recruit_done`, `movement_arrive`, `round_end`.

**Scheduler.** One loop per server process:

1. Select the earliest undone events with `due_at <= now`, ordered by `(due_at, id)`,
   `FOR UPDATE SKIP LOCKED`.
2. For each, in one transaction: run the handler **with `t = due_at` as the effective
   time** (not the wall clock), set `done_at`, commit.
3. Sleep until the next `due_at`, or until a new event is inserted. With a single server
   process the wake-up is an in-process call; LISTEN/NOTIFY is only needed if a second
   process is ever added.

Consequences: after downtime, events replay in order with the right timestamps; a crash
mid-handler rolls back and the event runs again; handlers must be idempotent only at the
transaction level, which the database gives us.

**Commands** (build, recruit, send army, …) each run in one transaction that takes
`SELECT … FOR UPDATE` on the city row(s) involved, in ascending id order, then settles,
validates using `shared` rules, writes, and inserts any events. Two simultaneous requests
cannot double-spend.

**Ordering rule:** before a command reads a city, all due events for the world up to `now`
have been processed. The command endpoint triggers the scheduler and waits if any are due.

### 9.4 Real-time

One WebSocket per logged-in player, authenticated by the session cookie. The server pushes
only to the affected player: `city_updated`, `movement_started`, `incoming`, `report`,
`message`. There is no world-wide broadcast of anyone's movements. The client treats pushes
as "refetch this" hints, so a missed push is harmless.

### 9.5 Map data

Landmasses and sites are small (hundreds of rows). The client fetches them by **ring**
(`GET /api/world/rings/:n`), cacheable with an ETag, and fetches city ownership per ring
with a short TTL. No arbitrary bounding-box queries.

### 9.6 Data model

```
user            { id, username unique, email unique, password_hash, locale, is_admin, status, created_at }
session         { id, user_id, expires_at, created_at }
world           { id, slug, seed, speed, starts_at, ends_at, status, rings_generated }
player          { id, user_id, world_id, foedus_id null, night_watch_start, protected_until,
                  gloria_build, gloria_battle, last_seen_at }           unique (user_id, world_id)
landmass        { id, world_id, ring, x, y }
site            { id, landmass_id, kind: city|native, x, y }
city            { id, world_id, site_id unique, player_id null, name,
                  timber, stone, iron, resources_at, levels jsonb }
build_order     { id, city_id, position, building, target_level, event_id null }
recruit_order   { id, city_id, building, position, unit_type, count, done, event_id null }
unit_stack      { id, home_city_id, city_id null, movement_id null, unit_type, count }
movement        { id, world_id, type, player_id, from_city_id, to_site_id,
                  depart_at, arrive_at, recalled bool, loot jsonb null }
native_relation { player_id, site_id, standing, standing_at, tribute_at }   pk (player_id, site_id)
report          { id, world_id, player_id, kind, data jsonb, share_token, created_at, read_at null }
foedus          { id, world_id, name, tag }
message         { id, world_id, from_player_id, to_player_id null, foedus_id null, body, created_at }
game_event      (see §9.3)
```

Every world-scoped reference points to `player`, never to `user`.

### 9.7 API (MVP)

```
POST /api/auth/register | login | logout        GET /api/auth/me
POST /api/auth/password-reset/request | confirm        (Milestone 3)
GET  /api/world                                 POST /api/world/join
GET  /api/world/rings/:n                        GET  /api/world/rings/:n/cities
GET  /api/cities                                GET  /api/cities/:id
POST /api/cities/:id/build                      DELETE /api/cities/:id/build/:orderId
POST /api/cities/:id/recruit                    POST /api/cities/:id/collect-tribute
POST /api/movements                             POST /api/movements/:id/recall
GET  /api/movements                             GET  /api/reports   GET /api/reports/:id
GET  /api/rankings                              POST /api/simulate   (runs shared combat)
WS   /ws
```

All inputs validated with schemas at the boundary. Rate limits on auth and on commands.

### 9.8 Abuse basics

- Email verification before joining a world; password reset by email.
- One player per user per world. Multi-accounting is against the rules; the admin CLI can
  list accounts sharing IP/device hints and ban.
- Names and messages: length limits, a word filter, a report button, admin ban.
- GDPR: account deletion endpoint, data export on request, a privacy page.

## 10. Testing and tuning

- `shared`: unit tests for every formula; property tests for combat (losses never exceed
  stacks, totals conserved, symmetric at q = 1, monotonic in q).
- `server`: integration tests against a real Postgres with a controlled clock: queue,
  cancel, restart mid-queue, concurrent commands, event replay after simulated downtime.
- **Economy simulator:** a script in `shared` that plays a scripted build order through a
  28-day round and prints the timeline. The starting numbers in this document are accepted
  only once the simulator shows a sensible curve (first Castra within an hour, first
  attack on day 1, level-20 buildings near the end of the round).
- `client`: a handful of end-to-end tests for the main loop.

## 11. Art for the MVP

No generated sprite pipeline yet. The MVP uses:

- Map: procedurally drawn landmasses (PixiJS Graphics), flat colours, simple site markers.
- City: a panel with building cards and vector icons, no illustrated city view.
- One consistent icon set for resources, buildings and units.

The illustrated city view and the asset pipeline in `assets.md` are revisited after
Milestone 3, with a Roman-only roster.

## 12. Milestones

Each milestone ends in something a person can play.

**M1 — A city that grows**
Accounts and sessions, one world created by CLI, world generation by rings, join and
placement, map with pan/zoom and site selection, city panel, the 6 economy buildings (Forum, three producers, Fundus, Horreum), 3-slot build
queue, lazy resources, event scheduler, FR/EN, economy simulator.
*Done when:* two people can register, land near each other, and build to Forum 5 while the
server is restarted in between without losing anything.

**M2 — Armies**
Castra, Murus and Portus, 4 land units and transports, unit stacks, movements, combat, loot,
reports, battle simulator, native tribute and raids, beginner protection, night watch,
incoming-attack push.
*Done when:* a player can raid natives, attack a neighbour across the sea, and both read a
correct report.

**M3 — A round**
Foedera, messages, rankings, Gloria, inactivity, Colonia (founding and capture), resource
transport, round end and frozen rankings, email verification and reset, abuse basics.
*Done when:* a closed test group plays a full round to its end.

**Later, in this order, each designed on its own before being built:**
naval combat → research → Roman religion (temples, augury, festivals) → siege engines →
planner and multi-city tools → illustrated art → cosmetics shop → multiple worlds and
alternative round modes.

## 13. Decisions to confirm

Made while writing; please confirm or change.

| # | Call | Alternative |
|---|---|---|
| 1 | TypeScript end to end (Fastify, Postgres, Drizzle) | Elixir/Phoenix as in the old GDD |
| 2 | Short rounds: 28 days, one world at a time | Long-running worlds of several months |
| 3 | Historical MVP, religion later and Roman | Gods and mythical units from the start |
| 4 | Per-player night watch window (+100 % defence, 8 h) | No night protection, or server-wide hours |
| 5 | 3 build slots | 5 |
| 6 | Foedus cap at 10 % of active players (min 5) | Fixed cap |
| 7 | Capture by Colonia unit against an emptied city | Multi-phase revolt or siege |
| 8 | Sessions in cookies | JWT + refresh tokens |
| 9 | Flat procedural art for the MVP | AI-generated sprites from the start |

Still open (not blocking M1): exact unit costs and times, native garrison curve, Gloria
thresholds for extra cities, word filter list.
