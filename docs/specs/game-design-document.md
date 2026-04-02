# Game Design Document — Imperium

> Roman Empire browser strategy MMO — free to play, no pay-to-win, skins-only monetization.

---

## Table of Contents

1. [Vision & Principles](#1-vision--principles)
2. [Epic 1 — Core Engine](#2-epic-1--core-engine)
3. [Epic 2 — Economy](#3-epic-2--economy)
4. [Epic 3 — Military](#4-epic-3--military)
5. [Epic 4 — Progression](#5-epic-4--progression)
6. [Epic 5 — Divine](#6-epic-5--divine)
7. [Epic 6 — Social](#7-epic-6--social)
8. [Epic 7 — Endgame](#8-epic-7--endgame)
9. [Epic 8 — UI & Frontend](#9-epic-8--ui--frontend)
10. [Monetization](#10-monetization)
11. [Tech Stack](#11-tech-stack)
12. [Data Model Overview](#12-data-model-overview)
13. [API Overview](#13-api-overview)
14. [Thematic Mapping (Grepolis → Imperium)](#14-thematic-mapping-grepolis--imperium)
15. [Open Questions](#15-open-questions)

---

## 1. Vision & Principles

### What is this?

A browser-based MMO strategy game inspired by Grepolis. Players build cities in the Roman Empire, raise armies, worship gods, form Legions, and compete for world domination. No gold, no pay-to-win — everyone plays on equal footing.

### Setting

The Roman Republic is fracturing. Ambitious leaders — the players — each control a fledgling settlement on the shores of the Mediterranean. Through construction, trade, military conquest, and divine favor, they must build a network of cities, forge powerful Legions, and ultimately claim dominion over the known world. The gods of Rome watch from Olympus, granting their favor to those who honor them.

### Core Principles

| Principle                      | Description                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| **No pay-to-win**        | Zero gameplay advantages for money. Monetization is skins only.                      |
| **Multi-world platform** | Admin opens new worlds throughout the year with different settings and rewards.      |
| **Fair competition**     | All players have the same tools, slots, and bonuses.                                 |
| **Responsive web**       | Desktop + mobile browser from day one. No native app.                                |
| **Bilingual**            | French + English at launch.                                                          |
| **Faithful mechanics**   | Core gameplay stays true to the original Grepolis design. Improvements where the original had pay-walls. |

### What we change from Grepolis

| Grepolis                          | Imperium                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| Gold currency (premium)           | Removed entirely                                             |
| Pay-to-win advisors               | Removed — key bonuses given to all players for free         |
| 1 build queue slot (+5 with gold) | 5 build queue slots for everyone                             |
| Olympic Games (gold cost)         | Replaced — TBD alternative                                  |
| Hero coins (gold purchase)        | Earned via quests + free daily refresh system                |
| Phoenician Trader (gold summon)   | Reworked — leveling system with XP, better trades over time |
| Instant finish (gold)             | Removed                                                      |
| Extra hero slots (gold)           | Earned via progression (Gloria levels)                       |
| Cosmetic customization            | Skin shop (cities, units, banners, avatars)                  |
| Basic attack planner (premium)    | **Advanced Attack Planner** — built-in for all, multi-wave timing, shared plans |
| Cluttered city management         | **Modern City Manager** — batch actions, overview dashboards, quick-switch |
| Manual farming village collection | **Auto-collect mode** + complete rework of Native Village system |
| Outdated 2010s UI                 | **Modern responsive UI** — clean, fast, mobile-friendly from day one |
| No quality-of-life tools          | **Built-in tools**: troop counter, travel time calculator, defense planner |

---

## 2. Epic 1 — Core Engine

### 2.1 Auth & Accounts

**One global account, multiple worlds.**

A player registers once, then joins any open world. Each world is an independent game instance.

#### Endpoints

| Method | Route                    | Description                                |
| ------ | ------------------------ | ------------------------------------------ |
| POST   | `/api/auth/register`   | Create account (username, email, password) |
| POST   | `/api/auth/login`      | Returns JWT access + refresh token         |
| POST   | `/api/auth/refresh`    | Rotate refresh token                       |
| POST   | `/api/auth/logout`     | Invalidate refresh token                   |
| GET    | `/api/auth/me`         | Profile + list of joined worlds            |
| GET    | `/api/worlds`          | List all worlds with status and settings   |
| POST   | `/api/worlds/:id/join` | Join a world → creates starting city      |

#### Data Model

```
User {
  id: UUID
  username: string (unique, 3-20 chars)
  email: string (unique)
  password_hash: string (bcrypt)
  locale: 'fr' | 'en'
  created_at: timestamp
  last_login: timestamp
  is_admin: boolean
  status: 'active' | 'banned'
}

PlayerWorld {
  id: UUID
  user_id: FK → User
  world_id: FK → World
  joined_at: timestamp
  status: 'active' | 'vacation' | 'eliminated' | 'restarted'
  points: integer
  rank: integer
  beginner_protection_until: timestamp | null
}
```

#### Rules

- JWT access token: 15min expiry
- Refresh token: 30 days, hashed in DB, rotated on use
- One account per email
- Can join multiple worlds simultaneously
- Players can restart in a world (lose everything, fresh start)
- Admin can ban players globally or per-world

### 2.2 World System

#### World Model

```
World {
  id: UUID
  name: string ("Roma", "Carthago", "Londinium"...)
  slug: string ("fr1", "en2")
  speed: number (1-5)
  unit_speed: number (1-5)
  conquest_type: 'revolt' | 'conquest'
  morale_enabled: boolean              // per-world option
  night_bonus: boolean
  night_bonus_start: string ("00:00")
  night_bonus_end: string ("08:00")
  max_players: number (default 1000)
  current_players: number
  alliance_max_members: number         // per-world option (50-300)
                                       // Display name: "Legion max members"
  beginner_protection_days: number (5)
  endgame_type: 'domination' | 'wonder'
                // Display names: 'Imperium mode' | 'Wonders of the Empire'
  status: 'open' | 'running' | 'endgame' | 'closed' | 'archived'
  created_at: timestamp
  opened_at: timestamp
  started_at: timestamp
  closed_at: timestamp | null
}
```

#### World Lifecycle

```
1. Admin creates world with settings → status: 'open'
   - World map generated (islands, native villages)
   - Players can register and join

2. Admin starts the world (or auto-start trigger) → status: 'running'
   - Game clock begins
   - New players can still join if under max_players

3. max_players reached → registration closes
   - Existing players keep playing

4. Victory condition met → status: 'endgame'
   - 14-day peace period
   
5. Peace period ends → status: 'closed'
   - World becomes read-only
   
6. Admin archives → status: 'archived'
   - Removed from active list, stats preserved
```

#### Admin World Management

| Method | Route                           | Description                    |
| ------ | ------------------------------- | ------------------------------ |
| POST   | `/api/admin/worlds`           | Create new world with settings |
| PATCH  | `/api/admin/worlds/:id`       | Update world settings          |
| POST   | `/api/admin/worlds/:id/start` | Start game clock               |
| POST   | `/api/admin/worlds/:id/close` | Force close world              |

### 2.3 Game Loop / Tick System

**Architecture**: Event queue with scheduled processing.

#### Event Model

```
GameEvent {
  id: UUID
  world_id: FK → World
  type: 'building' | 'recruitment' | 'movement' | 'research'
       | 'culture' | 'spell' | 'colonization' | 'revolt' | 'siege'
       // Note: 'culture' displays as 'gloria' in UI
  town_id: FK → Town
  player_id: FK → User
  payload: JSONB
  starts_at: timestamp
  completes_at: timestamp
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  created_at: timestamp
}
```

#### Processing

- **Timer-based** (Node.js): in-memory priority queue (min-heap by `completes_at`)
- Each world runs its own event processor
- `setTimeout` for next event; reschedule when new event inserted
- On server restart: reload pending events from DB

#### Resource Production (Lazy)

Not ticked. Calculated on-demand when player loads city or any action checks resources:

```
elapsed = NOW() - town.resources_updated_at
wood  += production_rate(lumber_level)  * elapsed_hours * world_speed
stone += production_rate(stoner_level)  * elapsed_hours * world_speed
silver += production_rate(ironer_level) * elapsed_hours * world_speed
cap each at warehouse_capacity(storage_level)
UPDATE town
```

#### Speed Multiplier

All durations divided by `world.speed`:

- 3h build at speed 1 → 1h at speed 3
- 18min recruit at speed 1 → 6min at speed 3
- Exception: Settlement Fleet 24h founding is NOT affected by speed

### 2.4 World Generation

#### Grid System

- **Coordinate space**: 1000 × 1000
- **100 oceans** in a 10×10 grid
- **Ocean ID**: `floor(y / 100) * 10 + floor(x / 100)`
- **Center**: oceans 44, 45, 54, 55

#### Island Model

```
Island {
  id: UUID
  world_id: FK → World
  x: integer (0-999)
  y: integer (0-999)
  ocean_id: integer (computed)
  type: 'large' | 'small'
  resource_bonus: '+wood' | '+stone' | '+silver' | null
  resource_penalty: '-wood' | '-stone' | '-silver' | null
  max_cities: integer
  available_slots: integer
  created_at: timestamp
}
```

#### Generation Algorithm

```
For each ocean (center outward):
  Core (44,45,54,55):        25 large + 12 small islands
  Ring 1 (adjacent to core): 20 large + 10 small
  Ring 2:                    15 large + 8 small
  Ring 3:                    10 large + 5 small
  Outer:                      5 large + 3 small

Per island:
  - Random (x, y) within ocean bounds
  - Min distance 8 units from any other island
  - Large: max_cities = random(8, 16), 8 native villages
  - Small: max_cities = random(1, 3), no native villages
  - Resource bonus: ~1/3 +wood/-stone, ~1/3 +stone/-silver, ~1/3 +silver/-wood
  - Bonus/penalty only applies to production at levels 20+ (±10%)
```

#### Starting City

When a player joins a world:

```
1. Verify world is open and has slots
2. Create PlayerWorld record
3. Find island with available_slots > 0
   - Prefer near center for early joiners
   - Late joiners placed in outer oceans
4. Create Town with starting buildings:
   - Curia 1, Villa Rustica 6, Horreum 3
     // Internal field names: senate 1, farm 6, warehouse 3
   - Timber Camp 3, Quarry 3, Silver Mine 3
   - Castra 1, Crypta 1, Templum 1, Fortification 1, Forum 1
     // Internal field names: barracks 1, cave 1, temple 1, wall 1, market 1
5. Grant 500 wood, 500 stone, 500 silver
6. Set beginner protection (5 days)
7. Auto-conquer 1st native village on island
8. Prompt god selection
```

---

## 3. Epic 2 — Economy

### 3.1 Resources

Three resources + population + divine favor:

| Resource   | Building    | Max Level | Notes                                  |
| ---------- | ----------- | --------- | -------------------------------------- |
| Wood       | Timber Camp | 40        | +/-10% island bonus at level 20+       |
| Stone      | Quarry      | 40        | +/-10% island bonus at level 20+       |
| Silver     | Silver Mine | 40        | +/-10% island bonus at level 20+       |
| Population | Villa Rustica | 45      | Consumed by buildings + units          |
| Favor      | Templum     | 30        | Per-god resource, generated by temples |

Production per level follows an exponential curve (exact values in game data JSON).

### 3.2 Buildings

22 buildings total. All built via Curia.

| Building        | Max Level | Key Dependencies                          |
| --------------- | --------- | ----------------------------------------- |
| Curia           | 25        | None                                      |
| Timber Camp     | 40        | None                                      |
| Quarry          | 40        | None                                      |
| Silver Mine     | 40        | None                                      |
| Villa Rustica   | 45        | None                                      |
| Horreum         | 35        | None                                      |
| Castra          | 30        | Silver Mine 1, Curia 2, Villa Rustica 3   |
| Portus          | 30        | Curia 14, Timber Camp 15, Silver Mine 10  |
| Schola          | 36        | Curia 8, Castra 7                         |
| Templum         | 30        | Quarry 1                                  |
| Forum           | 30        | Curia 5, Horreum 5                        |
| Crypta          | 10        | Curia 8, Silver Mine 8                    |
| Fortification   | 25        | Curia 5, Templum 3                        |
| Praetorium      | 1 (fixed) | None                                      |

<!-- Internal field names remain: senate, farm, warehouse, barracks, harbour, academy, temple, market, cave, wall, agora -->

**Special buildings** (choose 1 per tier, 2 per city):

Left tier (Curia 22 required):

- Amphitheatre → Gloria events
- Thermae → +10% population
- Bibliotheca → +12 research points
- Pharos → +15% fleet speed

Right tier (Curia 22 required):

- Turris → +10% defense
- Sacellum → +5 temple levels for favor
- Augur → reveals enemy espionage
- Taberna → better market rates

### 3.3 Build Queue

**5 slots for every player** (no premium differentiation).

- Queued buildings start automatically when the previous one finishes
- Cancel: refund resources, shift queue
- Dependencies checked at queue time AND at build start
- If a dependency is no longer met (building demolished), build fails and refunds

### 3.4 Native Villages

8 per large island, shared among all island players.

**Conquest**: Players start with 1 village. Must defeat resistance to conquer more (up to 8). Resistance scales from trivial (1 Velites) to serious (300 Velites + Praetorians + Equites + Fortification 20).

**Collection**: Demand or Loot at timed intervals:

- Without Booty research: 5min, 20min, 2h, 5h
- With Booty research: + 10min, 40min, 4h, 8h/10h intervals
- Loot = 2× resources but reduces mood
- Mood recovers over time; low mood = risk of failure

**Village levels**: 1-6, each level increases resource output. Upgrading costs resources.

### 3.5 Horreum & Crypta

- **Horreum**: stores wood/stone/silver. Capacity per level (300 at L1 → 28,142 at L35).
  - Ceramics research: +2,500 capacity
  - Hidden Stash: 100 per resource per level (protected from looting)
- **Crypta**: stores silver for espionage. Level 10 = unlimited silver storage.

### 3.6 Forum & Trade

- Send resources to own cities or Legion members
- Trade capacity increases with Forum level
- Exchange ratios are 1:1 between own cities
- Trading with other players: configurable ratios

### 3.7 Mercator (Reworked)

Original Grepolis: Phoenician Trader, summoned with gold, offers resource trades.

**New system — Leveling Trader**:

```
MercatorTrader {
  // Internal field name: phoenician_trader
  player_world_id: FK → PlayerWorld
  level: integer (1-10)
  xp: integer
  last_trade_at: timestamp
}
```

- Available to all players for free
- Starts at level 1 with basic trade ratios
- Gains XP with each trade
- Higher levels unlock:
  - Better exchange rates
  - Rare resource bundles
  - Bulk trades
  - Favor-for-resources trades
- Gloria point bonus at certain levels
- Resets per world (not global)

> **TBD**: Exact XP curve, trade offers per level, GP rewards.

### 3.8 Acceptance Criteria — Economy

- [ ] All 22 buildings constructible with correct costs and times
- [ ] 5 build queue slots working with auto-chain
- [ ] Resource production matches game data per level
- [ ] Horreum capacity limits enforced
- [ ] Native villages collectible at correct intervals
- [ ] Native village mood system working
- [ ] Forum trades between cities and players
- [ ] Mercator leveling system functional
- [ ] Special buildings enforce 1-per-tier limit

---

## 4. Epic 3 — Military

### 4.1 Units

**8 land units**:

| Unit        | Type         | Attack Type | Pop | Key Role                         |
| ----------- | ------------ | ----------- | --- | -------------------------------- |
| Militia     | Defense only | pierce      | 0   | Emergency defense (3h from Villa Rustica) |
| Legionary   | Defense      | hack        | 1   | Anti-ranged defense              |
| Velites     | Offense      | distance    | 1   | Cheap fast attacker              |
| Sagittarius | Defense      | distance    | 1   | Anti-pierce defense              |
| Praetorian  | Hybrid       | pierce      | 1   | Anti-hack defense                |
| Equites     | Offense      | hack        | 3   | Fast cavalry                     |
| Quadriga    | Hybrid       | pierce      | 4   | Strong all-around                |
| Onager      | Siege        | distance    | 15  | Wall + building destruction      |

**7 naval units**:

| Unit             | Pop | Key Role                                  |
| ---------------- | --- | ----------------------------------------- |
| Transport Galley | 7   | Carry 20 troops (26 with Bunks)           |
| Liburna          | 5   | Carry 10 troops (16 with Bunks), faster   |
| Bireme           | 8   | Naval defense                             |
| Quinquereme      | 10  | Naval offense                             |
| Fire Ship        | 8   | Last-resort naval defense (1:1 sacrifice) |
| Trireme          | 16  | Naval hybrid                              |
| Settlement Fleet | 170 | City founding/conquest                    |

**16 mythical units**: 2 per god, recruited with resources + divine favor.

### 4.2 Recruitment

- **Castra**: land units + mythical units
- **Portus**: naval units
- Separate queue per building
- Units recruit sequentially within queue
- Recruitment time reduced by building level (same formula as Portus)
- Trainer research: -10% Castra time
- Shipwright research: -10% Portus time

### 4.3 Movements

```
Movement {
  id: UUID
  world_id: FK → World
  type: 'attack' | 'support' | 'trade' | 'colonize' | 'revolt_attack' | 'conquest_attack'
  from_town_id: FK → Town
  to_town_id: FK → Town (or island for colonize)
  player_id: FK → User
  units: JSONB  // { sword: 50, slinger: 100, ... }
  resources: JSONB  // { wood: 500, stone: 0, silver: 0 } (for trade)
  departs_at: timestamp
  arrives_at: timestamp
  status: 'traveling' | 'returning' | 'arrived' | 'cancelled'
}
```

- **Travel time** = distance / (slowest_unit_speed × unit_speed_setting)
- **Distance** = Euclidean between island coordinates
- **Anti-timer**: arrival time has +/-10 seconds random offset (prevents perfect sniping)
- **Cancel window**: first 10 minutes; troops return at same travel time
- Army speed = speed of slowest unit in the group
- Flying units (Manticore, Harpy, Pegasus) bypass naval combat

### 4.4 Combat System

**Three attack/defense types**:

| Internal Name | Display Name |
| ------------- | ------------ |
| `hack`      | Blunt        |
| `pierce`    | Sharp        |
| `distance`  | Ranged       |

**Battle flow**:

1. Naval battle first (if crossing water)
2. If attacker wins naval → land units disembark
3. Land battle
4. Battle is to total annihilation of one side

**Combat calculation** (community-derived formula):

```
For each weapon type:
  total_attack_i = sum of attacking units' attack values of type i
  total_defense_i = sum of defending units' defense values against type i

Combined ratio determines winner.
Losing side: 100% casualties.
Winning side: proportional losses based on ratio.
```

**Modifiers**:

- **Luck**: random -30% to +30% applied to attack
- **Morale** (if enabled): `min(100, (def_points / att_points * 3 + 0.3) * 100)` — reduces attacker strength when attacking much smaller players
- **Fortification**: defense bonus 3.7% (L1) to 141.9% (L25)
- **Turris**: +10% additional defense
- **Night bonus** (if enabled): 2× defense during configured hours
- **Base defense**: city has innate defense even without troops (scales with Fortification)

> **Note**: Exact combat formula to be refined using in-game simulator data extraction (script prepared).

### 4.5 Espionage

- Requires Crypta building
- Attacker spends silver from Crypta to spy
- **Success**: attacker's silver > defender's Crypta silver → see troops, buildings, resources
- **Failure**: both notified, defender loses silver equal to attack spend
- Cryptography research: +20% spy defense
- Augur building: reveals when successfully spied on

### 4.6 Onager Mechanics

- Onagers destroy Fortification levels during attacks
- ~25 Onagers fully destroy a level 25 Fortification
- Stone Hail research: 10% chance per Onager to destroy a random building level

### 4.7 Acceptance Criteria — Military

- [ ] All land, naval, and mythical units recruitable with correct stats
- [ ] Movement system with correct travel times
- [ ] Anti-timer (+/-10s) applied to arrivals
- [ ] Combat resolves correctly for mono-type and mixed armies
- [ ] Luck, morale, Fortification, night bonus modifiers applied
- [ ] Naval combat before land combat
- [ ] Espionage system functional
- [ ] Onager Fortification damage working
- [ ] Cancel within 10min window
- [ ] Support troops fight under defending city's research

---

## 5. Epic 4 — Progression

### 5.1 Schola & Research

- Schola provides 4 research points per level (max 36 = 144 RP)
- Bibliotheca special building: +12 RP (total 156)
- 34 technologies across Schola levels 1-34
- Researches are per-city
- Resetting a research costs 1 Gloria point

Key researches: unit unlocks, economic bonuses (Architecture -15% build cost, Ceramics +2,500 storage), military bonuses (Phalanx +10% strength, Cartography +10% ship speed), Settlement Fleet unlock, Conquest unlock.

Full research tree in game data reference document.

### 5.2 Gloria System

Gloria points required to own additional cities.

**Formula**: `total_gp_for_level_N = 1.5 × (N² - 3N + 2)`

**Ways to earn Gloria points (1 GP each)**:

| Method             | Cost                            | Duration (speed 1) | Notes                           |
| ------------------ | ------------------------------- | ------------------ | ------------------------------- |
| Triumphus          | 300 battle points               | 8h                 | Free, requires combat           |
| Festum             | 15k wood, 18k stone, 15k silver | 24h                | Schola 30 required              |
| ~~Ludi Romani~~   | ~~50 gold~~                    | ~~24h~~           | **REMOVED** — gold-based |
| Spectacle          | 10k wood, 12k stone, 10k silver | 5 days             | Requires Amphitheatre building  |

> **TBD**: Ludi Romani replacement. Options:
>
> - **Grand Festival**: larger resource cost, shorter duration
> - **Military Parade**: costs battle points + resources
> - **Divine Celebration**: costs favor + resources
> - **Legion Event**: Legion-wide contribution for GP

### 5.3 Colonization

**Requirements**: Schola 13, Portus 10, Settlement Fleet researched + built (10k each resource, 170 pop), sufficient Gloria level.

**Process**:

1. Send Settlement Fleet to empty island slot
2. Max travel time: 48h
3. 24h founding time (NOT affected by world speed)
4. Settlement Fleet consumed
5. New city starts with: Timber Camp 15, Quarry 15, Silver Mine 12, Curia 10, Villa Rustica 10, Horreum 10, Templum 1, Forum 2, Castra 4, Praetorium 1

### 5.4 Conquest — Revolt System

For worlds with `conquest_type: 'revolt'`:

1. Send attack with "Revolt" option — must defeat ALL defenders
2. **Rumor Phase**: 12h (÷ speed) — countdown starts
3. **Revolt Phase**: 12h (÷ speed) — send Settlement Fleet during this window
4. Settlement Fleet lands → city conquered, Settlement Fleet consumed
5. Ghost towns: no revolt needed, just send Settlement Fleet

### 5.5 Conquest — Siege System

For worlds with `conquest_type: 'conquest'`:

1. Send Settlement Fleet with military escort — must win naval AND land battle
2. Settlement Fleet must survive
3. **Siege begins**: 12-24h (÷ speed)
4. During siege: enemy attacks lift siege, friendly supports maintain it
5. Democracy research: +10% siege duration
6. Siege survives → city changes hands

### 5.6 Acceptance Criteria — Progression

- [ ] 34 technologies researchable with correct costs and effects
- [ ] Gloria point system working with correct formula
- [ ] Triumphus, Festum, Spectacle functional
- [ ] Ludi Romani replacement implemented
- [ ] Settlement Fleet founding works (24h, speed-independent)
- [ ] Revolt system: rumor → revolt → Settlement Fleet landing
- [ ] Conquest system: siege mechanics
- [ ] Ghost town conquest (simplified)

---

## 6. Epic 5 — Divine

### 6.1 Gods

8 gods, each with 4 divine powers and 2 mythical units:

| God      | Attack Type Powers                    | Mythical Units                        |
| -------- | ------------------------------------- | ------------------------------------- |
| Jupiter  | Jupiter's Bolt, Jupiter's Wrath       | Minotaur, Manticore (flying)          |
| Neptune  | Earthquake, Sea Storm                 | Cyclops, Hydra (naval)                |
| Minerva  | Aegis, Virtus                         | Centaur, Pegasus (flying)             |
| Juno     | Prosperity, Desire                    | Harpy (flying), Medusa                |
| Pluto    | Plague, Resurrection                  | Cerberus, Furia                       |
| Diana    | Hunter's Precision, Phantom Legion    | Griffin, Calydonian Boar              |
| Venus    | Narcissism, Pygmalion (passive)       | Faun, Siren (naval)                   |
| Mars     | Bloodlust, Mars' Legion               | Ladon (scaling), Spartoi (from Fury)  |

Full power details (costs, effects, cooldowns) in game data reference.

### 6.2 Favor Generation

```
favor_per_hour = world_speed × sqrt(sum_temple_levels + divine_statues × 5)
```

- Favor is per-god (not shared between gods)
- Cap: 500 favor
- Each city worships one god (changeable at Templum)

### 6.3 Heroes

**Acquisition** (reworked — no gold):

```
HeroSystem {
  // Denarii earned via:
  - Provincial Quests (appear periodically, ~24 denarii/day max)
    // Internal field name: island_quests
  - Daily free refresh (2-3 free rerolls per day)
  - Legion milestones (shared rewards)
  - Battle achievements (kill X units → denarii)
  
  // NOT available:
  - Gold purchase (removed)
}
```

- Heroes of Mars: combat-focused heroes
- Heroes of Minerva: economy/wisdom-focused heroes
- Denarii of Mars: currency for war heroes
- Denarii of Minerva: currency for wisdom heroes
- Heroes level up to 20 using denarii
- Cannot die — become "wounded" (healing: 18h ÷ world_speed)
- Do NOT consume population
- Max 1 hero per city
- Cannot support other players
- **Hero slots**: 1 initially, +1 per Gloria level (no gold purchase)

> **TBD**: Exact daily refresh count, quest denarii rates, achievement thresholds.

### 6.4 Acceptance Criteria — Divine

- [ ] 8 gods with all divine powers functional
- [ ] Favor generation correct per formula
- [ ] 16 mythical units recruitable with favor + resources
- [ ] God switching at Templum works
- [ ] Hero acquisition via quests + daily refresh
- [ ] Hero leveling, assignment, wounding, healing
- [ ] Mars Fury system (sacrifice → Fury → Spartoi)
- [ ] Flying units bypass naval combat
- [ ] Siren passive speed boost working
- [ ] Ladon scaling attack working

---

## 7. Epic 6 — Social

### 7.1 Legions

```
Alliance {
  // Internal model name remains 'Alliance'; display name is 'Legion'
  id: UUID
  world_id: FK → World
  name: string (unique per world)
  tag: string (2-4 chars, unique per world)
  description: text
  founder_id: FK → PlayerWorld
  max_members: integer  // from world settings
  created_at: timestamp
}

AllianceMember {
  // Internal model name remains 'AllianceMember'; display name is 'Legion Member'
  alliance_id: FK → Alliance
  player_world_id: FK → PlayerWorld
  role: 'founder' | 'leader' | 'officer' | 'member'
  joined_at: timestamp
}
```

- **Max members**: configurable per world (50-300, default 220)
- **Pacts**: NAP (Non-Aggression) and Legion pacts with other Legions
- **Reservation tool**: mark cities as targets for specific members
- **Legion forums**: internal forum system
- **Legion battle points**: 20% of individual member BP

### 7.2 Messaging

- Player-to-player messages (inbox)
- Legion mass messages (leaders/officers)
- Legion forum (threaded discussions)

### 7.3 Discord Integration

> **TBD — Post-launch investigation.** Ideas:
>
> - Discord webhook for in-game events (attacks incoming, conquests, Legion messages)
> - Discord bot that relays Legion chat ↔ in-game chat
> - Discord OAuth for login
> - Discord role sync with Legion rank
> - Notification preferences (which events trigger Discord pings)

### 7.4 Reports

```
BattleReport {
  id: UUID
  world_id: FK → World
  attacker_id: FK → PlayerWorld
  defender_id: FK → PlayerWorld
  town_id: FK → Town
  
  att_units_sent: JSONB
  att_units_lost: JSONB
  def_units_had: JSONB
  def_units_lost: JSONB
  
  luck: float
  morale: float | null
  wall_before: integer
  wall_after: integer
  
  resources_looted: JSONB | null
  espionage_data: JSONB | null  // buildings, troops, resources if spy
  
  share_code: string (unique)  // for sharing reports
  created_at: timestamp
}
```

- Battle reports with full details
- Espionage reports
- Trade/movement reports
- **Share code**: unique code to share report links (in Legion forums, Discord)

### 7.5 Rankings

| Ranking              | Scope | Data                     |
| -------------------- | ----- | ------------------------ |
| Player points        | World | Total city points        |
| Player offensive BP  | World | Attack battle points     |
| Player defensive BP  | World | Defense battle points    |
| Legion points        | World | Sum of member points     |
| Legion offensive BP  | World | Sum of member attack BP  |
| Legion defensive BP  | World | Sum of member defense BP |

Updated periodically (every 15-30 min).

### 7.6 Acceptance Criteria — Social

- [ ] Legion creation, joining, leaving, dissolution
- [ ] Role hierarchy (founder, leader, officer, member)
- [ ] Legion forums functional
- [ ] Player-to-player messaging
- [ ] Battle reports generated with correct data
- [ ] Report sharing via code
- [ ] Rankings calculated and displayed
- [ ] Pact system (NAP, Legion pact)
- [ ] Reservation tool

---

## 8. Epic 7 — Endgame

### 8.1 Imperium Mode

**Activation**: configurable days after world start (varies by speed).

**Objective**: Legion holds 40% of cities on valid islands (large islands with player presence).

**Reduction**: if no Legion reaches 40% after a period, threshold decreases:

```
new_target = current_target - (current_target - top_legion_%) / 2
Repeats every 14 days
```

**Ultima Pugna**: when Legion reaches target:

- 14 days to activate
- Must hold above target for 14-28 days (varies by speed)
- Drop below → Ultima Pugna cancelled
- Hold → Legion wins

### 8.2 Wonders of the Empire

**Activation**: after 6+ months, when top 50 Legions have 250M+ total points.

**7 Wonders**: each gives a unique bonus. Legion must own ALL cities on an island to build. Costs escalate from 200k to 23.8M per resource per level (10 levels).

| Wonder                        | Notes                                    |
| ----------------------------- | ---------------------------------------- |
| Colosseum                     | Replaces Great Pyramid of Giza           |
| Aqueduct of Segovia           | Replaces Hanging Gardens of Babylon      |
| Pantheon                      | Replaces Statue of Zeus at Olympia       |
| Temple of Jupiter Capitolinus | Replaces Temple of Artemis at Ephesus    |
| Hadrian's Wall                | Replaces Mausoleum of Halicarnassus      |
| Trajan's Column               | Replaces Colossus of Rhodes              |
| Lighthouse of Alexandria      | Same — it existed in Roman times         |

**Victory**: first Legion to complete 4 of 7 Wonders at level 10.

### 8.3 Third Game Mode (Post-Launch)

> **TBD — Ideas to explore:**
>
> - **Battle Royale**: oceans close progressively (outer → center), last Legion standing wins
> - **King of the Hill**: central temple/monument, points per hour of control, first to X wins
> - **Speed Round**: ultra-fast world (10-20x), lasts 1-2 weeks, quick competitive rounds
> - **Conquest Total**: first Legion to X% of ALL cities (not just valid islands)
> - **Free-for-All**: no Legions, solo play, last player with cities wins

### 8.4 Acceptance Criteria — Endgame

- [ ] Imperium mode: activation, objective tracking, reduction, Ultima Pugna
- [ ] Wonders of the Empire mode: construction, island control, victory condition
- [ ] World transition: endgame → peace → closed
- [ ] Rankings frozen at world end

---

## 9. Epic 8 — UI & Frontend

### 9.1 Map — Leaflet + React

**Stack**: `react-leaflet@5` with `L.CRS.Simple` (flat coordinate system).

**MapContainer config**:

```typescript
{
  crs: L.CRS.Simple,
  center: [500, 500],
  zoom: 3,
  minZoom: 2,
  maxZoom: 8,
  preferCanvas: true,
  zoomDelta: 0.5,
  zoomSnap: 0.5,
  maxBounds: [[0, 0], [1000, 1000]],
  maxBoundsViscosity: 1.0,
}
```

**Zoom-dependent rendering**:

| Zoom | View   | Content                                                |
| ---- | ------ | ------------------------------------------------------ |
| 2-3  | World  | Ocean grid, Legion territories, clustered islands      |
| 4-5  | Ocean  | Individual islands with city count badges              |
| 6-7  | Island | Individual cities as colored markers, native villages  |
| 8+   | Close  | City names, points, player names, action buttons       |

**Interactions**:

- Click island → island info panel
- Click city → city info popup
- Right-click city → action menu (attack, support, spy, trade)
- Movement lines (dashed, color-coded: red=attack, green=support)

**Data loading**: viewport-based API calls, not full-world fetch.

### 9.2 City View

Interior view of a city showing buildings. Click buildings to interact.

- Curia: build queue (5 slots), demolish
- Castra: recruit land + mythical units
- Portus: recruit naval units
- Schola: research tree
- Templum: god selection, divine powers, favor
- Praetorium: troop overview, simulator, Gloria events
- Crypta: espionage, silver storage
- Forum: trade resources

### 9.3 Responsive Design

Desktop-first layout with responsive breakpoints:

- **Desktop** (>1024px): full game interface, map + panels side by side
- **Tablet** (768-1024px): map full-screen, panels as overlays/drawers
- **Mobile** (<768px): simplified UI, bottom navigation, map with larger touch targets

No native app. PWA optional (for home screen icon + push notifications).

### 9.4 Internationalization

- French + English at launch
- i18n framework (react-i18next or similar)
- All game strings in translation files
- Player selects language at registration (changeable in settings)
- Date/time formatting per locale

### 9.5 Visual Style

New visual identity inspired by Grepolis but distinct:

- Roman Empire theme (architecture, mythology, Mediterranean palette)
- Modern, cleaner UI (less cluttered than original)
- Custom art style (not a direct copy of Grepolis assets)
- Dark mode option

> **TBD**: Art direction, asset pipeline, whether to use AI-generated art for prototyping.

### 9.6 Advanced Attack Planner (Bellum Planner)

Built-in for ALL players (was premium-only in Grepolis).

**Features**:
- **Multi-wave coordinator**: plan multiple attacks from different cities to land at the same time
- **Auto-calculate send times**: input target arrival time, planner computes departure for each city
- **Shared plans**: share attack plans with Legion members (read-only or collaborative)
- **Templates**: save common attack compositions (e.g., "Full Nuke", "CS Train", "Snipe")
- **Incoming attack view**: see all incoming attacks on your cities in one timeline
- **Support calculator**: suggest which cities can send support in time for an incoming attack
- **Travel time calculator**: instant distance + travel time lookup between any two cities

### 9.7 City Manager

Modern overview tools for managing multiple cities efficiently.

**Features**:
- **City overview dashboard**: all cities in a table/grid with key stats (resources, population, build queue, recruitment queue)
- **Batch actions**: start same building/research across multiple cities at once
- **Quick-switch**: keyboard shortcut (arrow keys or dropdown) to cycle between cities
- **Resource overview**: see production rates, storage levels, and overflow warnings across all cities
- **Troop overview**: all troops across all cities in one view (garrison + support + traveling)
- **Recruitment planner**: set a target composition per city, see what's missing, queue recruitment
- **Defense planner**: see total defense per city, identify weak cities, suggest support redistribution

### 9.8 Native Villages — Auto-Collect Mode

The farming village system in Grepolis requires constant manual clicking every 5-20 minutes. This is tedious and favors bots/scripts.

**Rework options (TBD — pick one)**:

**Option A — Auto-collect with cooldown**:
- Player sets a collection strategy per island (demand/loot, interval)
- Resources collected automatically at the chosen interval
- No clicking required — "set it and forget it"
- Mood management still matters (greedy loot = mood drops = less yield)
- Balances bot advantage: everyone gets auto-collect, nobody needs scripts

**Option B — Complete rework: Province system**:
- Replace individual farm villages with a "Province" resource per island
- Province generates passive income based on island control (more cities you own on island = more income)
- Upgradeable province buildings (like mines but island-wide)
- Province raids: attack enemy provinces to steal their passive income
- Simpler, more strategic, less tedious

**Option C — Hybrid**:
- Keep villages but add auto-collect as a Schola research (unlocked mid-game)
- Early game: manual collection (teaches mechanics)
- Mid-game: auto-collect (removes tedium once you understand it)
- Village conquest and leveling still manual

> **Decision needed**: Which option? A is safest (minimal mechanics change), B is boldest (original feature), C is progressive.

### 9.9 Built-in Tools

| Tool | Description |
|------|-------------|
| **Battle Simulator** | Input attacker/defender compositions, preview outcome (same as Grepolis Agora simulator) |
| **Travel Time Calculator** | Select two cities → see exact travel time per unit type |
| **Troop Counter** | Count total offense/defense value of a city's garrison |
| **Defense Planner** | Show defense coverage per city, suggest support redistribution |
| **Recruitment Calculator** | Input target army composition → see total cost, time, population needed |
| **Resource Planner** | Project when resources will be full, when you can afford a building |
| **Report Analyzer** | Parse battle reports to extract enemy troop compositions over time |

### 9.10 Acceptance Criteria — UI

- [ ] Map renders at 60fps with pan/zoom
- [ ] Zoom-dependent content switching works smoothly
- [ ] City view with all building interactions
- [ ] Responsive layout working on desktop, tablet, mobile
- [ ] French + English fully translated
- [ ] Action menus (attack, support, trade, spy)
- [ ] Real-time movement updates via WebSocket
- [ ] Battle report viewer with sharing
- [ ] Attack Planner: multi-wave timing, shared plans, templates
- [ ] City Manager: overview dashboard, batch actions, quick-switch
- [ ] Native Village auto-collect or rework implemented
- [ ] Built-in tools: simulator, travel calculator, troop counter, defense planner

---

## 10. Monetization

### Skins-Only Shop

**Zero gameplay impact. Purely cosmetic.**

| Category         | Examples                                                                      |
| ---------------- | ----------------------------------------------------------------------------- |
| City Themes      | Different building appearances (Roman Senate, Eastern Province, Britannic Fort, Egyptian Colony) |
| Unit Skins       | Visual variants of troops (golden Praetorians, shadow cavalry)                |
| Ship Skins       | Custom ship appearances                                                       |
| Legion Banners   | Custom Legion flag designs and colors                                         |
| Avatars          | Player portrait frames and images                                             |
| Map Themes       | Visual filters for the world map (sunset, winter, volcanic)                   |
| God Skins        | Alternative divine power visual effects                                       |
| Name Colors      | Colored player name in chat/rankings                                          |

### Shop Model

```
ShopItem {
  id: UUID
  category: string
  name: string
  description: string
  price_cents: integer
  preview_image: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  available: boolean
}

PlayerPurchase {
  id: UUID
  user_id: FK → User  // global, not per-world
  item_id: FK → ShopItem
  purchased_at: timestamp
}
```

- Skins are **account-wide** (purchased once, usable in all worlds)
- Seasonal/limited-time skins for FOMO
- No loot boxes — direct purchase only
- Payment: Stripe integration

> **TBD**: Price points, currency (direct € or in-app coins), seasonal rotation cadence.

---

## 11. Tech Stack

| Layer                   | Choice                         | Notes                             |
| ----------------------- | ------------------------------ | --------------------------------- |
| **Frontend**      | React 19 + TypeScript + Vite   | Fast dev, shared types            |
| **Map**           | react-leaflet 5 + L.CRS.Simple | Flat game world, canvas renderer  |
| **Client state**  | Zustand                        | Lightweight                       |
| **Data fetching** | TanStack Query                 | Cache, dedup, background refresh  |
| **i18n**          | react-i18next                  | FR + EN                           |
| **Backend**       | Node.js + Fastify + TypeScript | Fast, WebSocket support           |
| **Database**      | PostgreSQL                     | Complex relational data           |
| **ORM**           | Drizzle                        | Type-safe, lightweight            |
| **Cache/Queues**  | Redis                          | Event queue, sessions             |
| **Real-time**     | WebSocket (ws)                 | Attack alerts, map updates        |
| **Auth**          | JWT + bcrypt                   | Stateless                         |
| **Payments**      | Stripe                         | Skin shop                         |
| **Hosting**       | VPS (Hetzner)                  | Cost-effective for game server    |
| **Monorepo**      | pnpm workspaces                | shared / server / client packages |

---

## 12. Data Model Overview

```
User (global)
  └─ PlayerWorld (per world)
       ├─ Town[] (cities)
       │    ├─ Building levels
       │    ├─ Units (garrison)
       │    ├─ Research (per-city)
       │    └─ God + Favor
       ├─ Legion membership (internal: Alliance)
       ├─ Heroes[]
       ├─ Mercator (internal: PhoenicianTrader)
       └─ Messages / Reports

World
  ├─ Island[]
  │    ├─ Town[] (city slots)
  │    └─ NativeVillage[] (internal: FarmingVillage)
  ├─ Legion[] (internal: Alliance)
  │    ├─ Members[]
  │    ├─ Forums[]
  │    └─ Pacts[]
  ├─ GameEvent[] (timer queue)
  ├─ Movement[] (active troop movements)
  └─ Rankings (computed)

ShopItem (global)
  └─ PlayerPurchase[]
```

---

## 13. API Overview

### Auth & Account

| Method | Route                  | Description      |
| ------ | ---------------------- | ---------------- |
| POST   | `/api/auth/register` | Create account   |
| POST   | `/api/auth/login`    | Login → JWT     |
| POST   | `/api/auth/refresh`  | Refresh token    |
| GET    | `/api/auth/me`       | Profile + worlds |

### Worlds

| Method | Route                    | Description          |
| ------ | ------------------------ | -------------------- |
| GET    | `/api/worlds`          | List worlds          |
| GET    | `/api/worlds/:id`      | World details        |
| POST   | `/api/worlds/:id/join` | Join world           |
| POST   | `/api/admin/worlds`    | Create world (admin) |

### Map

| Method | Route                               | Description                  |
| ------ | ----------------------------------- | ---------------------------- |
| GET    | `/api/worlds/:wid/map/bounds`     | Islands + cities in viewport |
| GET    | `/api/worlds/:wid/map/island/:id` | Island detail                |
| GET    | `/api/worlds/:wid/map/search`     | Search players/cities        |

### Town

| Method | Route                                     | Description                               |
| ------ | ----------------------------------------- | ----------------------------------------- |
| GET    | `/api/worlds/:wid/towns`                | Player's towns                            |
| GET    | `/api/worlds/:wid/towns/:id`            | Town detail (buildings, units, resources) |
| POST   | `/api/worlds/:wid/towns/:id/build`      | Queue building                            |
| DELETE | `/api/worlds/:wid/towns/:id/build/:eid` | Cancel build                              |
| POST   | `/api/worlds/:wid/towns/:id/recruit`    | Queue recruitment                         |
| POST   | `/api/worlds/:wid/towns/:id/research`   | Start research                            |

### Military

| Method | Route                              | Description               |
| ------ | ---------------------------------- | ------------------------- |
| POST   | `/api/worlds/:wid/movements`     | Send attack/support/trade |
| DELETE | `/api/worlds/:wid/movements/:id` | Cancel movement           |
| GET    | `/api/worlds/:wid/movements`     | Active movements          |
| POST   | `/api/worlds/:wid/towns/:id/spy` | Launch espionage          |

### Divine

| Method | Route                                  | Description         |
| ------ | -------------------------------------- | ------------------- |
| POST   | `/api/worlds/:wid/towns/:id/god`     | Change god          |
| POST   | `/api/worlds/:wid/towns/:id/cast`    | Cast divine power   |
| GET    | `/api/worlds/:wid/heroes`            | Player's heroes     |
| POST   | `/api/worlds/:wid/heroes/:id/assign` | Assign hero to town |

### Social

| Method | Route                                   | Description      |
| ------ | --------------------------------------- | ---------------- |
| POST   | `/api/worlds/:wid/alliances`          | Create Legion    |
| POST   | `/api/worlds/:wid/alliances/:id/join` | Join Legion      |
| GET    | `/api/worlds/:wid/rankings`           | Rankings         |
| GET    | `/api/worlds/:wid/reports`            | Battle reports   |
| GET    | `/api/worlds/:wid/messages`           | Player messages  |

### Shop

| Method | Route                   | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | `/api/shop/items`     | List shop items          |
| POST   | `/api/shop/purchase`  | Buy skin (Stripe)        |
| GET    | `/api/shop/inventory` | Player's purchased skins |

### WebSocket

| Channel                       | Events                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ws://server/ws/world/:wid` | `attack_incoming`, `movement_arrived`, `building_complete`, `conquest`, `message`, `alliance_update` |

---

## 14. Thematic Mapping (Grepolis → Imperium)

Developer reference table showing all Grepolis names mapped to their Imperium equivalents. Internal field names (snake_case) remain unchanged unless noted.

### Game Identity

| Grepolis | Imperium | Notes |
| -------- | -------- | ----- |
| Grepolis Private Server | Imperium | Game title |
| Ancient Greece / Greek | Roman Empire / Roman | Setting |

### Gods

| Grepolis | Imperium |
| -------- | -------- |
| Zeus | Jupiter |
| Poseidon | Neptune |
| Athena | Minerva |
| Hera | Juno |
| Hades | Pluto |
| Artemis | Diana |
| Aphrodite | Venus |
| Ares | Mars |

### Divine Powers

| God | Grepolis Power | Imperium Power |
| --- | -------------- | -------------- |
| Jupiter | Divine Sign | Divine Sign |
| Jupiter | Lightning Bolt | Jupiter's Bolt |
| Jupiter | Favorable Wind | Favorable Wind |
| Jupiter | Zeus' Rage | Jupiter's Wrath |
| Neptune | Kingly Gift | Neptune's Bounty |
| Neptune | Call of the Ocean | Tidal Surge |
| Neptune | Earthquake | Earthquake |
| Neptune | Sea Storm | Sea Storm |
| Minerva | Patroness | Patroness |
| Minerva | Wisdom | Minerva's Insight |
| Minerva | City Protection | Aegis |
| Minerva | Heroic Power | Virtus |
| Juno | Wedding | Juno's Blessing |
| Juno | Happiness | Prosperity |
| Juno | Population Growth | Population Growth |
| Juno | Desire | Desire |
| Pluto | Plague | Plague |
| Pluto | Return from the Underworld | Resurrection |
| Pluto | Treasures of the Underworld | Pluto's Treasury |
| Pluto | Helmet of Invisibility | Shadow March |
| Diana | Nature's Gift | Diana's Gift |
| Diana | Aim of the Huntress | Hunter's Precision |
| Diana | Illusion | Phantom Legion |
| Diana | Purification | Purification |
| Venus | Narcissism | Narcissism |
| Venus | Charitable Festival | Venus Festival |
| Venus | Hymn to Aphrodite | Hymn to Venus |
| Venus | Pygmalion | Pygmalion |
| Mars | Ares Sacrifice | Mars Sacrifice |
| Mars | Ares Army | Mars' Legion |
| Mars | Bloodlust | Bloodlust |
| Mars | Spartan Training | Martial Training |

### Land Units

| Grepolis | Imperium | Internal Key |
| -------- | -------- | ------------ |
| Militia | Militia | `militia` |
| Swordsman | Legionary | `sword` |
| Slinger | Velites | `slinger` |
| Archer | Sagittarius | `archer` |
| Hoplite | Praetorian | `hoplite` |
| Horseman | Equites | `horseman` |
| Chariot | Quadriga | `chariot` |
| Catapult | Onager | `catapult` |

### Naval Units

| Grepolis | Imperium | Internal Key |
| -------- | -------- | ------------ |
| Transport Boat | Transport Galley | `transport_boat` |
| Fast Transport | Liburna | `fast_transport` |
| Bireme | Bireme | `bireme` |
| Light Ship | Quinquereme | `light_ship` |
| Fire Ship | Fire Ship | `fire_ship` |
| Trireme | Trireme | `trireme` |
| Colony Ship | Settlement Fleet | `colony_ship` |

### Mythical Units

| Grepolis | Imperium | God | Internal Key |
| -------- | -------- | --- | ------------ |
| Minotaur | Minotaur | Jupiter | `minotaur` |
| Manticore | Manticore | Jupiter | `manticore` |
| Cyclops | Cyclops | Neptune | `cyclops` |
| Hydra | Hydra | Neptune | `hydra` |
| Centaur | Centaur | Minerva | `centaur` |
| Pegasus | Pegasus | Minerva | `pegasus` |
| Harpy | Harpy | Juno | `harpy` |
| Medusa | Medusa | Juno | `medusa` |
| Cerberus | Cerberus | Pluto | `cerberus` |
| Erinys | Furia | Pluto | `erinys` |
| Griffin | Griffin | Diana | `griffin` |
| Calydonian Boar | Calydonian Boar | Diana | `calydonian_boar` |
| Satyr | Faun | Venus | `satyr` |
| Siren | Siren | Venus | `siren` |
| Ladon | Ladon | Mars | `ladon` |
| Spartoi | Spartoi | Mars | `spartoi` |

### Buildings

| Grepolis | Imperium | Internal Key |
| -------- | -------- | ------------ |
| Senate | Curia | `senate` |
| Timber Camp | Timber Camp | `lumber` |
| Quarry | Quarry | `stoner` |
| Silver Mine | Silver Mine | `ironer` |
| Farm | Villa Rustica | `farm` |
| Warehouse | Horreum | `warehouse` |
| Barracks | Castra | `barracks` |
| Harbour | Portus | `harbour` |
| Academy | Schola | `academy` |
| Temple | Templum | `temple` |
| Market Place | Forum | `market` |
| Cave | Crypta | `cave` |
| City Wall | Fortification | `wall` |
| Agora | Praetorium | `agora` |
| Theatre | Amphitheatre | `theater` |
| Thermal Baths | Thermae | `thermal` |
| Library | Bibliotheca | `library` |
| Lighthouse | Pharos | `lighthouse` |
| Tower | Turris | `tower` |
| Divine Statue | Sacellum | `divine_statue` |
| Oracle | Augur | `oracle` |
| Merchant's Shop | Taberna | `merchant` |

### Social

| Grepolis | Imperium | Internal Key |
| -------- | -------- | ------------ |
| Alliance | Legion | `alliance` |
| Alliance pacts | Legion pacts | `alliance_pact` |
| Alliance forums | Legion forums | `alliance_forum` |
| Alliance battle points | Legion battle points | `alliance_bp` |

### Economy

| Grepolis | Imperium |
| -------- | -------- |
| Phoenician Trader | Mercator |
| Olympic Games | Ludi Romani |
| Farming Villages | Native Villages |

### Progression

| Grepolis | Imperium | Internal Key |
| -------- | -------- | ------------ |
| Colony Ship | Settlement Fleet | `colony_ship` |
| Culture | Gloria (Glory) | `culture` |
| Culture points | Gloria points | `culture_points` |
| Victory Procession | Triumphus | `victory_procession` |
| City Festival | Festum | `city_festival` |
| Theatre Play | Spectacle | `theatre_play` |

### Heroes

| Grepolis | Imperium |
| -------- | -------- |
| Heroes of War | Heroes of Mars |
| Heroes of Wisdom | Heroes of Minerva |
| Coins of War | Denarii of Mars |
| Coins of Wisdom | Denarii of Minerva |
| Island Quests | Provincial Quests |

### Endgame

| Grepolis | Imperium |
| -------- | -------- |
| World Wonders | Wonders of the Empire |
| Great Pyramid of Giza | Colosseum |
| Hanging Gardens of Babylon | Aqueduct of Segovia |
| Statue of Zeus at Olympia | Pantheon |
| Temple of Artemis at Ephesus | Temple of Jupiter Capitolinus |
| Mausoleum of Halicarnassus | Hadrian's Wall |
| Colossus of Rhodes | Trajan's Column |
| Lighthouse at Alexandria | Lighthouse of Alexandria |
| Domination | Imperium mode |
| Last Stand | Ultima Pugna |

### World Names

| Grepolis Examples | Imperium Examples |
| ----------------- | ----------------- |
| Olympus, Sparta, Athens | Roma, Carthago, Londinium, Byzantium, Lutetia, Massilia |

### Skin Shop Themes

| Grepolis Examples | Imperium Examples |
| ----------------- | ----------------- |
| Spartan, Athenian, Cretan, Minoan | Roman Senate, Eastern Province, Britannic Fort, Egyptian Colony |

---

## 15. Open Questions

| #  | Question                            | Status                                                                         |
| -- | ----------------------------------- | ------------------------------------------------------------------------------ |
| 1  | **Exact combat formula**      | Extract via in-game simulator script. Use community approximation as fallback. |
| 2  | **Ludi Romani replacement**   | Grand Festival? Military Parade? Divine Celebration? Legion Event?             |
| 3  | **Mercator**                  | XP curve, trade offers per level, GP rewards at milestones                     |
| 4  | **Hero daily refresh**        | How many free refreshes per day? 2? 3?                                         |
| 5  | **Discord integration**       | Webhooks? Bot? OAuth? Scope TBD post-launch.                                   |
| 6  | **3rd game mode**             | Battle Royale? King of the Hill? Speed Round? Design post-launch.              |
| 7  | **Art direction**             | New visual style — who creates assets? AI-generated for prototype?            |
| 8  | **Skin pricing**              | Price points, currency model, seasonal rotation                                |
| 9  | **Island generation**         | Exact density per ocean, min/max islands, small island ratio                   |
| 10 | **World auto-start**          | Auto-start when X players join? Or manual admin trigger only?                  |
