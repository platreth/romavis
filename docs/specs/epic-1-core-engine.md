# Epic 1 — Core Engine

> **Superseded.** This document is kept for history only. The current design is [`romavis-design.md`](romavis-design.md); do not build from this file.

## 1.1 Auth & Registration

**Goal**: Public registration with multi-world support. Players create one account and can join any open world.

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account (username, email, password) |
| POST | `/api/auth/login` | Returns JWT access token + refresh token |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET | `/api/auth/me` | Current user profile + list of joined worlds |
| GET | `/api/worlds` | List all worlds (open, running, closed) |
| POST | `/api/worlds/:id/join` | Join an open world → creates starting city |

### Data Model

```
User {
  id: UUID
  username: string (unique, 3-20 chars)
  email: string (unique)
  password_hash: string (bcrypt)
  created_at: timestamp
  last_login: timestamp
  is_admin: boolean
  status: 'active' | 'banned'
}

Session {
  id: UUID
  user_id: FK → User
  refresh_token_hash: string
  expires_at: timestamp
  ip_address: string
  created_at: timestamp
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

### Rules

- JWT access token: 15min expiry, contains `{ userId, username }`
- Refresh token: 30 days, stored hashed in DB, rotated on use
- No gold system — all features free for everyone
- One account per email, can join multiple worlds simultaneously
- Admin can open/close worlds, ban players
- Players can restart in a world (lose all cities, start fresh)
- Worlds have a max_players cap; once full, world is "closed" for new joins

---

## 1.2 Game Loop / Tick System

**Goal**: Process time-based events (building completion, unit recruitment, troop movements, resource production) without blocking.

**Architecture**: Event queue with scheduled processing, NOT polling every second.

### Event Model

```
GameEvent {
  id: UUID
  type: 'building' | 'recruitment' | 'movement' | 'research' | 'culture' | 'spell' | 'colonization'
  town_id: FK → Town
  player_id: FK → User
  payload: JSONB  // type-specific data
  starts_at: timestamp
  completes_at: timestamp
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  created_at: timestamp
}
```

### Processing Strategy

**Recommended for <200 players — Timer-based (Node.js)**:
```
- In-memory priority queue (min-heap sorted by completes_at)
- setTimeout for next event
- On new event: insert into heap, reschedule if earlier than current timer
- On completion: execute side-effect, remove from heap, schedule next
- On server restart: reload pending events from DB into heap
```

**Fallback for larger scale — Cron tick**:
```
- Process runs every 1-5 seconds
- SELECT * FROM game_events WHERE completes_at <= NOW() AND status = 'pending'
- Execute all due events in batch
- More resilient to crashes (stateless)
```

### Resource Production (Lazy Calculation)

Resources are NOT ticked every second. They are calculated on-demand:
```
When player loads city or any action checks resources:
  elapsed = NOW() - town.resources_updated_at
  wood  += production_rate_wood  * elapsed_hours
  stone += production_rate_stone * elapsed_hours
  silver += production_rate_silver * elapsed_hours
  cap each at warehouse_capacity
  UPDATE town SET wood, stone, silver, resources_updated_at = NOW()
```

### Speed Multiplier

All durations divided by `world_speed`. For a 3x world:
- Building that takes 3h at speed 1 → takes 1h
- Unit that takes 18min at speed 1 → takes 6min
- Spell duration 12h at speed 1 → 4h

### Queue Rules

**Build queue**:
- 1 slot per city (no premium = no extra slots)
- `completes_at = NOW() + build_time / world_speed`
- Cancel: refund resources, remove event

**Recruitment queue**:
- Separate queue per building (barracks, harbour)
- Units recruit sequentially within a queue
- Each batch = one event, chained: batch N+1 starts when batch N completes

**Movement queue**:
- Attack/support/trade = events with `completes_at = NOW() + travel_time`
- `travel_time = distance / (slowest_unit_speed * unit_speed_setting)`
- Distance = Euclidean between island coordinates
- Army moves at speed of slowest unit
- On arrival: resolve combat / deliver troops / deliver resources
- Cancel window: first 10 minutes (troops return at same travel time)

---

## 1.3 World Generation

**Goal**: Generate a Grepolis-like world with oceans, islands, farming villages, and starting cities.

### 1.3.1 World Config

```
World {
  id: UUID
  name: string ("Olympus", "Sparta", "Athens", etc.)
  slug: string ("fr1", "fr2", "en1")  // URL-friendly identifier
  speed: number (1, 2, 3, 4, 5)
  unit_speed: number (1, 2, 3, 4, 5)
  conquest_type: 'revolt' | 'conquest'
  morale_enabled: boolean
  night_bonus: boolean
  night_bonus_start: string ("00:00")
  night_bonus_end: string ("08:00")
  max_players: number (default 1000)
  current_players: number
  beginner_protection_days: number (5)
  endgame_type: 'domination' | 'wonder'
  status: 'open' | 'running' | 'endgame' | 'closed' | 'archived'
  // open = accepting new players
  // running = active but full (or admin closed registration)
  // endgame = victory condition triggered
  // closed = world finished, read-only
  // archived = removed from active list
  created_at: timestamp
  opened_at: timestamp      // when registration opened
  started_at: timestamp     // when game clock started (can differ from opened_at)
  closed_at: timestamp | null
}
```

**World lifecycle**:
```
Admin creates world → status: 'open'
  Players can register and join
  World generates islands on creation
  
