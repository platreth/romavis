# Imperium — Complete Asset Inventory & Production Pipeline

---

## Table of Contents

1. [Asset Summary](#1-asset-summary)
2. [Buildings](#2-buildings)
3. [Units — Land](#3-units--land)
4. [Units — Naval](#4-units--naval)
5. [Units — Mythical](#5-units--mythical)
6. [God Portraits & Divine Powers](#6-god-portraits--divine-powers)
7. [Hero Portraits](#7-hero-portraits)
8. [Map — Terrain & Environment](#8-map--terrain--environment)
9. [Map — Islands](#9-map--islands)
10. [Map — Cities & Markers](#10-map--cities--markers)
11. [Map — Movements & Effects](#11-map--movements--effects)
12. [UI — HUD & Panels](#12-ui--hud--panels)
13. [UI — Icons](#13-ui--icons)
14. [UI — Buttons & Controls](#14-ui--buttons--controls)
15. [Visual Effects & Particles](#15-visual-effects--particles)
16. [Full-Screen Art](#16-full-screen-art)
17. [Audio](#17-audio)
18. [Skin Shop Assets](#18-skin-shop-assets)
19. [Sprite Sheet Organization](#19-sprite-sheet-organization)
20. [PixiJS Technical Specs](#20-pixijs-technical-specs)
21. [AI Generation Pipeline](#21-ai-generation-pipeline)
22. [MVP Asset Reduction](#22-mvp-asset-reduction)

---

## 1. Asset Summary

| Category | Unique Assets | Atlas Sheets (2048x2048) | Priority |
|----------|--------------|--------------------------|----------|
| Buildings | ~110 sprites | 1-2 | P0 |
| Land units | ~48 icons/sprites | 1 | P0 |
| Naval units | ~7 sprites | shared | P0 |
| Mythical units | ~16 sprites | shared | P1 |
| God portraits | 8 | loaded individually | P0 |
| Hero portraits | ~38 | 1 | P2 |
| Divine power effects | ~32 | 1 | P1 |
| Map terrain | ~30 tiles | 1 | P0 |
| Map islands | ~20 variants | 1 | P0 |
| Map cities & markers | ~30 | shared | P0 |
| Map movements & effects | ~20 | shared | P0 |
| UI HUD & panels | ~40 | 1-2 | P0 |
| UI icons | ~120 | 1-2 | P0 |
| UI buttons & controls | ~60 | 1 | P0 |
| Visual effects & particles | ~50 | 1 | P1 |
| Full-screen art | ~10 | loaded individually | P1 |
| Audio | ~50 files | N/A | P2 |
| **Total** | **~640+ unique assets** | **~12-15 sheets** | |

Priority: P0 = needed for alpha, P1 = needed for beta, P2 = needed for launch.

---

## 2. Buildings

22 building types. Each needs visual tiers to show progression (not 1 sprite per level — group levels into visual tiers).

### Visual Tiers

| Tier | Levels | Visual Description |
|------|--------|--------------------|
| Tier 1 | 1-5 | Basic wooden/mud structure |
| Tier 2 | 6-12 | Stone construction, Roman style emerging |
| Tier 3 | 13-20 | Full Roman architecture, columns, marble |
| Tier 4 | 21-30 | Grand Roman building, ornate details |
| Tier 5 | 31-45 | Monumental, gold accents, peak Roman glory |

### Complete Building Sprite List

| # | Building (Imperium) | Internal Key | Max Level | Tiers | Sprites | Size | Notes |
|---|---------------------|-------------|-----------|-------|---------|------|-------|
| 1 | Curia | `senate` | 25 | 5 | 5 | 128x128 | Administrative center, Roman Senate style |
| 2 | Timber Camp | `lumber` | 40 | 5 | 5 | 128x128 | Woodcutting camp, lumber piles |
| 3 | Quarry | `stoner` | 40 | 5 | 5 | 128x128 | Stone quarry, Roman mining |
| 4 | Silver Mine | `ironer` | 40 | 5 | 5 | 128x128 | Mine entrance, ore carts |
| 5 | Villa Rustica | `farm` | 45 | 5 | 5 | 128x128 | Roman farm estate, grain fields |
| 6 | Horreum | `storage` | 35 | 5 | 5 | 128x128 | Roman granary/warehouse |
| 7 | Castra | `barracks` | 30 | 5 | 5 | 128x128 | Roman military camp |
| 8 | Portus | `docks` | 30 | 5 | 5 | 128x128 | Roman harbor, docks, ships |
| 9 | Schola | `academy` | 36 | 5 | 5 | 128x128 | Roman school/academy |
| 10 | Templum | `temple` | 30 | 5 | 5 | 128x128 | Roman temple, god-specific decoration |
| 11 | Forum | `market` | 30 | 5 | 5 | 128x128 | Roman marketplace, stalls |
| 12 | Crypta | `hide` | 10 | 3 | 3 | 128x128 | Underground vault entrance |
| 13 | Fortification | `wall` | 25 | 5 | 5 | 128x128 | Roman wall segments, towers |
| 14 | Praetorium | `place` | 1 | 1 | 1 | 128x128 | Commander's HQ, fixed |
| 15 | Amphitheatre | `theater` | 1 | 1 | 1 | 128x128 | Special building, grand |
| 16 | Thermae | `thermal` | 1 | 1 | 1 | 128x128 | Roman baths, steam |
| 17 | Bibliotheca | `library` | 1 | 1 | 1 | 128x128 | Library with scrolls |
| 18 | Pharos | `lighthouse` | 1 | 1 | 1 | 128x128 | Lighthouse, flame on top |
| 19 | Turris | `tower` | 1 | 1 | 1 | 128x128 | Guard tower |
| 20 | Sacellum | `statue` | 1 | 1 | 1 | 128x128 | Divine shrine with god statue |
| 21 | Augur | `oracle` | 1 | 1 | 1 | 128x128 | Divination temple |
| 22 | Taberna | `trade_office` | 1 | 1 | 1 | 128x128 | Merchant shop |

**Total building sprites: ~110**

### Building Art Direction

- Style: top-down isometric or 3/4 view
- Palette: terracotta, marble white, stone grey, dark wood, red Roman roofing
- Tier 1: rough, provincial. Tier 5: imperial grandeur
- Templum should have god-specific color accents (Jupiter=gold, Mars=red, Neptune=blue)

---

## 3. Units — Land

8 land unit types. Each needs: **map sprite** (for the world map), **icon** (for UI panels), **portrait** (for detail popup).

| # | Unit (Imperium) | Internal Key | Attack Type | Map Sprite | Icon | Portrait |
|---|----------------|-------------|-------------|------------|------|----------|
| 1 | Militia | `militia` | pierce | 48x48 | 32x32 | 96x96 |
| 2 | Legionary | `sword` | hack | 48x48 | 32x32 | 96x96 |
| 3 | Velites | `slinger` | distance | 48x48 | 32x32 | 96x96 |
| 4 | Sagittarius | `archer` | distance | 48x48 | 32x32 | 96x96 |
| 5 | Praetorian | `hoplite` | pierce | 48x48 | 32x32 | 96x96 |
| 6 | Equites | `rider` | hack | 48x48 | 32x32 | 96x96 |
| 7 | Quadriga | `chariot` | pierce | 64x48 | 32x32 | 96x96 |
| 8 | Onager | `catapult` | distance | 64x48 | 32x32 | 96x96 |

**Per unit: 3 assets (map sprite + icon + portrait) = 24 assets total**

### Land Unit Art Direction

- Legionary: iconic Roman soldier, lorica segmentata, gladius, red shield (scutum)
- Velites: light skirmisher, javelins, minimal armor
- Sagittarius: auxiliary archer, eastern-style bow
- Praetorian: elite guard, crested helmet, ornate armor
- Equites: Roman cavalry, horse with Roman tack
- Quadriga: two-horse war chariot, driver + fighter
- Onager: Roman siege engine, wooden frame, stone projectile

---

## 4. Units — Naval

7 naval unit types.

| # | Unit (Imperium) | Internal Key | Map Sprite | Icon | Portrait |
|---|----------------|-------------|------------|------|----------|
| 1 | Transport Galley | `big_transporter` | 64x32 | 32x32 | 96x96 |
| 2 | Liburna | `small_transporter` | 48x24 | 32x32 | 96x96 |
| 3 | Bireme | `bireme` | 64x32 | 32x32 | 96x96 |
| 4 | Quinquereme | `attack_ship` | 64x32 | 32x32 | 96x96 |
| 5 | Fire Ship | `demolition_ship` | 48x24 | 32x32 | 96x96 |
| 6 | Trireme | `trireme` | 64x32 | 32x32 | 96x96 |
| 7 | Settlement Fleet | `colonize_ship` | 96x48 | 32x32 | 96x96 |

**Per unit: 3 assets = 21 assets total**

### Naval Art Direction

- Roman galley style: wooden hull, oars, ram at bow
- Bireme/Trireme: historically accurate oar banks
- Quinquereme: larger, fortified, with corvus boarding bridge
- Settlement Fleet: multiple ships bound together, supplies on deck
- Fire Ship: oil barrels, flames, dark wood

---

## 5. Units — Mythical

16 mythical units, 2 per god.

| # | Unit (Imperium) | God | Internal Key | Map Sprite | Icon | Portrait |
|---|----------------|-----|-------------|------------|------|----------|
| 1 | Minotaur | Jupiter | `minotaur` | 64x64 | 32x32 | 96x96 |
| 2 | Manticore | Jupiter | `manticore` | 64x64 | 32x32 | 96x96 |
| 3 | Cyclops | Neptune | `cyclops` | 64x64 | 32x32 | 96x96 |
| 4 | Hydra | Neptune | `hydra` | 96x64 | 32x32 | 96x96 |
| 5 | Centaur | Minerva | `centaur` | 64x48 | 32x32 | 96x96 |
| 6 | Pegasus | Minerva | `pegasus` | 64x64 | 32x32 | 96x96 |
| 7 | Harpy | Juno | `harpy` | 48x48 | 32x32 | 96x96 |
| 8 | Medusa | Juno | `medusa` | 48x48 | 32x32 | 96x96 |
| 9 | Cerberus | Pluto | `cerberus` | 64x64 | 32x32 | 96x96 |
| 10 | Furia | Pluto | `erinys` | 64x64 | 32x32 | 96x96 |
| 11 | Griffin | Diana | `griffin` | 64x64 | 32x32 | 96x96 |
| 12 | Calydonian Boar | Diana | `calydonian_boar` | 64x48 | 32x32 | 96x96 |
| 13 | Faun | Venus | `satyr` | 48x48 | 32x32 | 96x96 |
| 14 | Siren | Venus | `siren` | 64x32 | 32x32 | 96x96 |
| 15 | Ladon | Mars | `ladon` | 96x64 | 32x32 | 96x96 |
| 16 | Spartoi | Mars | `spartoi` | 48x48 | 32x32 | 96x96 |

**Per unit: 3 assets = 48 assets total**

### Mythical Unit Art Direction

- Roman interpretation of Greco-Roman mythology
- Color-coded to match their god's palette
- Larger and more detailed than regular units (they're special/rare)
- Flying units (Manticore, Pegasus, Harpy): wings spread, airborne perspective

---

## 6. God Portraits & Divine Powers

### God Portraits

8 full portraits, loaded individually (not in atlas — they're large).

| # | God | Internal Key | Size | Art Direction |
|---|-----|-------------|------|---------------|
| 1 | Jupiter | `jupiter` | 512x512 | King of gods, eagle, thunderbolt, gold/white palette |
| 2 | Neptune | `neptune` | 512x512 | Sea god, trident, waves, blue/teal palette |
| 3 | Minerva | `minerva` | 512x512 | Wisdom goddess, owl, aegis shield, silver/olive palette |
| 4 | Juno | `juno` | 512x512 | Queen of gods, peacock, crown, purple/gold palette |
| 5 | Pluto | `pluto` | 512x512 | Underworld god, Cerberus, dark throne, black/green palette |
| 6 | Diana | `diana` | 512x512 | Huntress, bow, deer, forest green/silver palette |
| 7 | Venus | `venus` | 512x512 | Love goddess, dove, roses, pink/gold palette |
| 8 | Mars | `mars` | 512x512 | War god, spear, shield, red/bronze palette |

### Divine Power Icons

32 divine power icons (4 per god).

| God | Power 1 | Power 2 | Power 3 | Power 4 |
|-----|---------|---------|---------|---------|
| Jupiter | Divine Sign | Jupiter's Bolt | Favorable Wind | Jupiter's Wrath |
| Neptune | Neptune's Bounty | Tidal Surge | Earthquake | Sea Storm |
| Minerva | Patroness | Minerva's Insight | Aegis | Virtus |
| Juno | Juno's Blessing | Prosperity | Population Growth | Desire |
| Pluto | Plague | Resurrection | Pluto's Treasury | Shadow March |
| Diana | Diana's Gift | Hunter's Precision | Phantom Legion | Purification |
| Venus | Narcissism | Venus Festival | Hymn to Venus | Pygmalion |
| Mars | Mars Sacrifice | Mars' Legion | Bloodlust | Martial Training |

**Size**: 48x48 each. **Total: 32 icons.**

### Divine Power Visual Effects

Each power needs a casting effect animation (sprite sheet or particle config).

| Effect Type | Powers Using It | Frames | Size |
|-------------|----------------|--------|------|
| Lightning strike | Jupiter's Bolt, Jupiter's Wrath | 6 | 128x128 |
| Water/wave surge | Tidal Surge, Sea Storm | 6 | 128x128 |
| Earth shake | Earthquake | 4 | 128x128 |
| Shield glow | Aegis, Virtus | 4 | 96x96 |
| Blessing aura | All buff spells (8) | 4 | 96x96 |
| Dark mist | Plague, Shadow March | 6 | 128x128 |
| Arrow rain | Hunter's Precision | 6 | 128x128 |
| Ghost army | Phantom Legion | 6 | 128x128 |
| Fire/sacrifice | Mars Sacrifice, Bloodlust | 6 | 96x96 |
| Heart/charm | Venus powers | 4 | 96x96 |
| Nature burst | Diana's Gift | 4 | 96x96 |
| Resource drop | Gift powers (Bounty, Treasury, Blessing) | 4 | 64x64 |

**Total effect sprites: ~60 frames across 12 effect types**

---

## 7. Hero Portraits

~38 heroes. Each needs a portrait for the hero panel.

| Size | Format | Notes |
|------|--------|-------|
| 256x256 | PNG | Bust portrait, Roman style |

Art direction per hero type:
- **Heroes of Mars**: military attire, weapons, battle scars, red accents
- **Heroes of Minerva**: toga, scrolls, laurel wreath, olive/silver accents

**Total: ~38 portraits** (can be generated in batches via AI with consistent style)

---

## 8. Map — Terrain & Environment

### Ocean Tiles

| Asset | Variants | Size | Notes |
|-------|----------|------|-------|
| Deep ocean | 1 base + 4-frame animation | 256x256 tileable | Animated wave shader preferred over sprite animation |
| Shallow water | 1 base | 256x256 tileable | Lighter blue, near coastlines |
| Water foam | 4 frames | 128x128 | Coast edge effect |

### Terrain (for island surfaces)

| Asset | Variants | Size | Notes |
|-------|----------|------|-------|
| Grass | 3 variants | 128x128 tileable | Mediterranean green |
| Sand | 2 variants | 128x128 tileable | Beach, desert |
| Rock | 2 variants | 128x128 tileable | Mountain, cliff |
| Farmland | 2 variants | 128x128 tileable | Cultivated fields |

### Decorations

| Asset | Count | Size | Notes |
|-------|-------|------|-------|
| Trees (Mediterranean) | 5 types (olive, cypress, pine, oak, palm) | 48x64 | Scattered on islands |
| Rocks | 4 variants | 32x32 | Small decorative |
| Bushes | 3 variants | 24x24 | |
| Roman ruins | 3 variants | 64x64 | Columns, broken walls |
| Roman road | 2 (straight, curved) | 128x32 | Between cities |
| Milestone marker | 1 | 16x32 | On roads |

**Total terrain/environment assets: ~35**

---

## 9. Map — Islands

Islands are the key visual element of the world map.

### Large Islands

| Variant | Count | Size | Notes |
|---------|-------|------|-------|
| Standard large island | 5 shape variants | 256x256 | 8-16 city slots visible |
| Wood bonus island | 3 variants | 256x256 | More trees/forests |
| Stone bonus island | 3 variants | 256x256 | More rocky/mountainous |
| Silver bonus island | 3 variants | 256x256 | Mine entrances visible |

### Small Islands

| Variant | Count | Size | Notes |
|---------|-------|------|-------|
| Small island | 4 shape variants | 128x128 | 1-3 city slots |
| Tiny rock | 2 variants | 64x64 | Decorative, no cities |

**Total island sprites: ~20 variants**

### Island Zoom Levels

Each island needs 3 detail levels:

| Zoom | Size | Detail |
|------|------|--------|
| World (far) | 16x16 | Colored dot |
| Ocean (mid) | 64x64 | Island silhouette + badge |
| Close | 256x256 | Full detail with terrain, trees, city slots |

**Total with zoom: ~60 sprites (20 variants x 3 zoom levels)**

---

## 10. Map — Cities & Markers

### City Markers

| Asset | Variants | Size | Notes |
|-------|----------|------|-------|
| Player city — small | 8 Legion colors | 24x24 | <3000 points |
| Player city — medium | 8 Legion colors | 32x32 | 3000-8000 points |
| Player city — large | 8 Legion colors | 40x40 | >8000 points |
| Ghost town | 1 | 24x24 | Greyed out, crumbling |
| Selected city ring | 1 animated (4 frames) | 48x48 | Pulsing selection indicator |

City markers use a base shape + color tint (PixiJS tint property). So only 3 base shapes needed + 1 ghost + 1 selection = **5 base sprites**, tinted per Legion color at runtime.

### Native Villages

| Asset | Variants | Size | Notes |
|-------|----------|------|-------|
| Native village | 3 variants (levels 1-2, 3-4, 5-6) | 24x24 | Small hut clusters |
| Conquered indicator | 1 | 16x16 | Flag/banner overlay |

### Other Markers

| Asset | Count | Size | Notes |
|-------|-------|------|-------|
| Anchor point (empty slot) | 1 | 16x16 | Where colonies can be founded |
| Wonder of the Empire site | 1 | 48x48 | Construction site for endgame |
| Provincial Quest marker | 1 | 24x24 | Exclamation mark / scroll |

**Total city/marker sprites: ~15**

---

## 11. Map — Movements & Effects

### Troop Movement Sprites

| Asset | Variants | Size | Notes |
|-------|----------|------|-------|
| Army marker (land) | 1 base + color tint | 24x24 | Animated along path |
| Fleet marker (naval) | 1 base + color tint | 32x16 | Ship silhouette moving |
| Settlement Fleet marker | 1 | 32x24 | Larger, special |
| Movement path line | 1 (shader/code) | N/A | Drawn programmatically |

### Movement path colors (applied via code, not separate assets)

| Type | Color |
|------|-------|
| Attack | Red `#e74c3c` |
| Support | Green `#2ecc71` |
| Trade | Yellow `#f1c40f` |
| Colonize | Blue `#3498db` |
| Revolt/Conquest | Purple `#9b59b6` |
| Return | Grey `#95a5a6` |

### Map Effects

| Asset | Frames | Size | Notes |
|-------|--------|------|-------|
| Battle explosion | 6 | 64x64 | Plays when armies clash |
| City conquest flash | 4 | 48x48 | City changes color |
| New city founded sparkle | 6 | 48x48 | Colony established |
| Spy shadow | 4 | 32x32 | Espionage visual |

**Total movement/effect sprites: ~25**

---

## 12. UI — HUD & Panels

### Top Bar (Resource Bar)

| Asset | Count | Size | Notes |
|-------|-------|------|-------|
| Top bar background | 1 | 9-slice | Dark Roman stone texture |
| Resource divider | 1 | 4xH | Vertical separator |
| City name frame | 1 | 9-slice | Ornate frame around city name |
| Player name frame | 1 | 9-slice | Simpler frame |

### Side Panel

| Asset | Count | Size | Notes |
|-------|-------|------|-------|
| Panel background | 1 large | 9-slice | Parchment/marble texture |
| Panel header | 1 | 9-slice | Decorated top bar |
| Tab background (active) | 1 | 9-slice | Highlighted tab |
| Tab background (inactive) | 1 | 9-slice | Dimmed tab |
| Panel close button | 1 (3 states) | 32x32 | X button |
| Panel scroll track | 1 | 9-slice | Scrollbar background |
| Panel scroll thumb | 1 | 9-slice | Scrollbar handle |

### Modal/Dialog

| Asset | Count | Size | Notes |
|-------|-------|------|-------|
| Modal background | 1 | 9-slice | Darker, bordered |
| Modal header bar | 1 | 9-slice | Title area |
| Confirmation dialog | 1 | 9-slice | Smaller modal |
| Backdrop overlay | 1 | 1x1 stretched | Semi-transparent black |

### Minimap

| Asset | Count | Size | Notes |
|-------|-------|------|-------|
| Minimap frame | 1 | 220x220 | Ornate Roman border |
| Minimap viewport indicator | 1 | Code-drawn | Rectangle showing current view |

### Tooltip

| Asset | Count | Size | Notes |
|-------|-------|------|-------|
| Tooltip background | 1 | 9-slice | Dark with border |
| Tooltip arrow | 4 (up/down/left/right) | 12x8 | Pointer |

**Total UI HUD/panel assets: ~25 (most are 9-slice)**

---

## 13. UI — Icons

### Resource Icons

| Icon | Key | Size |
|------|-----|------|
| Wood | `res_wood` | 32x32 |
| Stone | `res_stone` | 32x32 |
| Silver | `res_silver` | 32x32 |
| Population (free) | `res_pop` | 32x32 |
| Population (used) | `res_pop_used` | 32x32 |
| Favor | `res_favor` | 32x32 |
| Gloria points | `res_gloria` | 32x32 |
| Battle points | `res_bp` | 32x32 |

### Research Icons (34 technologies)

| Research | Key | Size |
|----------|-----|------|
| Velites | `tech_slinger` | 48x48 |
| Sagittarius | `tech_archer` | 48x48 |
| City Guard | `tech_city_guard` | 48x48 |
| Praetorian | `tech_hoplite` | 48x48 |
| Diplomacy | `tech_diplomacy` | 48x48 |
| Meteorology | `tech_meteorology` | 48x48 |
| Espionage | `tech_espionage` | 48x48 |
| Booty | `tech_booty` | 48x48 |
| Ceramics | `tech_ceramics` | 48x48 |
| Equites | `tech_horseman` | 48x48 |
| Architecture | `tech_architecture` | 48x48 |
| Trainer | `tech_trainer` | 48x48 |
| Settlement Fleet | `tech_colony_ship` | 48x48 |
| Bireme | `tech_bireme` | 48x48 |
| Crane | `tech_crane` | 48x48 |
| Shipwright | `tech_shipwright` | 48x48 |
| Quadriga | `tech_chariot` | 48x48 |
| Quinquereme | `tech_light_ship` | 48x48 |
| Conscription | `tech_conscription` | 48x48 |
| Fire Ship | `tech_fire_ship` | 48x48 |
| Onager | `tech_catapult` | 48x48 |
| Cryptography | `tech_cryptography` | 48x48 |
| Democracy | `tech_democracy` | 48x48 |
| Liburna | `tech_fast_transport` | 48x48 |
| Plow | `tech_plow` | 48x48 |
| Bunks | `tech_bunks` | 48x48 |
| Trireme | `tech_trireme` | 48x48 |
| Phalanx | `tech_phalanx` | 48x48 |
| Breakthrough | `tech_breakthrough` | 48x48 |
| Mathematics | `tech_mathematics` | 48x48 |
| Ram | `tech_ram` | 48x48 |
| Cartography | `tech_cartography` | 48x48 |
| Conquest | `tech_conquest` | 48x48 |
| Stone Hail | `tech_stone_hail` | 48x48 |

### Notification Icons

| Icon | Key | Size |
|------|-----|------|
| Attack incoming | `notif_attack` | 32x32 |
| Support arriving | `notif_support` | 32x32 |
| Building complete | `notif_build` | 32x32 |
| Recruitment complete | `notif_recruit` | 32x32 |
| Research complete | `notif_research` | 32x32 |
| Trade arrived | `notif_trade` | 32x32 |
| City conquered | `notif_conquest` | 32x32 |
| City lost | `notif_lost` | 32x32 |
| Message received | `notif_message` | 32x32 |
| Legion alert | `notif_legion` | 32x32 |
| Hero healed | `notif_hero` | 32x32 |
| Spy report | `notif_spy` | 32x32 |
| Provincial Quest | `notif_quest` | 32x32 |

### Navigation Icons

| Icon | Key | Size |
|------|-----|------|
| City view | `nav_city` | 32x32 |
| Map view | `nav_map` | 32x32 |
| Military overview | `nav_military` | 32x32 |
| Research overview | `nav_research` | 32x32 |
| Legion overview | `nav_legion` | 32x32 |
| Messages | `nav_messages` | 32x32 |
| Reports | `nav_reports` | 32x32 |
| Rankings | `nav_rankings` | 32x32 |
| Settings | `nav_settings` | 32x32 |
| Shop | `nav_shop` | 32x32 |
| Attack planner | `nav_planner` | 32x32 |
| City manager | `nav_manager` | 32x32 |

### Miscellaneous Icons

| Icon | Key | Size |
|------|-----|------|
| Sword (attack) | `ico_attack` | 24x24 |
| Shield (defense) | `ico_defense` | 24x24 |
| Speed (movement) | `ico_speed` | 24x24 |
| Clock (timer) | `ico_clock` | 24x24 |
| Skull (dead) | `ico_dead` | 24x24 |
| Star (points) | `ico_points` | 24x24 |
| Crown (rank) | `ico_rank` | 24x24 |
| Lock (protected) | `ico_lock` | 24x24 |
| Eye (spy) | `ico_spy` | 24x24 |
| Hammer (build) | `ico_build` | 24x24 |
| Coin (trade) | `ico_trade` | 24x24 |
| Scroll (report) | `ico_report` | 24x24 |

**Total icons: ~120**

---

## 14. UI — Buttons & Controls

### Button Styles

Each button needs 4 states: normal, hover, pressed, disabled.

| Button Type | Sizes | States | Total Sprites |
|-------------|-------|--------|---------------|
| Primary (action) | 3 (S/M/L) | 4 | 12 |
| Secondary | 3 | 4 | 12 |
| Danger (destructive) | 2 (S/M) | 4 | 8 |
| Icon button (round) | 1 | 4 | 4 |
| Tab button | 1 | 4 (+ active) | 5 |
| Toggle switch | 1 | 2 (on/off) | 2 |

All buttons use 9-slice scaling.

### Input Fields

| Control | States | Size |
|---------|--------|------|
| Text input | 3 (default, focus, error) | 9-slice |
| Dropdown | 2 (closed, open) | 9-slice |
| Checkbox | 4 (unchecked, checked, hover, disabled) | 24x24 |
| Slider track | 1 | 9-slice |
| Slider thumb | 2 (normal, dragging) | 16x16 |

### Progress Bars

| Bar Type | Variants | Size |
|----------|----------|------|
| Build queue progress | 1 | 9-slice |
| Recruitment progress | 1 | 9-slice |
| XP/level bar | 1 | 9-slice |
| Health bar (hero) | 1 | 9-slice |
| Favor bar | 1 | 9-slice |

### Cursors

| Cursor | Key | Size |
|--------|-----|------|
| Default | `cursor_default` | 32x32 |
| Attack | `cursor_attack` | 32x32 |
| Support | `cursor_support` | 32x32 |
| Move | `cursor_move` | 32x32 |
| Build | `cursor_build` | 32x32 |
| Spy | `cursor_spy` | 32x32 |
| Not allowed | `cursor_blocked` | 32x32 |

**Total button/control assets: ~60**

---

## 15. Visual Effects & Particles

### Sprite-Based Effects

| Effect | Key | Frames | Size | Trigger |
|--------|-----|--------|------|---------|
| Sword clash | `fx_melee` | 6 | 64x64 | Land battle impact |
| Arrow volley | `fx_arrows` | 4 | 128x64 | Ranged attack |
| Boulder impact | `fx_boulder` | 4 | 64x64 | Onager hit |
| Ship ram | `fx_ram` | 4 | 96x48 | Naval battle |
| Fire burst | `fx_fire` | 8 | 64x64 | Fire ship, burning |
| Smoke plume | `fx_smoke` | 6 | 64x64 | Destruction |
| Construction sparkle | `fx_build` | 4 | 48x48 | Building complete |
| Level up glow | `fx_levelup` | 6 | 96x96 | Research/upgrade |
| Blessing shimmer | `fx_bless` | 4 | 96x96 | Divine power buff |
| Dark mist | `fx_dark` | 6 | 128x128 | Pluto powers |
| Water splash | `fx_splash` | 4 | 64x64 | Naval, Neptune |
| Lightning bolt | `fx_lightning` | 4 | 128x192 | Jupiter powers |

### Particle Textures (for PixiJS ParticleContainer)

| Particle | Key | Size | Use |
|----------|-----|------|-----|
| Fire ember | `ptcl_ember` | 4x4 | Fire effects |
| Spark | `ptcl_spark` | 4x4 | Lightning, metal clash |
| Dust mote | `ptcl_dust` | 4x4 | Movement, construction |
| Water drop | `ptcl_water` | 4x4 | Naval, rain |
| Smoke puff | `ptcl_smoke` | 8x8 | Destruction |
| Gold glitter | `ptcl_gold` | 4x4 | Reward, treasure |
| Blood drop | `ptcl_blood` | 4x4 | Combat |
| Leaf | `ptcl_leaf` | 8x8 | Diana powers, nature |

**Total effect/particle assets: ~50**

---

## 16. Full-Screen Art

Loaded individually as needed, NOT in sprite atlases.

| Asset | Key | Size | Notes |
|-------|-----|------|-------|
| Login screen background | `bg_login` | 1920x1080 | Roman cityscape, dramatic |
| World selection screen | `bg_worlds` | 1920x1080 | Mediterranean map overview |
| Loading screen | `bg_loading` | 1920x1080 | Roman mosaic or fresco style |
| Victory screen | `bg_victory` | 1920x1080 | Triumphant Roman scene |
| Defeat screen | `bg_defeat` | 1920x1080 | Fallen Rome scene |
| Tutorial backdrop | `bg_tutorial` | 1920x1080 | Parchment/scroll style |
| World closed/archived screen | `bg_closed` | 1920x1080 | Sunset over ruins |
| Seasonal event banner | `bg_event` | 1200x400 | Holiday/event themed |

**Total: ~8-10 images**

---

## 17. Audio

Not visual assets but budget-relevant and often AI-generatable.

### Music

| Track | Duration | Mood |
|-------|----------|------|
| Main theme | ~2:30 | Epic, orchestral, Roman triumph |
| City building | ~2:00 | Calm, constructive, ambient |
| Battle | ~2:00 | Intense, drums, horns |
| Map exploration | ~2:00 | Adventurous, Mediterranean |
| Victory fanfare | ~0:30 | Triumphant brass |
| Defeat dirge | ~0:30 | Somber strings |

### Sound Effects

| Category | Sounds | Count |
|----------|--------|-------|
| UI clicks | Button click, tab switch, open panel, close panel, error | 5 |
| Building | Construction start, construction complete, demolish | 3 |
| Recruitment | Unit recruited, unit queue started | 2 |
| Military | Sword clash, arrow fire, cavalry charge, catapult launch, ship horn | 5 |
| Divine | Spell cast (generic), lightning, earthquake, blessing | 4 |
| Notifications | Attack warning, message received, quest available, trade arrived | 4 |
| Ambient | Ocean waves, city bustle, birds, wind | 4 |

**Total audio assets: ~33**

### AI Music Generation Tools

| Tool | Best For | Cost |
|------|----------|------|
| Suno AI | Full tracks with specific mood prompts | Free tier / $10/month |
| Udio | High quality music generation | Free tier / $10/month |
| Eleven Labs Sound Effects | UI and game SFX | Free tier / $5/month |

---

## 18. Skin Shop Assets

Cosmetic skins (monetization). These are produced ongoing, post-launch.

### City Theme Skins

| Skin Pack | Contents | Assets Per Pack |
|-----------|----------|-----------------|
| "Eastern Province" | All 22 buildings reskinned (Persian/Egyptian style) | ~110 sprites |
| "Britannic Fort" | All 22 buildings reskinned (Northern stone/wood) | ~110 sprites |
| "Egyptian Colony" | All 22 buildings reskinned (Egyptian architecture) | ~110 sprites |

### Unit Skins

| Skin | Contents | Assets |
|------|----------|--------|
| "Golden Legion" | All 8 land units with gold armor | 24 (8 x 3 variants) |
| "Shadow Guard" | All 8 land units with dark/black theme | 24 |
| "Praetorian Elite" | All naval units with ornate hulls | 21 |

### Legion Banners

| Asset | Variants | Size |
|-------|----------|------|
| Banner templates | 20 designs | 64x96 |
| Banner colors | Applied via tint | N/A |
| Banner frames | 5 rarity levels | 72x104 |

### Avatars

| Category | Count | Size |
|----------|-------|------|
| Base avatars (free) | 10 | 128x128 |
| Premium avatars | 20+ (ongoing) | 128x128 |
| Avatar frames | 10 (by rarity) | 144x144 |

### Map Themes

| Theme | What Changes | Assets |
|-------|-------------|--------|
| "Sunset" | Ocean color filter, warm palette | 1 shader config |
| "Winter" | Snow overlay, ice water | Terrain retextures ~15 |
| "Volcanic" | Dark ocean, red sky, lava cracks | Terrain retextures ~15 |

---

## 19. Sprite Sheet Organization

### Atlas Files for PixiJS

```
client/public/assets/
├── atlases/
│   ├── buildings-t1.json + .webp       # Buildings tiers 1-2 (~55 sprites)
│   ├── buildings-t2.json + .webp       # Buildings tiers 3-5 (~55 sprites)
│   ├── units-land.json + .webp         # Land unit sprites + icons
│   ├── units-naval.json + .webp        # Naval unit sprites + icons
│   ├── units-mythical.json + .webp     # Mythical unit sprites + icons
│   ├── map-terrain.json + .webp        # Terrain tiles, decorations
│   ├── map-islands.json + .webp        # Island sprites (all zoom levels)
│   ├── map-markers.json + .webp        # Cities, villages, markers
│   ├── map-effects.json + .webp        # Movement sprites, battle effects
│   ├── ui-hud.json + .webp             # HUD panels, frames, 9-slices
│   ├── ui-icons.json + .webp           # All icons (resource, tech, nav, notif)
│   ├── ui-buttons.json + .webp         # Button states, controls
│   ├── effects.json + .webp            # VFX sprite frames
│   └── particles.json + .webp          # Tiny particle textures
│
├── gods/                               # Loaded individually (large)
│   ├── jupiter.webp
│   ├── neptune.webp
│   ├── minerva.webp
│   ├── juno.webp
│   ├── pluto.webp
│   ├── diana.webp
│   ├── venus.webp
│   └── mars.webp
│
├── heroes/                             # Loaded individually
│   ├── hero_001.webp ... hero_038.webp
│
├── backgrounds/                        # Loaded individually (large)
│   ├── login.webp
│   ├── worlds.webp
│   ├── loading.webp
│   ├── victory.webp
│   └── defeat.webp
│
├── shaders/                            # GLSL shader files
│   ├── ocean-wave.frag
│   ├── fog-of-war.frag
│   └── territory-overlay.frag
│
└── audio/
    ├── music/
    │   ├── theme.mp3
    │   ├── city.mp3
    │   ├── battle.mp3
    │   └── map.mp3
    └── sfx/
        ├── click.mp3
        ├── build_complete.mp3
        └── ... (30+ files)
```

### Loading Strategy

| Game State | Load These Atlases | Estimated Size |
|------------|-------------------|----------------|
| Login | backgrounds/login | ~500KB |
| World select | backgrounds/worlds | ~500KB |
| Entering world | map-terrain, map-islands, map-markers, ui-hud, ui-icons, ui-buttons | ~3MB |
| City view | buildings-t1, buildings-t2 | ~1.5MB |
| Military action | units-land, units-naval, map-effects, effects | ~2MB |
| Divine | units-mythical, gods/* | ~2MB |
| First battle | effects, particles | ~500KB |

**Total initial load (entering world): ~3MB**
**Total all assets loaded: ~10-12MB**

---

## 20. PixiJS Technical Specs

### Texture Requirements

| Parameter | Value | Reason |
|-----------|-------|--------|
| Max atlas size | 2048x2048 | Compatible with all GPUs including mobile |
| Format (production) | WebP | 30-50% smaller than PNG, wide support |
| Format (fallback) | PNG | Universal fallback |
| Sprite padding | 2px | Prevent bleeding at edges |
| Trim transparent pixels | Yes | Saves 20-40% atlas space |
| Premultiplied alpha | Yes | Standard for PixiJS |

### Sprite Sheet JSON Format

PixiJS uses TexturePacker's JSON Hash format:

```json
{
  "frames": {
    "building_senate_t1": {
      "frame": {"x": 0, "y": 0, "w": 128, "h": 128},
      "sourceSize": {"w": 128, "h": 128},
      "trimmed": false
    }
  },
  "meta": {
    "image": "buildings-t1.webp",
    "size": {"w": 2048, "h": 2048},
    "scale": 1
  }
}
```

### Resolution Handling

| Device | Pixel Ratio | Strategy |
|--------|-------------|----------|
| Standard desktop | 1x | Load `@1x` assets |
| Retina/HiDPI | 2x | Load `@2x` assets (double resolution) |
| Mobile | 1x-3x | Load `@1x`, rely on GPU scaling |

For MVP: `@1x` only. Add `@2x` post-launch for polish.

### Performance Budget

| Metric | Target |
|--------|--------|
| Initial load (world entry) | <3MB, <3 seconds |
| Total assets (all loaded) | <12MB |
| Sprite draw calls per frame | <50 (batching) |
| Max sprites on screen | <5000 |
| Target FPS | 60fps desktop, 30fps mobile |
| Atlas count | <15 sheets |

---

## 21. AI Generation Pipeline

### Phase 1 — Style Definition (Week 1)

**Tool**: Midjourney v6

| Task | Prompts | Output |
|------|---------|--------|
| Art style reference | "Roman Empire strategy game, 2D top-down, warm Mediterranean palette, semi-realistic illustration style" | 5-10 style reference images |
| God portraits (8) | "Jupiter Roman god portrait, majestic, eagle, thunderbolt, gold and white, game art, 2D illustration" (per god) | 8 final portraits |
| Key building concepts (5) | "Roman Curia building, top-down view, game sprite, white marble, red roof tiles, Mediterranean style" | 5 reference buildings |
| Key unit concepts (5) | "Roman Legionary soldier, 2D game sprite, top-down view, red shield, bronze armor" | 5 reference units |

**Cost**: ~$10 (Basic plan, ~200 images)

### Phase 2 — Custom Model Training (Week 1-2)

**Tool**: Scenario.gg

1. Upload all Midjourney outputs as training data
2. Train custom model: "Imperium Game Art Style"
3. Model learns: color palette, level of detail, perspective, rendering style

**Cost**: ~$29/month (Pro plan)

### Phase 3 — Bulk Sprite Generation (Week 2-4)

**Tool**: Scenario.gg (trained model)

| Batch | Count | Prompts |
|-------|-------|---------|
| Buildings (22 types × 5 tiers) | 110 | "Roman [building name], tier [1-5], top-down, game sprite, transparent background" |
| Land unit sprites (8) | 8 | "Roman [unit name], top-down, game sprite, transparent background" |
| Land unit icons (8) | 8 | "Icon of Roman [unit name], 32x32, clean, game UI icon" |
| Naval units (7) | 7 | "Roman [ship name], top-down, game sprite, transparent background" |
| Mythical units (16) | 16 | "[creature name], Roman mythology, top-down, game sprite" |
| Island variants (20) | 20 | "Mediterranean island, top-down, game map sprite, [wood/stone/silver] terrain" |
| Decorations (20) | 20 | "Roman [object], top-down, game sprite, transparent background" |
| Hero portraits (38) | 38 | "Roman [hero type] portrait, bust, game art, [Mars/Minerva] themed" |

**Cost**: Included in Scenario Pro plan

### Phase 4 — Textures (Week 2-3)

**Tool**: Stable Diffusion (local or Replicate)

| Texture | Prompt Strategy |
|---------|----------------|
| Ocean water (tileable) | "Seamless Mediterranean sea water texture, top-down, blue-green, subtle waves" + tiling ControlNet |
| Terrain types (8) | "Seamless [grass/sand/rock/farmland] texture, Mediterranean, top-down" + tiling |
| UI backgrounds | "Roman parchment texture, aged paper", "Roman marble texture, white grey" |

**Cost**: Free (local GPU) or ~$5 (Replicate)

### Phase 5 — UI & Icons (Week 3-4)

**Tool**: Recraft.ai + Figma

| Task | Tool |
|------|------|
| Resource icons (8) | Recraft — "Wood pile icon, game UI, clean, 32x32" |
| Research icons (34) | Recraft — "Roman [technology] icon, game UI, clean, 48x48" |
| Navigation icons (12) | Recraft — consistent set |
| Notification icons (13) | Recraft — consistent set |
| UI layout & panels | Figma — design system, then export 9-slices |

**Cost**: Free (Recraft free tier + Figma free tier)

### Phase 6 — Pack & Optimize (Week 4)

**Tool**: TexturePacker ($40 one-time) or free-tex-packer (free)

1. Clean up all generated sprites (remove artifacts, fix transparency)
2. Organize into atlas groups (see Section 19)
3. Pack into 2048x2048 sprite sheets
4. Export as WebP + JSON (PixiJS format)
5. Generate @1x and optionally @2x variants

### Phase 7 — Effects & Audio (Week 4-5)

| Task | Tool |
|------|------|
| Particle textures | Hand-drawn (4x4px, trivial) |
| VFX sprite sheets | PixiJS particle config + basic sprites |
| GLSL shaders | Hand-coded (ocean wave, fog of war) |
| Music (6 tracks) | Suno AI or Udio |
| Sound effects (30) | Eleven Labs SFX or Freesound.org |

### Total Pipeline Cost

| Tool | Cost |
|------|------|
| Midjourney (2 months) | $20 |
| Scenario.gg (2 months) | $58 |
| Stable Diffusion | $0-5 |
| Recraft | $0 |
| TexturePacker | $40 |
| Suno AI (1 month) | $10 |
| **Total** | **~$130** |

---

## 22. MVP Asset Reduction

For alpha/prototype, cut to absolute minimum:

| Category | MVP Count | What to include |
|----------|-----------|-----------------|
| Buildings | 30 | 6 core buildings × 5 tiers (Curia, Villa Rustica, Horreum, Castra, Portus, Fortification) |
| Land units | 12 | 4 units × 3 assets (Legionary, Velites, Praetorian, Equites) |
| Naval units | 6 | 2 units × 3 assets (Bireme, Quinquereme) |
| Mythical | 0 | Skip for MVP |
| Gods | 2 portraits | Jupiter + Mars only |
| Heroes | 0 | Skip for MVP |
| Map terrain | 5 | Ocean, grass, sand, rock + 1 island variant |
| Islands | 4 | 2 large + 2 small |
| Cities/markers | 5 | City marker × 3 sizes + ghost + selection |
| UI | 40 | Minimal HUD, basic panels, essential icons |
| Effects | 10 | Basic battle + construction |
| Full-screen art | 2 | Login + loading screen |
| **MVP Total** | **~115 assets** | **2-3 atlas sheets, <2MB** |

### MVP Priority Order

1. **Map + navigation** (ocean, islands, cities, pan/zoom) — playable world
2. **City view + buildings** (6 core buildings, build queue) — core loop
3. **Units + combat** (4 land + 2 naval, basic battle) — core gameplay
4. **UI essentials** (resource bar, panels, buttons) — usable interface
5. **Everything else** — layers added incrementally