When admin starts the world (or auto-start after X players):
  status: 'running'
  Game timers begin
  New players can still join if slots available
  
When max_players reached:
  Registration closed (but world keeps running)
  
When victory condition met:
  status: 'endgame' → 14 days peace → status: 'closed'

Admin can open new worlds throughout the year with different settings
```
```

### 1.3.2 Grid System

**Coordinate space**: 1000 x 1000, divided into 100 oceans (10x10 grid).

```
Ocean numbering:
  ocean_id = floor(y / 100) * 10 + floor(x / 100)

  Example: coordinates (450, 550) → ocean 54
  Center oceans: 44, 45, 54, 55
```

### 1.3.3 Island Model

```
Island {
  id: UUID
  world_id: FK → World
  x: integer (0-999)
  y: integer (0-999)
  ocean_id: integer (0-99), computed
  type: 'large' | 'small'
  resource_bonus: '+wood' | '+stone' | '+silver' | null
  resource_penalty: '-wood' | '-stone' | '-silver' | null
  max_cities: integer
  available_slots: integer
  created_at: timestamp
}
```

### 1.3.4 Generation Algorithm

```
Phase 1 — Island placement:
  For each ocean (center outward):
    density = base_density * distance_falloff(ocean, center)
    
    Core oceans (44,45,54,55):     25 large + 12 small
    Ring 1 (adjacent to core):      20 large + 10 small
    Ring 2 (next ring):             15 large + 8 small
    Ring 3:                         10 large + 5 small
    Outer:                           5 large + 3 small
    
    For each island to place:
      Pick random (x, y) within ocean bounds
      Ensure min distance 8 units from any existing island
      Retry up to 50 times, skip if can't place

Phase 2 — Island properties:
  Large islands: max_cities = random(8, 16)
  Small islands: max_cities = random(1, 3)
  
  Resource bonuses distributed evenly per ocean:
    ~1/3 +wood/-stone, ~1/3 +stone/-silver, ~1/3 +silver/-wood
    Bonus/penalty only affects production at levels 20+ (+/-10%)

Phase 3 — Farming villages:
  For each large island: create 8 FarmingVillage records
  Small islands: no farming villages
  All villages start at level 1, mood 100
```

### 1.3.5 Farming Village Model

```
FarmingVillage {
  id: UUID
  island_id: FK → Island
  position: integer (1-8)
  level: integer (1-6, default 1)
  mood: integer (0-100, default 100)
  mood_updated_at: timestamp
}

FarmingVillageOwnership {
  id: UUID
  village_id: FK → FarmingVillage
  player_id: FK → User
  conquered_at: timestamp
}
```

### 1.3.6 Starting City

When a player calls `POST /api/worlds/:id/join`:
```
1. Check world.status === 'open' and current_players < max_players
2. Check player hasn't already joined this world
3. Create PlayerWorld record
4. Find island with available_slots > 0
   - Prefer islands near center
   - Prefer islands with other players (but not overcrowded)
   - Late joiners placed in outer oceans (further from center)

5. Create city:
   Town {
     player_id, island_id, slot_on_island
     name: "{username}'s City"
     points: 175
     wood: 500, stone: 500, silver: 500
     
     // Starting buildings
     main: 1, farm: 6, storage: 3
     lumber: 3, stoner: 3, ironer: 3
     barracks: 1, hide: 1, temple: 1
     wall: 1, market: 1
     // All others: 0
   }

3. Apply beginner protection (5 days)
4. Auto-conquer 1st farming village on the island
5. Grant starting god selection prompt
6. Increment world.current_players
7. Return player's new city + world context
```

### 1.3.7 Town Model

```
Town {
  id: UUID
  player_id: FK → User
  island_id: FK → Island
  slot_on_island: integer
  name: string (max 20 chars)
  points: integer

  // Resources (lazy-calculated)
  wood: float
  stone: float
  silver: float
  resources_updated_at: timestamp

  // Building levels (all integer, default 0)
  main: integer         // Senate (max 25)
  lumber: integer       // Timber Camp (max 40)
  stoner: integer       // Quarry (max 40)
  ironer: integer       // Silver Mine (max 40)
  farm: integer         // Farm (max 45)
  storage: integer      // Warehouse (max 35)
  barracks: integer     // Barracks (max 30)
  docks: integer        // Harbour (max 30)
  wall: integer         // City Wall (max 25)
  market: integer       // Market Place (max 30)
  academy: integer      // Academy (max 36)
  temple: integer       // Temple (max 30)
  hide: integer         // Cave (max 10)
  
  // Special buildings (pick 1 per tier, max level 1)
  // Left tier (choose one):
  theater: integer      // Theatre
  thermal: integer      // Thermal Baths
  library: integer      // Library
  lighthouse: integer   // Lighthouse
  
  // Right tier (choose one):
  tower: integer        // Tower
  statue: integer       // Divine Statue
  oracle: integer       // Oracle
  trade_office: integer // Merchant's Shop

  // God
  god_id: string | null  // 'zeus' | 'poseidon' | 'athena' | 'hera' | 'hades' | 'artemis' | 'aphrodite' | 'ares'

  // Meta
  beginner_protection_until: timestamp | null
  created_at: timestamp
}
```

---

## 1.4 Map Rendering — Leaflet + React

### 1.4.1 Stack

```
leaflet@1.9.x               - Core map engine
react-leaflet@5.0.0          - React bindings
react-leaflet-cluster@4.1    - Marker clustering at world zoom
L.CRS.Simple                 - Flat game coordinate system (no lat/lng)
```

### 1.4.2 MapContainer Config

```typescript
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const WORLD_SIZE = 1000;
const worldBounds: L.LatLngBoundsExpression = [[0, 0], [WORLD_SIZE, WORLD_SIZE]];

function GameMap() {
  return (
    <MapContainer
      crs={L.CRS.Simple}
      center={[500, 500]}           // Center of world
      zoom={3}
      minZoom={2}
      maxZoom={8}
      preferCanvas={true}           // Canvas renderer for performance
      zoomDelta={0.5}               // Smooth zooming
      zoomSnap={0.5}
      maxBounds={worldBounds}
      maxBoundsViscosity={1.0}      // Hard boundary — can't pan outside world
      style={{ height: '100vh', width: '100vw' }}
    >
      <OceanBackground />
      <ZoomAwareRenderer />
    </MapContainer>
  );
}
```

### 1.4.3 Coordinate Mapping

Grepolis grid (0-999) maps directly to Leaflet CRS.Simple coordinates:

```typescript
// Game coordinates → Leaflet LatLng
function gameToLatLng(x: number, y: number): L.LatLng {
  return L.latLng(y, x);  // Leaflet uses [lat, lng] = [y, x]
}

// Leaflet LatLng → Game coordinates
function latLngToGame(latlng: L.LatLng): { x: number; y: number } {
  return { x: Math.floor(latlng.lng), y: Math.floor(latlng.lat) };
}

// Ocean from coordinates
function getOceanId(x: number, y: number): number {
  return Math.floor(y / 100) * 10 + Math.floor(x / 100);
}
```

### 1.4.4 Zoom-Dependent Rendering

| Zoom | View | Rendered Content | Data Source |
|------|------|------------------|-------------|
| 2-3 | World | Ocean grid lines, alliance territory polygons, ocean labels | All islands (clustered) |
| 4-5 | Ocean | Islands as icons with city count badges | Islands in visible bounds |
| 6-7 | Island | Individual cities as colored markers, farming villages | Cities + FVs in bounds |
| 8+ | Close | City names, points, player names, action buttons | Full detail for visible cities |

```typescript
function ZoomAwareRenderer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  return (
    <>
      <OceanGrid />                              {/* Always visible */}
      {zoom < 4 && <AllianceTerritories />}       {/* World view */}
      {zoom < 5 && <ClusteredIslands />}          {/* Clustered at world zoom */}
      {zoom >= 4 && <IslandMarkers zoom={zoom} />}{/* Individual islands */}
      {zoom >= 6 && <CityMarkers zoom={zoom} />}  {/* Individual cities */}
      {zoom >= 6 && <FarmVillageMarkers />}        {/* Farming villages */}
    </>
  );
}
```

### 1.4.5 Ocean Background

Two options:

**Option A — CSS background (simplest)**:
```typescript
function OceanBackground() {
  // Full-world blue rectangle
  return (
    <Rectangle
      bounds={[[0, 0], [1000, 1000]]}
      pathOptions={{ color: 'transparent', fillColor: '#1a3a5c', fillOpacity: 1 }}
    />
  );
}
```

**Option B — Pre-rendered tiles (prettier)**:
```
Generate ocean tiles at world creation:
  - Base layer: water texture tiled at 256x256px
  - Land masses drawn on top at island positions
  - Export as /tiles/{z}/{x}/{y}.png pyramid
  - Serve via static file server or CDN
```

### 1.4.6 Island Rendering

```typescript
const islandIcon = (type: 'large' | 'small', cityCount: number) =>
  L.divIcon({
    className: 'island-marker',
    html: `
      <div class="island island--${type}">
        <img src="/assets/island-${type}.png" />
        <span class="island__count">${cityCount}</span>
      </div>
    `,
    iconSize: type === 'large' ? [48, 48] : [24, 24],
  });

function IslandMarkers({ zoom }: { zoom: number }) {
  const bounds = useMapBounds();
  const { data: islands } = useQuery({
    queryKey: ['islands', bounds],
    queryFn: () => fetch(`/api/map/bounds?x1=${bounds.x1}&y1=${bounds.y1}&x2=${bounds.x2}&y2=${bounds.y2}`)
      .then(r => r.json()),
  });

  return (
    <>
      {islands?.map((island) => (
        <Marker
          key={island.id}
          position={gameToLatLng(island.x, island.y)}
          icon={islandIcon(island.type, island.city_count)}
          eventHandlers={{
            click: () => openIslandPanel(island),
          }}
        >
          <Popup><IslandPreview island={island} /></Popup>
        </Marker>
      ))}
    </>
  );
}
```

### 1.4.7 City Rendering

```typescript
const cityIcon = (playerColor: string, points: number) =>
  L.divIcon({
    className: 'city-marker',
    html: `<div class="city" style="border-color: ${playerColor}"></div>`,
    iconSize: [16, 16],
  });

// City markers with right-click context menu
function CityMarker({ city }: { city: CityData }) {
  return (
    <Marker
      position={gameToLatLng(city.x, city.y)}
      icon={cityIcon(city.player_color, city.points)}
      eventHandlers={{
        click: () => openCityPanel(city),
        contextmenu: (e) => {
          e.originalEvent.preventDefault();
          openActionMenu(city, e.latlng); // Attack, Support, Spy, Trade
        },
      }}
    >
      <Tooltip direction="top" permanent={false}>
        <span>{city.name} ({city.points}pts)</span><br/>
        <span>{city.player_name}</span>
      </Tooltip>
    </Marker>
  );
}
```

### 1.4.8 Movement Lines (Attacks/Support in transit)

```typescript
function MovementLines() {
  const { data: movements } = useQuery({ queryKey: ['movements'], ... });

  return (
    <>
      {movements?.map((mov) => (
        <Polyline
          key={mov.id}
          positions={[
            gameToLatLng(mov.from_x, mov.from_y),
            gameToLatLng(mov.to_x, mov.to_y),
          ]}
          pathOptions={{
            color: mov.type === 'attack' ? '#e74c3c' : '#2ecc71',
            weight: 2,
            dashArray: '5, 10',  // Dashed line for active movement
          }}
        />
      ))}
    </>
  );
}
```

### 1.4.9 Map API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/map/bounds?x1=&y1=&x2=&y2=&zoom=` | Islands + cities in viewport |
| GET | `/api/map/island/:id` | Island detail with cities + farming villages |
| GET | `/api/map/ocean/:id` | All islands in an ocean |
| GET | `/api/map/search?q=` | Search by player/alliance/city name |
| GET | `/api/map/movements` | Active movements for current player |
| WS | `/ws/map` | Real-time updates (new cities, movements, conquests) |

### 1.4.10 Performance Targets

| Metric | Target |
|--------|--------|
| Islands per world | ~3,000-5,000 |
| Cities per world | ~10,000-30,000 |
| Markers visible at once | <500 (viewport culling) |
| Map pan/zoom FPS | 60fps |
| Data load per viewport | <100ms |
| WebSocket update latency | <500ms |

---

## 1.5 Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React 19 + TypeScript + Vite | Fast dev, shared types with backend |
| Map | react-leaflet 5 + L.CRS.Simple | Flat game world, canvas renderer, proven pattern |
| Client state | Zustand | Lightweight, no boilerplate |
| Data fetching | TanStack Query | Cache, dedup, background refresh |
| Backend | Node.js + Fastify + TypeScript | Fast, WebSocket, shared types |
| Database | PostgreSQL | Complex relational data, JSONB |
| ORM | Drizzle | Type-safe, lightweight, good with Postgres |
| Cache/Queues | Redis | Event queue, sessions, rate limiting |
| Real-time | WebSocket (ws) | Attack alerts, map updates |
| Auth | JWT + bcrypt | Simple, stateless |

---

## 1.6 Project Structure (Proposed)

```
grepolis-private/
├── packages/
│   ├── shared/              # Shared types, constants, formulas
│   │   ├── types/           # Game data types (Town, Unit, Building, etc.)
│   │   ├── constants/       # Game data (unit stats, building costs, research)
│   │   └── formulas/        # Production, combat, timing calculations
│   │
│   ├── server/              # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/      # API routes (auth, map, town, military, etc.)
│   │   │   ├── services/    # Business logic
│   │   │   ├── models/      # Drizzle schema
│   │   │   ├── events/      # Game event processing (timer-based queue)
│   │   │   ├── ws/          # WebSocket handlers
│   │   │   └── world/       # World generation
│   │   └── drizzle/         # Migrations
│   │
│   └── client/              # React + Vite frontend
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── map/         # Leaflet map components
│       │   ├── panels/      # City, island, military panels
│       │   ├── store/       # Zustand stores
│       │   ├── hooks/       # React hooks
│       │   └── api/         # API client + TanStack Query
│       └── public/
│           └── assets/      # Island sprites, city icons, etc.
│
├── data/                    # Game data JSON (from grepolis-AI/research/)
├── docs/                    # Specs, reference docs
└── package.json             # Monorepo root (pnpm workspaces)
```

---

## 1.7 Acceptance Criteria

### Auth & Worlds
- [ ] User can register with username/email/password
- [ ] User can login and receive JWT
- [ ] Token refresh works
- [ ] Admin can create worlds with custom settings (speed, type, max players)
- [ ] Player can see list of open worlds
- [ ] Player can join an open world → starting city is created
- [ ] Player can join multiple worlds simultaneously
- [ ] World closes registration when max_players reached
- [ ] Admin can ban/unban users
- [ ] Protected routes reject invalid tokens

### Game Loop
- [ ] Building construction queues and completes on time
- [ ] Resource production calculates correctly on city load
- [ ] Events survive server restart (persisted in DB)
- [ ] Cancel removes event and refunds resources
- [ ] World speed multiplier applies correctly to all timers

### World Generation
- [ ] World generates with correct ocean grid (10x10)
- [ ] Islands placed with density gradient (dense center, sparse edges)
- [ ] Large islands have 8 farming villages each
- [ ] Small islands have no farming villages
- [ ] Resource bonuses distributed evenly
- [ ] New player gets starting city with correct buildings/resources

### Map
- [ ] Map renders at 60fps with pan/zoom
- [ ] Islands visible at zoom 4+
- [ ] Cities visible at zoom 6+
- [ ] Click island shows info panel
- [ ] Right-click city shows action menu
- [ ] Viewport-based data loading (no full-world fetch)
- [ ] WebSocket pushes movement updates in real-time
