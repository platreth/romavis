# Grepolis Private Server - Complete Game Mechanics Reference

Compiled from official Grepolis Wiki (wiki.en.grepolis.com), community guides (grepolis-pro.blogspot.com), InnoGames support pages, and Grepolis DevBlog.

---

## TABLE OF CONTENTS

1. [Buildings](#1-buildings)
2. [Units](#2-units)
3. [Combat System](#3-combat-system)
4. [Resources](#4-resources)
5. [Research / Technologies](#5-research--technologies)
6. [Gods & Divine Powers](#6-gods--divine-powers)
7. [World Map](#7-world-map)
8. [Alliances](#8-alliances)
9. [World Settings](#9-world-settings)
10. [Conquest / Revolt System](#10-conquest--revolt-system)
11. [Events & Special Mechanics](#11-events--special-mechanics)
12. [UI/UX Reference](#12-uiux-reference)

---

## 1. BUILDINGS

### 1.1 Complete Building List

All buildings are constructed via the Senate. Building costs rise exponentially with level.

| Building | Max Level | Requirements | Purpose |
|----------|-----------|--------------|---------|
| Senate | 25 | None (available from start) | Administrative center; higher level = faster construction |
| Timber Camp | 40 | None (available from start) | Produces wood per hour |
| Quarry | 40 | None (available from start) | Produces stone per hour |
| Silver Mine | 40 | None (available from start) | Produces silver per hour |
| Farm | 45 | None (available from start) | Provides population capacity |
| Warehouse | 35 | None (available from start) | Stores resources; hidden stash = 100 per resource per level |
| Barracks | 30 | Silver Mine 1, Senate 2, Farm 3, Timber Camp 1 | Trains land and mythical units |
| Harbour | 30 | Senate 14, Timber Camp 15, Silver Mine 10 | Builds naval units |
| Academy | 36 | Senate 8, Barracks 7 | Provides 4 research points per level (max 144 RP at level 36; +12 with Library) |
| Temple | 30 | Quarry 1 | Worship gods; generates divine favor |
| Market Place | 30 | Senate 5, Warehouse 5 | Trade resources; trade capacity increases with level |
| Cave | 10 | Senate 8, Silver Mine 8 | Stores silver for espionage; at level 10 = unlimited storage |
| City Wall | 25 | Senate 5, Temple 3 | Defense bonus from 3.7% (level 1) to 141.9% (level 25) |
| Agora | 1 (fixed) | None | Troop overview, culture events, simulator |

### 1.2 Special Buildings (Choose 1 from each tier, 2 total per city)

**Left Tier:**

| Building | Points | Requirements | Effect |
|----------|--------|--------------|--------|
| Theatre | 500 | Senate 22, Academy 22 | Enables Theatre Plays for culture points (costs 10k wood, 12k stone, 10k silver; 5 days on speed 1) |
| Thermal Baths | 500 | Senate 22 | +10% population capacity |
| Library | 500 | Senate 22, Academy 22 | +12 additional research points |
| Lighthouse | 500 | Senate 22, Harbour 20 | +15% fleet speed |

**Right Tier:**

| Building | Points | Requirements | Effect |
|----------|--------|--------------|--------|
| Tower | 500 | Senate 22, City Wall 20 | +10% troop defensive strength |
| Divine Statue | 500 | Senate 22, Temple 10 | +5 temple levels worth of favor for the city's god |
| Oracle | 500 | Senate 22, Cave 5 | Reveals successful enemy espionage attempts |
| Merchant's Shop | 500 | Senate 22, Market Place 15 | Increased farm trade ratio; marketplace trade capacity from 500 to 750 per level |

### 1.3 Senate Level Data (Complete)

Build times at speed 1 with Senate level = current level being built. Costs: Wood / Stone / Silver.

| Level | Wood | Stone | Silver | Pop | Build Time | Speed Bonus | Points |
|-------|------|-------|--------|-----|------------|-------------|--------|
| 1 | - | - | - | 0 | - | 100.0% | 110 |
| 2 | 5 | 2 | 2 | 3 | 0:00:03 | 98.6% | 121 |
| 3 | 25 | 12 | 10 | 6 | 0:00:05 | 97.0% | 133 |
| 4 | 70 | 40 | 29 | 9 | 0:00:08 | 95.3% | 146 |
| 5 | 152 | 93 | 64 | 13 | 0:02:08 | 93.5% | 161 |
| 6 | 283 | 186 | 123 | 17 | 0:05:16 | 91.5% | 177 |
| 7 | 394 | 275 | 176 | 21 | 0:09:30 | 89.5% | 195 |
| 8 | 525 | 385 | 239 | 25 | 0:18:39 | 87.4% | 214 |
| 9 | 676 | 519 | 313 | 30 | 1:17:55 | 85.3% | 236 |
| 10 | 848 | 678 | 399 | 35 | 2:52:02 | 83.0% | 259 |
| 11 | 1040 | 862 | 497 | 40 | 4:29:04 | 80.8% | 285 |
| 12 | 1254 | 1075 | 607 | 46 | 5:40:13 | 78.4% | 314 |
| 13 | 1490 | 1316 | 730 | 52 | 6:46:41 | 76.1% | 345 |
| 14 | 1747 | 1588 | 865 | 58 | 7:23:40 | 73.7% | 380 |
| 15 | 2027 | 1890 | 1014 | 64 | 7:57:17 | 71.2% | 418 |
| 16 | 2328 | 2226 | 1176 | 70 | 8:38:09 | 68.7% | 459 |
| 17 | 2652 | 2595 | 1352 | 77 | 9:17:33 | 66.1% | 505 |
| 18 | 2999 | 2998 | 1542 | 84 | 9:55:05 | 63.6% | 556 |
| 19 | 3369 | 3439 | 1746 | 91 | 10:30:17 | 60.9% | 612 |
| 20 | 3762 | 3914 | 1965 | 98 | 11:02:47 | 58.3% | 673 |
| 21 | 4178 | 4428 | 2199 | 106 | 11:32:07 | 55.6% | 740 |
| 22 | 4617 | 4981 | 2447 | 113 | 11:57:53 | 52.9% | 814 |
| 23 | 5080 | 5574 | 2710 | 131 | 12:19:39 | 50.1% | 895 |
| 24 | 5567 | 6208 | 2989 | 139 | 12:37:01 | 47.4% | 985 |
| 25 | 6077 | 6884 | 3283 | 147 | 12:48:34 | 44.5% | 1083 |

**Note:** All build times are calculated at the Senate level shown. For world speed > 1, divide build time by world speed. Architecture research reduces building resource costs by 15%. Crane research speeds Senate build time by 10%.

### 1.4 City Wall Level Data (Complete)

| Level | Wood | Stone | Silver | Pop | Build Time (Senate 15) | Defense Bonus | Base Defense | Points |
|-------|------|-------|--------|-----|------------------------|---------------|--------------|--------|
| 0 | - | - | - | - | - | - | - | 10 |
| 1 | 400 | 350 | 200 | 1 | 0:01:20 | 3.7% | 20 | 34 |
| 2 | 400 | 700 | 429 | 2.5 | 0:06:35 | 7.5% | 30 | 38 |
| 3 | 400 | 1050 | 670 | 2.7 | 0:16:43 | 11.4% | 40 | 42 |
| 4 | 400 | 1400 | 919 | 2.8 | 0:32:25 | 15.5% | 50 | 47 |
| 5 | 400 | 1750 | 1175 | 2.9 | 0:54:09 | 19.7% | 60 | 53 |
| 6 | 400 | 2100 | 1435 | 3.1 | 1:22:22 | 24.1% | 70 | 59 |
| 7 | 400 | 2450 | 1701 | 3.1 | 1:57:25 | 28.5% | 80 | 66 |
| 8 | 400 | 2800 | 1970 | 3.2 | 2:39:37 | 33.3% | 90 | 74 |
| 9 | 400 | 3150 | 2242 | 3.3 | 3:29:17 | 38.0% | 100 | 83 |
| 10 | 400 | 3500 | 2518 | 3.3 | 4:26:40 | 43.0% | 110 | 93 |
| 11 | 400 | 3850 | 2796 | 3.4 | 5:35:23 | 48.1% | 120 | 104 |
| 12 | 400 | 4200 | 3077 | 3.4 | 6:15:32 | 53.5% | 130 | 117 |
| 13 | 400 | 4550 | 3360 | 3.5 | 6:56:43 | 59.0% | 140 | 131 |
| 14 | 400 | 4900 | 3646 | 3.5 | 7:38:53 | 64.7% | 150 | 147 |
| 15 | 400 | 5250 | 3933 | 3.6 | 8:21:56 | 70.5% | 160 | 164 |
| 16 | 400 | 5600 | 4222 | 3.6 | 9:05:52 | 76.7% | 170 | 184 |
| 17 | 400 | 5950 | 4514 | 3.6 | 9:50:37 | 82.9% | 180 | 206 |
| 18 | 400 | 6300 | 4807 | 3.7 | 10:36:10 | 89.5% | 190 | 231 |
| 19 | 400 | 6650 | 5101 | 3.7 | 11:22:30 | 96.2% | 200 | 258 |
| 20 | 400 | 7000 | 5397 | 3.7 | 12:09:34 | 103.3% | 210 | 289 |
| 21 | 400 | 7350 | 5695 | 3.8 | 12:57:21 | 110.4% | 220 | 324 |
| 22 | 400 | 7700 | 5994 | 3.8 | 13:45:49 | 117.9% | 230 | 363 |
| 23 | 400 | 8050 | 6294 | 3.8 | 14:34:56 | 125.6% | 240 | 407 |
| 24 | 400 | 8400 | 6596 | 3.8 | 15:24:42 | 133.6% | 250 | 455 |
| 25 | 400 | 8750 | 6899 | 3.9 | 16:15:06 | 141.9% | 260 | 510 |

**Wall Defense Formula:** `total_defense = original_defense * (1 + wall_bonus_percent / 100)`

With Tower special building: additional +10% defense bonus.

Full wall (25) + Tower = 141.9% + 10% = ~151.9% total defense bonus.

**Base Defense** is innate city defense even without troops. It increases with wall level.

---

## 2. UNITS

### 2.1 Land Units

| Unit | Pop | Weapon Type | Attack | Def (Blunt) | Def (Sharp) | Def (Ranged) | Speed | Booty | Wood | Stone | Silver | Base Recruit Time |
|------|-----|-------------|--------|-------------|-------------|--------------|-------|-------|------|-------|--------|-------------------|
| Militia | 0 | N/A (def only) | 0 | 6 | 8 | 4 | - | 0 | 0 | 0 | 0 | Activated from Farm (3h duration, halves production) |
| Swordsman | 1 | Blunt | 5 | 14 | 8 | 30 | 6 | 16 | 95 | 0 | 85 | 0:18:00 |
| Slinger | 1 | Ranged | 23 | 7 | 8 | 2 | 14 | 8 | 55 | 100 | 40 | 0:18:00 |
| Archer | 1 | Ranged | 8 | 6 | 25 | 12 | 10 | 10 | 120 | 0 | 75 | 0:19:04 |
| Hoplite | 1 | Sharp | 16 | 18 | 12 | 7 | 6 | 16 | 0 | 75 | 150 | 0:18:07 |
| Horseman | 3 | Blunt | 55 | 18 | 1 | 24 | 22 | 72 | 240 | 120 | 36 | 0:21:56 |
| Chariot | 4 | Sharp | 56 | 76 | 16 | 56 | 16 | 56 | 200 | 440 | 320 | ~1:03:55 |
| Catapult | 15 | Ranged (siege) | 100 | 30 | 30 | 30 | 2 | 400 | 1200 | 1200 | 1200 | ~5:43:27 |

**Militia Notes:**
- 10 militia per farm level (15 with City Guard research)
- Max 400 militia (600 with City Guard), 450/675 in Hero worlds
- Purely defensive, cannot attack or be sent as support
- Activating militia halves resource production for 3 hours
- Disappear after 3 hours

**Recruitment Time Notes:**
- Times shown are for Barracks level 1, Speed 1 world
- Each barracks level reduces training time (level 30 reduces to ~59% of base time)
- Trainer research: -10% barracks training time
- Population Growth (Hera): -50% training time for 12h

### 2.2 Naval Units

| Unit | Pop | Attack | Defense | Speed | Transport Cap | Wood | Stone | Silver | Base Recruit Time |
|------|-----|--------|---------|-------|---------------|------|-------|--------|-------------------|
| Transport Boat | 7 | 1 | 1 | 8 | 20 (26 with Bunks) | 500 | 500 | 400 | 2:40:00 |
| Fast Transport Ship | 5 | 1 | 1 | 15 | 10 (16 with Bunks) | 800 | 0 | 400 | 2:00:00 |
| Bireme | 8 | 24 | 160 | 15 | 0 | 800 | 700 | 100 | 2:45:00 |
| Light Ship | 10 | 200 | 60 | 13 | 0 | 1300 | 300 | 800 | 4:00:00 |
| Fire Ship | 8 | N/A (special) | N/A | 5 | 0 | 500 | 750 | 150 | 1:06:40 |
| Trireme | 16 | 180 | 250 | 9 | 0 | 2000 | 1300 | 900 | 4:00:00 |
| Colony Ship | 170 | 0 | 0 | 3 | 0 | 10000 | 10000 | 10000 | ~15:58:55 |

**Fire Ship Notes:**
- Last-defense unit; only fights AFTER regular naval battle
- Each fire ship destroys one enemy ship but is also destroyed
- Cannot destroy Colony Ships or Transport Ships
- Can only be used for defense

**Naval Combat:** Naval units have a single attack and defense value (no weapon types). Naval battle occurs before land units can disembark.

### 2.3 Mythical Units

Mythical units are recruited in the Barracks, cost resources AND divine favor, and require worshiping the corresponding god.

| Unit | God | Pop | Type | Attack | Def(B) | Def(S) | Def(R) | Speed | Favor | Wood | Stone | Silver |
|------|-----|-----|------|--------|--------|--------|--------|-------|-------|------|-------|--------|
| Minotaur | Zeus | 30 | Blunt | 650 | 750 | 330 | 640 | 10 | 180 | 1400 | 600 | 1000 |
| Manticore | Zeus | 45 | Sharp | 1010 | 170 | 225 | 505 | 22 (Flying) | 270 | 3000 | 1400 | 2700 |
| Cyclops | Poseidon | 40 | Ranged | 1035 | 1050 | 10 | 1450 | 8 | 240 | 2100 | 2300 | 1200 |
| Hydra | Poseidon | 50 | Naval | 1310 | N/A | N/A | N/A | 8 | 300 | 3500 | 4000 | 2500 |
| Harpy | Hera | 14 | Blunt | 295 | 105 | 70 | 1 | 25 (Flying) | 85 | 700 | 500 | 550 |
| Medusa | Hera | 18 | Sharp | 425 | 480 | 345 | 290 | 6 | 110 | 900 | 1100 | 500 |
| Centaur | Athena | 12 | Ranged | 134 | 195 | 585 | 80 | 18 | 70 | 600 | 350 | 280 |
| Pegasus | Athena | 20 | Sharp | 100 | 750 | 275 | 275 | 35 (Flying) | 120 | 1200 | 800 | 1600 |
| Cerberus | Hades | 30 | Blunt | 210 | 825 | 300 | 1575 | 4 | 180 | 1250 | 1050 | 700 |
| Erinys | Hades | 55 | Ranged | 1700 | 460 | 460 | 595 | 10 | 330 | 4500 | 3000 | 3200 |
| Griffin | Artemis | 35 | Blunt | 900 | 320 | 330 | 100 | 18 | 230 | 2200 | 1100 | 2600 |
| Calydonian Boar | Artemis | 20 | Sharp | 180 | 700 | 700 | 100 | 16 | 120 | 550 | 800 | 300 |
| Satyr | Aphrodite | 16 | Sharp | 385 | 55 | 105 | 170 | 136 | 95 | 500 | 400 | 800 |
| Siren | Aphrodite | 16 | Naval | 180 | N/A | N/A | N/A | 22 | 110 | 700 | 300 | 1000 |
| Ladon | Ares | 85 | Ranged | 1195-2988 | 478 | 390 | 420 | 40 | 490 | 6000 | 4000 | 5500 |
| Spartoi | Ares | 10 | Blunt | 205 | 100 | 100 | 150 | 16 | 60 | 200 | 100 | 150 |

**Flying Units (Manticore, Harpy, Pegasus):**
- Do NOT require transport boats
- Always bypass enemy navy (land directly)
- Can attack cross-island without naval escort

**Hydra:** Naval mythical unit. Fights in naval combat only.

**Siren Passive:** Improves movement speed of all naval units by 2% per Siren (up to 100% increase).

**Ladon Passive:** Against targets with higher population, gains +6% attack per 3000 population difference (up to 150%). All other units gain +1% attack per Ladon (up to 10%).

**Spartoi:** Cannot be recruited normally. Created through Ares Army divine power by consuming Fury. Takes only 1 pop in transport ships.

---

## 3. COMBAT SYSTEM

### 3.1 Core Battle Mechanics

Grepolis uses a ratio-based combat system:
- **Three weapon/defense types:** Blunt, Sharp, Ranged
- Each attacking unit has ONE attack type
- Each defending unit has THREE defense values (one per type)
- **Naval units:** Single attack + single defense value (no types)

**Battle Flow:**
1. Naval battle occurs first (if crossing islands)
2. If attacker wins naval, land units disembark
3. Land battle occurs
4. Battles are to total annihilation of one side (no partial retreats)

### 3.2 Combat Calculation

When attacking with a single weapon type:
```
Total Attack = sum of all attacking units' attack values
Total Defense = sum of all defending units' defense values for that weapon type
```

When attacking with mixed weapon types, the attack is proportionally split:
```
For each weapon type i:
  attack_ratio_i = total_attack_of_type_i / total_attack_all_types
  effective_defense_i = total_defense_of_type_i_for_all_defenders
  
  Contribution = attack_ratio_i * (total_attack_of_type_i / effective_defense_i)
```

**Losses are proportional to the attack:defense ratio.** The side with lower total loses all units. The winning side loses units proportional to the losing side's strength.

**Approximate loss formula (from community reverse engineering):**
```
If attack > defense:
  defender_losses = 100% (all defenders die)
  attacker_losses_percent ~ (defense / attack) * some_factor
  
If defense > attack:
  attacker_losses = 100% (all attackers die)
  defender_losses_percent ~ (attack / defense) * some_factor
```

NOTE: The exact internal formula has never been officially published by InnoGames.

### 3.3 Luck Factor

```
Luck ranges from -30% to +30% (uniform random)
Effective attack = base_attack * (1 + luck/100)
```

Always shown from attacker's perspective:
- +30% luck = attacker fights at 130% strength
- -30% luck = attacker fights at 70% strength

### 3.4 Morale System

**Formula:**
```
Morale = min(100, [(Points_Defender / Points_Attacker) * 3 + 0.3] * 100)
```

- Only active when world has morale enabled
- Only applies when attacker has 4x more points than defender
- Morale reduces attacker's effective strength
- Minimum morale: 30% (so max 70% reduction)

**Post-November 2017 (newer worlds) - City-count scaling:**
- 1 city defender: minimum morale 30%
- 2 cities: minimum 35%
- 3 cities: minimum 40%
- ...continues +5% per city...
- 11+ cities: minimum 80% (maximum 20% reduction)

**Post-August 2020:** Morale is disabled during sieges on conquest worlds (except ghost towns).

Morale has no effect on cities located on islands with an active World Wonder.

### 3.5 Wall Defense Bonus

**Formula:** `total_defense = base_defense * (1 + wall_bonus)`

Full wall bonus table in Section 1.4 above. Key values:
- Level 1: 3.7%
- Level 10: 43.0%
- Level 15: 70.5%
- Level 20: 103.3%
- Level 25: 141.9%

With Tower special building: +10% additional.

### 3.6 Base Defense

Every city has inherent base defense even without troops. The base defense value increases with wall level (from 10 at level 0 to 260 at level 25). This means even a single unit attacking an empty city can die.

### 3.7 Night Bonus

When enabled, **doubles** all defensive values during the night bonus window (typically midnight to 8am local server time). Not available on all worlds. International servers typically do not have night bonus.

### 3.8 Catapult Mechanics

- Catapults destroy wall levels during attacks
- ~25 catapults can fully destroy a level 25 wall in one attack
- With "Stone Hail" research: catapults have a chance to destroy a random building level (10% chance per catapult, excluding special buildings)
- Catapults are extremely slow (speed 2) and costly

### 3.9 Espionage Mechanics

- Requires a Cave building
- Spy costs: minimum 1000 silver stored in cave
- **Success condition:** Attacker's silver spent > Defender's silver stored in cave
- If **successful:** Attacker sees all troops, buildings, resources. Defender is NOT notified. No silver consumed from defender.
- If **failed:** Both players notified. Defender loses silver equal to attacker's spend.
- Cryptography research: +20% harder for enemy spies (effectively multiplies your cave silver by 1.2)
- Oracle special building: reveals when you've been successfully spied on

### 3.10 Support / Defense Stacking

- Any player can send troops to support any allied city
- Support troops fight using the DEFENDING city's researches (not the sending city's)
- Exception: attacking bonuses (Phalanx, Commander) apply based on the city that sent the attack
- Multiple players can stack defense in a single city
- Mythical support units must match the god worshipped in the defended city

### 3.11 Siege Mechanics (Conquest Worlds)

- During siege, the attacker occupies the city
- Defender cannot control the city
- Attacks on the besieged city work to LIFT the siege
- Supports to the besieged city work to MAINTAIN the siege
- Siege duration depends on world speed (typically 12-24h)
- Democracy research extends siege by 10%

### 3.12 Anti-Timer

All attacks/supports land within +/- 10 seconds of the displayed time. This is intentional to prevent perfect timing.

---

## 4. RESOURCES

### 4.1 Resource Types

- **Wood** (Timber Camp)
- **Stone** (Quarry)
- **Silver** (Silver Mine)
- **Divine Favor** (Temple) - per-god resource
- **Population** (Farm) - consumed by buildings and units

### 4.2 Resource Production (Timber Camp / Quarry / Silver Mine)

All three resource buildings follow the same production curve. Production per hour on a Speed 1 world, standard island:

| Level | Production/hr | Level | Production/hr | Level | Production/hr |
|-------|--------------|-------|--------------|-------|--------------|
| 1 | 7 | 15 | 106 | 29 | 203 |
| 2 | 12 | 16 | 114 | 30 | 209 |
| 3 | 18 | 17 | 123 | 31 | 216 |
| 4 | 24 | 18 | 132 | 32 | 222 |
| 5 | 30 | 19 | 141 | 33 | 229 |
| 6 | 37 | 20 | 147-153* | 34 | 235 |
| 7 | 43 | 21 | 153-165* | 35 | 242 |
| 8 | 51 | 22 | 159-177* | 36 | 248-278* |
| 9 | 58 | 23 | 165-190* | 37 | 255 |
| 10 | 66 | 24 | 171-202* | 38 | 261 |
| 11 | 73 | 25 | 177-215* | 39 | 268 |
| 12 | 81 | 26 | 184-228* | 40 | 275-426* |
| 13 | 89 | 27 | 190-241* |
| 14 | 98 | 28 | 196-255* |

*From level 20+, island type matters: each island produces +10% of one resource and -10% of another. The three columns (standard / +10% / -10%) apply.

**Production modifiers:**
- Merchant advisor: +30% base production
- Hera's Happiness spell: +50% for 12h (speed 1)
- Hades' Plague spell: -50% for 6h (speed 1)
- World speed multiplier: multiply production by world speed

### 4.3 Warehouse Capacity per Level

| Level | Capacity (no Ceramics) | Capacity (with Ceramics) | Hidden Stash |
|-------|------------------------|--------------------------|-------------|
| 1 | 300 | 2,800 | 100 |
| 5 | 2,267 | 4,767 | 500 |
| 10 | 5,518 | 8,018 | 1,000 |
| 15 | 9,324 | 11,824 | 1,500 |
| 20 | 13,550 | 16,050 | 2,000 |
| 25 | 18,125 | 20,625 | 2,500 |
| 30 | 23,000 | 25,500 | 3,000 |
| 35 | 28,142 | 30,642 | 3,500 |

**Ceramics research:** +2,500 storage capacity.
**Hidden Stash:** 100 of each resource per warehouse level is protected from looting.

### 4.4 Farm Population Capacity per Level

| Level | Max Pop | Militia | Level | Max Pop | Militia |
|-------|---------|---------|-------|---------|---------|
| 1 | 114 | 10 | 25 | 1,514 | 250 |
| 5 | 175 | 50 | 30 | 1,973 | 250 |
| 10 | 399 | 100 | 35 | 2,470 | 250 |
| 15 | 720 | 150 | 40 | 3,000 | 250 |
| 20 | 1,094 | 200 | 45 | 3,560 | 250 |

**Population Modifiers:**
- Thermal Baths: +10% population
- Plow research: +200 residents
- Aphrodite's Pygmalion: +5 population per farm level (passive)
- City Guard research: militia becomes 15 per farm level (max 600)

### 4.5 Divine Favor Generation

**Formula:**
```
Favor_per_hour = Game_Speed * sqrt(sum_of_temple_levels + num_divine_statues * 5)
```

Where `sum_of_temple_levels` is the total of all temple levels across all cities worshiping that specific god, and `num_divine_statues` counts Divine Statue special buildings in cities worshiping that god.

**Example:** 3 cities worshiping Zeus with temple levels 25, 13, 19 = sqrt(57) = 7.55/hr on speed 1.

**Favor Cap:** 500 (550 with Master of the World award).

**High Priestess advisor:** +50% favor production.

---

## 5. RESEARCH / TECHNOLOGIES

### 5.1 Academy & Research Points

- Each Academy level provides 4 research points
- Maximum Academy level: 36 (= 144 research points)
- Library special building: +12 additional research points (= 156 total)
- Researches are per-city; each city can have different technologies
- Resetting a research costs 1 culture point

### 5.2 Complete Research Tree

Research points spent on a technology cannot be recovered (except by resetting for a culture point).

| Academy Level | Technology | RP Cost | Wood | Stone | Silver | Effect |
|---------------|------------|---------|------|-------|--------|--------|
| **1** | Slinger | 4 | 300 | 500 | 200 | Enables Slinger recruitment |
| **1** | Archer | 8 | 550 | 100 | 400 | Enables Archer recruitment |
| **1** | City Guard | 3 | 400 | 300 | 300 | +5 militia per farm level |
| **4** | Hoplite | 8 | 600 | 200 | 850 | Enables Hoplite recruitment |
| **4** | Diplomacy | 3 | 100 | 400 | 200 | +15% farming village resource gain |
| **4** | Meteorology | 4 | 2,500 | 1,700 | 6,500 | +10% barracks unit speed |
| **7** | Espionage | 3 | 900 | 900 | 1,100 | Spies are 20% stronger automatically |
| **7** | Booty | 3 | 1,200 | 1,200 | 1,200 | 8 farm options instead of 4 |
| **7** | Ceramics | 4 | 700 | 1,500 | 900 | +2,500 warehouse capacity |
| **10** | Horseman | 8 | 1,400 | 700 | 1,800 | Enables Horseman recruitment |
| **10** | Architecture | 6 | 1,900 | 2,100 | 1,300 | -15% building resource costs |
| **10** | Trainer | 4 | 800 | 1,300 | 1,600 | Barracks works 10% faster |
| **13** | Colony Ship | 0 | 7,500 | 7,500 | 9,500 | Enables Colony Ship construction |
| **13** | Bireme | 8 | 2,800 | 1,300 | 2,200 | Enables Bireme construction |
| **13** | Crane | 4 | 3,000 | 1,800 | 1,400 | Senate builds 10% faster |
| **13** | Shipwright | 6 | 5,000 | 2,000 | 3,900 | Harbour works 10% faster |
| **16** | Chariot | 8 | 3,700 | 1,900 | 2,800 | Enables Chariot construction |
| **16** | Light Ship | 8 | 4,400 | 2,000 | 2,400 | Enables Light Ship construction |
| **16** | Conscription | 4 | 3,800 | 4,200 | 6,000 | -10% land unit resource costs |
| **19** | Fire Ship | 8 | 5,300 | 2,600 | 2,700 | Enables Fire Ship construction |
| **19** | Catapult | 8 | 5,500 | 2,900 | 3,600 | Enables Catapult construction |
| **19** | Cryptography | 6 | 2,500 | 3,000 | 5,100 | 10% harder for enemy spies |
| **19** | Democracy | 6 | 3,100 | 3,100 | 4,100 | +10% siege duration (Conquest only) |
| **22** | Fast Transport Ship | 8 | 6,500 | 2,800 | 3,200 | Enables Fast Transport Ship |
| **22** | Plow | 4 | 3,000 | 3,300 | 2,100 | +200 farm residents |
| **22** | Bunks | 6 | 8,900 | 5,200 | 7,800 | Transport +6 units, Fast Transport +6 units |
| **25** | Trireme | 8 | 6,500 | 3,800 | 4,700 | Enables Trireme construction |
| **25** | Phalanx | 9 | 4,000 | 4,000 | 15,000 | +10% troop fighting strength |
| **25** | Breakthrough | 6 | 8,000 | 8,000 | 9,000 | Ships fight at 50% but guarantee transport landing |
| **25** | Mathematics | 6 | 7,100 | 4,400 | 8,600 | -10% ship resource costs |
| **28** | Ram | 10 | 7,900 | 9,200 | 14,000 | +10% ship fighting power |
| **28** | Cartography | 8 | 10,000 | 6,700 | 12,500 | +10% ship speed |
| **28** | Conquest | 0 | 12,000 | 12,000 | 16,000 | Enables city conquest |
| **31** | Stone Hail | 4 | 8,500 | 5,900 | 6,600 | Catapults can destroy building levels (10% chance per catapult) |
| **31** | Temple Looting | 6 | 9,200 | 5,300 | 10,000 | Myth units loot 5 favor per unit (except Hydra) |
| **31** | Divine Selection | 10 | 10,000 | 8,000 | 12,000 | +10% mythical unit stats (offense & defense) |
| **34** | Battle Experience | 6 | 9,800 | 11,400 | 14,200 | +10% battle points from lost units |
| **34** | Strong Wine | 4 | 8,000 | 6,500 | 11,000 | City Festival / Olympic Games reduced to 10h instead of 12h |
| **34** | Set Sail | 8 | 13,000 | 9,700 | 15,500 | Colony Ships are 10% faster |

---

## 6. GODS & DIVINE POWERS

### 6.1 God Overview

8 Gods total. Each has 4 divine powers and 2 mythical units.

### 6.2 Zeus - God of the Sky

**Mythical Units:** Minotaur (Blunt), Manticore (Sharp, Flying)

| Power | Favor | Effect | Target |
|-------|-------|--------|--------|
| Divine Sign | 50 | Adds 1 free Chariot to selected city | Own city |
| Lightning Bolt | 200 | Damages a random building in target city. 4h cooldown (speed 1) | Enemy city |
| Favorable Wind | 250 | Naval forces fight 10% stronger for the attack | Outgoing attack |
| Zeus' Rage | 300 | Destroys 10-30% of enemy land units | Incoming attack |

### 6.3 Poseidon - God of the Sea

**Mythical Units:** Cyclops (Ranged), Hydra (Naval)

| Power | Favor | Effect | Target |
|-------|-------|--------|--------|
| Kingly Gift | 25 | Receive 800 wood | Own city |
| Call of the Ocean | 60 | Harbour construction +100% speed for 12h (speed 1) | Own city |
| Earthquake | 350 | Destroy 1-3 wall levels. 4h cooldown (speed 1) | Enemy city |
| Sea Storm | 280 | Destroys 10-30% of enemy naval units | Incoming attack |

### 6.4 Athena - Goddess of Wisdom

**Mythical Units:** Centaur (Ranged), Pegasus (Sharp, Flying)

| Power | Favor | Effect | Target |
|-------|-------|--------|--------|
| Patroness | 60 | Receive 5 random troops | Own city |
| Wisdom | 140 | Get intelligence report on enemy troops | Incoming attack |
| City Protection | 130 | Block divine powers on city for 12h (speed 1) | Own city |
| Heroic Power | 200 | Attacking land units fight with +10% power | Outgoing attack |

### 6.5 Hera - Goddess of Family

**Mythical Units:** Harpy (Blunt, Flying), Medusa (Sharp)

| Power | Favor | Effect | Target |
|-------|-------|--------|--------|
| Wedding | 30 | Receive 200 wood, 200 stone, 200 silver | Own city |
| Happiness | 120 | +50% wood/stone/silver production for 12h (speed 1) | Own city |
| Population Growth | 80 | Barracks trains 2x faster for 12h (speed 1) | Own city |
| Desire | 140 | Enemy naval and land units fight with -10% power | Incoming attack |

### 6.6 Hades - God of the Underworld

**Mythical Units:** Cerberus (Blunt), Erinys (Ranged)

| Power | Favor | Effect | Target |
|-------|-------|--------|--------|
| Plague | 250 | -50% resource production for 6h (speed 1). 4h cooldown | Enemy city |
| Return from the Underworld | 400 | 10% of killed units return to native city | Outgoing attack |
| Treasures of the Underworld | 30 | Receive 500 silver coins | Own city |
| Helmet of Invisibility | 120 | Troops invisible for 10% of journey | Outgoing attack |

### 6.7 Artemis - Goddess of the Hunt

**Mythical Units:** Griffin (Blunt), Calydonian Boar (Sharp)

| Power | Favor | Effect | Target |
|-------|-------|--------|--------|
| Nature's Gift | 30 | Receive 650 stone | Own city |
| Aim of the Huntress | 100 | Distance troops +15% stronger | Outgoing attack |
| Illusion | 260 | Fake attack on enemy city (travels at lightship speed) | Enemy city |
| Purification | 200 | Removes all active spells (except City Protection) | Own city/attack |

### 6.8 Aphrodite - Goddess of Love

**Mythical Units:** Satyr (Sharp), Siren (Naval, passive speed boost)

| Power | Favor | Effect | Target |
|-------|-------|--------|--------|
| Narcissism | 350 | Defending units -10% efficiency for 12h | Enemy city |
| Charitable Festival | 130 | -2% Victory Procession cost per active power (cap 20%) | Own city |
| Hymn to Aphrodite | 140 | +20% farm collection (+1.5% per active power, cap 50%) + 10% farm trade for 2h | Own city |
| Pygmalion | 0 (passive) | +5 population per farm level, permanently active | All cities worshiping Aphrodite |

### 6.9 Ares - God of War

**Mythical Units:** Ladon (Ranged, scaling), Spartoi (Blunt, from Fury)

**Unique Mechanic: Fury** - Ares uses a unique resource called Fury, accumulated by sacrificing units.

| Power | Favor + Fury | Effect | Target |
|-------|-------------|--------|--------|
| Ares Sacrifice | 100 favor | Sacrifice up to 50 pop of non-mythical units, gain 2 Fury per pop | Own city |
| Ares Army | 380 favor + 100% Fury | Consume all Fury; add 1 Spartoi per 25 Fury (rounded down) | Outgoing attack |
| Bloodlust | 100 favor + 50% Fury | +5% attack + 1% per 200 Fury. +1% BP per 1000 Fury | Outgoing attack |
| Spartan Training | 80 favor + 10% Fury | Barracks +70% speed + 1% per 100 Fury for 6h | Own city |

---

## 7. WORLD MAP

### 7.1 Ocean Grid System

- World is divided into numbered **oceans** in a grid (00-99)
- Ocean numbers: first digit = Y axis, second digit = X axis
- Ocean 44 = center of the world; Ocean 55 = one step SE from center
- Each ocean contains many islands

### 7.2 Island Structure

**Large Islands:**
- Have 8 farming villages each
- Multiple city slots (typically 8-16 player cities per island)
- Each island has a resource bonus: one resource type +10%, another -10% (visible via icon)
- The +/-10% only applies to production levels 20+
- Islands are where World Wonders can be built (alliance must own all cities on island)

**Small Islands (Colony Islands):**
- No farming villages
- Typically 1-2 city slots
- Used primarily for colonizing
- Harder to develop (no farm village income)

### 7.3 Farming Villages

- 8 per large island, shared among all players on the island
- Mean distance to all villages is equal for all players (27.30 minutes)
- Villages have 6 upgradeable levels
- Players start with 1 conquered village; must defeat resistance to conquer more

**Village Conquest Resistance:**

| Village # | Defense | Farm Space Required |
|-----------|---------|-------------------|
| 1st | Free at start | 0 |
| 2nd | 1 Slinger | 6 |
| 3rd | 3 Archers | 10 |
| 4th | 60 Slingers | 40 |
| 5th | 60 Swordsmen | 100 |
| 6th | 100 Archers | 300 |
| 7th | 300 Slingers + 80 Hoplites + 80 Horsemen | 600 |
| 8th | 150 Swords + 150 Archers + 75 Hoplites + Lvl 20 Wall | 1,000 |

**Farm Village Production (Demand Resources per interval):**

| FV Level | 5 min | 20 min | 120 min | 300 min |
|----------|-------|--------|---------|---------|
| 1 | 10 | 20 | 60 | 80 |
| 2 | 12 | 24 | 72 | 96 |
| 3 | 14 | 28 | 84 | 112 |
| 4 | 16 | 32 | 96 | 128 |
| 5 | 18 | 36 | 108 | 144 |
| 6 | 20 | 40 | 120 | 160 |

With Booty research: 4 additional time intervals available (10, 40, 240, 480/600 min).

**Looting** gives 2x the demand amount but reduces village mood.

**Daily Farm Maximum per Village Level:** L1=6250, L2=7500, L3=8750, L4=10000, L5=11250, L6=12500.

### 7.4 Ghost Towns

- Created when players leave a world (15+ days inactive, account deletion, restart)
- Maintain all buildings/troops/researches at time of ghosting
- Buildings decay: lose 1 random building level per day
- Troops slowly decrease over time (rubble kills)
- Can be attacked and conquered like normal cities
- On Revolt worlds: no need to start a revolt, just send CS directly
- On Conquest worlds: still need Conquest research
- Supporting a ghost town is risky (troops can die from building collapse)

---

## 8. ALLIANCES

### 8.1 Alliance Features

- **Creation:** Any player can create an alliance
- **Member Cap:** 220 members (may vary by world settings)
- **Hierarchy:** Founder, Leader(s), Members
- **Forums:** Internal alliance forum system
- **Profiles:** Public alliance profile/description
- **Pacts:** NAP (Non-Aggression Pact) and Alliance Pact agreements with other alliances
- **Reservation Tool:** Mark cities as reserved for specific members to conquer
- **Mass Messages:** Leaders can message all members
- **Alliance Battle Points:** Attacking/defending alliance member units generates battle points

### 8.2 Endgame: Domination

**Activation:**

| World Speed | Domination Era Start (days from world start) |
|-------------|----------------------------------------------|
| | Slow / Regular / Fast |
| 1x | 300 / 240 / 180 |
| 2x | 225 / 180 / 135 |
| 3x | 187.5 / 150 / 112.5 |
| 4x | 150 / 120 / 90 |

**Objective:** Alliance must hold 40% of cities on valid islands.

**Valid Islands:** System sweeps outward from center, marking islands with substantial player presence. Only large islands with farming villages count.

**Requirement Reduction:** If no alliance reaches 40% after a period equal to the pre-domination time, the objective decreases:
```
New_Objective = Current_Objective - (Current_Objective - Top_Alliance_Percentage) / 2
Repeats every 14 days until difference <= 2%
```

**Last Stand:** When an alliance reaches the objective:
- 14 days to activate Last Stand (auto-activates after 14 days)
- Must hold above objective for duration:
  - Speed 1: 28 days
  - Speed 2: 21 days
  - Speed 3: 17.5 days
  - Speed 4: 14 days
- If domination drops below objective: Last Stand instantly deactivated
- During Last Stand: all cities on valid islands are attackable even in vacation mode

**World End:** Winner declared, 14-day peace time, world closes.

### 8.3 Endgame: World Wonders

**Prerequisites:**
- World exists for at least 6 months (30 days each)
- Top 50 alliances' total points >= 250 million
- If not met by month 10, target begins decreasing

**7 World Wonders:**

| Wonder | Bonus |
|--------|-------|
| Great Pyramid of Giza | +1,500 warehouse capacity |
| Hanging Gardens of Babylon | +3% resource production |
| Statue of Zeus at Olympia | +5% favor production with Zeus |
| Temple of Artemis at Ephesus | +5% favor production with all gods |
| Mausoleum of Halicarnassus | Mythical units cost 5% less resources |
| Colossus of Rhodes | -10% victory procession duration |
| Lighthouse at Alexandria | -5% Phoenician trader costs |

**Construction Costs (Speed 1):**

| Level | Cost (each resource) | Build Time |
|-------|---------------------|------------|
| 1 | 200,000 | 1h 57m |
| 2 | 400,000 | 3h 57m |
| 3 | 600,000 | 7h 37m |
| 4 | 1,000,000 | 13h 07m |
| 5 | 1,600,000 | 20h 33m |
| 6 | 2,800,000 | 30h 00m |
| 7 | 4,800,000 | 41h 34m |
| 8 | 8,200,000 | 55h 17m |
| 9 | 14,000,000 | 71h 13m |
| 10 | 23,800,000 | 89h 26m |

For other speeds: multiply resource costs by world speed.

**Rules:**
- Alliance must own ALL cities on an island to build a WW there
- Losing a city on the island = current level lost (drops to previous)
- Alliance disbanding = total WW demolition
- Can accelerate construction with 400 favor from each god
- Players must be in alliance 72h+ to contribute
- Only 1 of each WW type can reach level 10 worldwide

**Victory:** First alliance to complete 4 of 7 World Wonders wins.

---

## 9. WORLD SETTINGS

### 9.1 Configurable Parameters

| Setting | Options | Effect |
|---------|---------|--------|
| World Speed | 1x, 2x, 3x, 4x, 5x | Multiplies all production, reduces all build/train times |
| Unit Speed | 1x, 2x, 3x, 4x, 5x | Multiplies troop movement speed |
| Conquering System | Revolt / Conquest | Determines how cities are taken over |
| Night Bonus | On / Off | Doubles defense during night hours |
| Morale | On / Off | Protects smaller players from larger attackers |
| Beginner Protection | 2-7 days | New players cannot be attacked |
| Alliance Limit | Varies | Max members per alliance |
| Endgame | Domination / World Wonders | How the world is won |

### 9.2 Speed Scaling Rules

For world speed N:
- All resource production rates: multiply by N
- All build/train times: divide by N
- All spell durations: divide by N
- Unit travel speed: multiply by Unit Speed setting (separate from world speed)
- Colony Ship 24h founding time: NOT affected by world speed
- Culture event durations: divide by N

### 9.3 Beginner Protection

- Duration varies by world (typically 5-7 days)
- During protection: cannot be attacked
- CAN attack other players during protection
- Protection can be manually ended early
- Once ended, cannot be re-enabled

---

## 10. CONQUEST / REVOLT SYSTEM

### 10.1 Colonizing (Founding a New City)

**Requirements:**
- Academy level 13
- Harbour level 10
- Colony Ship researched and built (10k each resource, 170 pop)
- Sufficient culture points

**Process:**
1. Send Colony Ship to an anchor point (empty island slot)
2. Max travel time: 48 hours
3. Takes 24 hours to establish (NOT affected by world speed)
4. Colony Ship is consumed
5. During 24h build: if origin city is lost, colony is lost too

**New City Starting Buildings:**
- Timber Camp 15, Quarry 15, Silver Mine 12
- Senate 10, Farm 10, Warehouse 10
- Temple 1, Market Place 2, Barracks 4, Agora 1
- Starting points: 997

### 10.2 Revolt System (Revolt Worlds)

**Prerequisites:**
- Conquest researched (Academy 28)
- Colony Ship built
- At least 1 land unit, 1 transport boat, 1 warship
- Sufficient culture points

**Process:**
1. **Revolt Attack:** Send attack with "Revolt" option selected
2. Must defeat ALL land units in the target city
3. **Phase 1 - Rumor Phase:** 12 hours (speed 1) - agents spread lies
4. **Phase 2 - Revolt Phase:** 12 hours - city is in revolt; send CS during this window
5. If CS lands successfully during revolt phase, city is conquered
6. Colony Ship is consumed upon successful conquest

**Ghost Town Conquest (Revolt):** No revolt needed. Just send CS with military escort. No Conquest research needed either.

### 10.3 Conquest System (Conquest/Siege Worlds)

**Prerequisites:**
- Conquest researched (Academy 28)
- Colony Ship built
- Sufficient troops for land AND naval victory
- Sufficient culture points

**Process:**
1. **Attack:** Send CS with full military escort
2. Must win BOTH naval battle AND land battle
3. CS must survive the battle
4. **Siege Begins:** Duration depends on world speed (typically 12-24h base)
5. During siege:
   - Defender cannot control the city
   - Enemy attacks work to LIFT the siege
   - Friendly supports work to MAINTAIN the siege
   - Democracy research extends siege by 10%
6. If CS + troops survive the entire siege: city changes hands
7. All buildings and researches remain intact (unless catapulted/spelled)

**Ghost Town Conquest (Conquest):** Still need Conquest research. Standard siege applies but usually no resistance.

### 10.4 Culture Points System

Culture is required to own additional cities.

**Formula for total CP needed to reach level N:**
```
CP = (3/2) * (N^2 - 3N + 2)
```

**CP needed for each additional level:**
```
CP_for_level_N = 3 * (N - 2)
```

| Culture Level | Total CP | Additional CP | Cities Allowed |
|---------------|----------|---------------|----------------|
| 1 | 0 | 0 | 1 |
| 2 | 0 | 0 | 2 |
| 3 | 3 | 3 | 3 |
| 4 | 9 | 6 | 4 |
| 5 | 18 | 9 | 5 |
| 6 | 30 | 12 | 6 |
| 7 | 45 | 15 | 7 |
| 8 | 63 | 18 | 8 |
| 9 | 84 | 21 | 9 |
| 10 | 108 | 24 | 10 |

**Ways to Earn Culture Points (1 CP each):**
- **Victory Procession:** Costs 300 battle points. Duration: 8h (speed 1). No resource cost.
- **City Festival:** Costs 15k wood, 18k stone, 15k silver. Academy 30 required. Duration: 24h (speed 1).
- **Olympic Games:** Costs 50 gold. Academy 30 required. Duration: 24h (speed 1).
- **Theatre Play:** Costs 10k wood, 12k stone, 10k silver. Requires Theatre building. Duration: 5 days (speed 1).

---

## 11. EVENTS & SPECIAL MECHANICS

### 11.1 Hero System

Heroes are special units with unique abilities, recruited using Coins of War/Wisdom.

**Key Mechanics:**
- Recruited with Coins of War or Coins of Wisdom (earned from Island Quests, ~24 coins/day max)
- Level up to 20 using coins (improves stats and special ability)
- Cannot die - only become "wounded" (healing: 18h / world speed)
- DO NOT consume population
- Max 1 hero per city
- Cannot be sent as support to other players
- After attacking, hero returns instantly (no travel time)
- Hero slots: 1 initially, +1 per culture level, can buy more with 250 gold
- Assigning a hero to a city takes up to 6h / world speed

**Hero Types:**
- Heroes of War: military bonuses (attack, defense, combat-related)
- Heroes of Wisdom: economic bonuses (resources, build speed, etc.)

### 11.2 Premium Advisors

5 advisors, each costing gold to activate:

| Advisor | Key Effects |
|---------|-------------|
| **Administrator** | +5 building queue slots; detailed overviews (trade, command, recruitment, troop, building, culture); Quick Bar access |
| **Merchant** | +30% base resource production |
| **High Priestess** | +50% favor production; mythical units fight 20% stronger |
| **Commander** | Land units fight 20% stronger; attack planner access |
| **Captain** | Naval units fight 20% stronger; farming overview; advanced features |

**For a gold-free private server:** The key bonuses to disable/remove:
- Merchant: 30% resource bonus
- High Priestess: 50% favor + 20% myth bonus
- Commander: 20% land bonus
- Captain: 20% naval bonus
- Administrator: 5 build queue slots
- Instant Buy (halve timers with gold)
- Olympic Games (gold-based culture)
- Phoenician Trader (summon with gold)
- Vacation Days (some cost gold)

### 11.3 Island Quests

- Appear periodically on the world map
- Provide choices that award Coins of War or Coins of Wisdom
- Some give resource rewards, speed bonuses, etc.
- Spawn rate scales inversely with player points (high-point players get fewer but more valuable quests)
- Max ~24 coins/day from all quests

### 11.4 Battle Points

- Earned by killing enemy units (attacking or defending)
- Used for Victory Processions (300 BP = 1 culture point)
- Separate offensive BP and defensive BP tracked
- Alliance battle points: 20% of individual member BP

### 11.5 Gold Trading

- Market Place level 5 required
- Can trade resources for gold and vice versa
- Max 200 gold per trade
- Available on worlds launched after February 2015

---

## 12. UI/UX REFERENCE

### 12.1 Main Game Views

1. **City View:** Interior of your city showing all buildings as visual structures. Click buildings to interact.
2. **Island View:** Shows your island with all cities, farming villages, and nearby small islands.
3. **Ocean View:** Shows the ocean grid with multiple islands.
4. **World Map:** Full world overview with oceans numbered.

### 12.2 Key Interfaces

**Senate Interface:**
- Build queue (1 slot base, +5 with Administrator)
- Building list with costs, requirements, current level
- Demolish buildings (requires Senate level 10)
- Resources shown in black = affordable, red = insufficient

**Barracks Interface:**
- Shows all available units with current counts
- Click unit to see stats, costs, training time
- Training queue with time remaining

**Harbour Interface:**
- Same layout as Barracks but for naval units
- Colony Ship construction

**Academy Interface:**
- Shows research tree
- Available research points displayed
- Green checkmark = already researched
- Color image = can research now

**Agora Interface:**
- **Defense tab:** All troops in city (own + support)
- **Outside tab:** Troops stationed in other cities
- **Simulator:** Input attacker/defender compositions to predict battle outcomes
- **Culture tab:** City Festival, Olympic Games, Victory Procession, Theatre Play

**Temple Interface:**
- Current god being worshiped
- Favor count and generation rate
- Divine powers available
- Mythical units available
- Option to switch gods

**Cave Interface:**
- Silver deposit/storage
- Recent espionage reports
- Spy missions

**Market Place Interface:**
- Send resources to other cities/players
- Trade with farming villages
- Gold trading (if available)

### 12.3 Military Interface

**Attack Screen:**
- Select target city on map
- Choose units to send
- Attack type options: Normal Attack / Revolt Attack (revolt worlds)
- Shows travel time
- Command cancellation available within first 10 minutes

**Support Screen:**
- Same as attack but sends troops as defense
- Support can be recalled from Outside tab

**Attack Planner (Captain advisor):**
- Schedule attacks with precise timing
- Coordinate multiple attack waves

### 12.4 Reports System

- **Battle Reports:** Detailed attack/defense results showing units sent, units lost, resources looted, luck value, morale
- **Espionage Reports:** Building levels, troop counts, resources if successful
- **Trade Reports:** Resource transactions
- **Building/Research Reports:** Construction/research completion notifications
- **Conquest Reports:** Revolt/siege status updates
- **Report sharing:** Can publish reports with a code for alliance forums

### 12.5 Points System

Every building constructed/upgraded gives city points. No points for researches or units.

**Starting city:** 175 points (Agora 33 + Senate 110 + Farm 17 + Warehouse 15)

**All special buildings:** 500 points each.

**Max city points:** 17,786 (all buildings at maximum level).

---

## APPENDIX A: KEY FORMULAS SUMMARY

```
# Wall Defense
total_defense = base_unit_defense * (1 + wall_bonus + tower_bonus)

# Favor Generation
favor_per_hour = world_speed * sqrt(sum_temple_levels + divine_statues * 5)

# Morale
morale = min(100, (defender_points / attacker_points * 3 + 0.3) * 100)

# Culture Points for Level N
total_cp = 1.5 * (N^2 - 3*N + 2)
cp_for_next_level = 3 * (N - 2)

# Luck
effective_attack = base_attack * (1 + luck/100)  # luck in [-30, +30]

# Resource Production (approximate)
production_per_hour = base_production(level) * world_speed * island_modifier * advisor_modifier

# Build Time
actual_time = base_time(level) / world_speed / senate_modifier * (architecture ? 0.85 : 1) * (crane ? 0.9 : 1)

# Night Bonus (when active)
effective_defense = base_defense * 2

# Farm Population
max_pop = farm_capacity(level) + plow_bonus(200) + thermal_baths(10%) + pygmalion(5 * farm_level)
```

## APPENDIX B: OPEN SOURCE TOOLS & RESOURCES

No complete Grepolis private server implementation has been found as open source.

### Grepolis Ecosystem (for reverse engineering)

| Repository | Stars | Purpose |
|-----------|-------|---------|
| CostMillion/GrepoPlus | 31 | Full-featured bot (2026), attack detection, auto-dodge, auto-build |
| Sau1707/ModernBot | 30 | Bot with farming, building, training - clean JS code |
| BrandonWill/GrepolisBot | - | Java bot with full game data parsing, JSON API calls |
| RIAEvangelist/PHP-Grepolis-JSON-API | 4 | PHP wrapper for public data API |
| GrepoDataTools | 9 | PHP+Angular statistics platform backend |
| grcrt/grcrt-script | - | Major userscript with game UI integration |
| Mikel-UA/Grepolis_Farming_Bot | - | Python/Selenium bot |
| Cryptobyte/Grepo | - | Grepolis Data Framework in NodeJS |
| xDroni/Grepolis-Utilities | - | Utility scripts integrated with GrepoData |

### Reference Server Implementations (Same Genre)

| Repository | Stars | Tech | Relevance |
|-----------|-------|------|-----------|
| Shadowss/TravianZ | 280 | PHP/MariaDB | Best private server reference (Travian) |
| jurerotar/Pillage-First-Ask-Questions-Later | 131 | TypeScript/React | Best modern frontend reference |
| laserswald/Tribal-Wars-Open-Source | 38 | PHP | Same developer (InnoGames) ecosystem |
| ice41/Tribalwars | 4 | PHP/MySQL | Includes SQL schema |
| fernando-marquardt/artemis | - | PHP/MySQL | Browser strategy with map generation |

### Free Ancient Greek Assets

| Source | License | Content |
|--------|---------|---------|
| OpenGameArt.org - LPC Ancient Greek Architecture | CC BY-SA / GPL | Temple, ruins tiles |
| OpenGameArt.org - Greek Hypaspist sprites | CC0 | Unit sprites |
| itch.io - Greek tagged assets | Various | 30+ asset packs |
| 0 A.D. (play0ad.com) | GPL | Full ancient warfare 3D assets |

---

## APPENDIX C: GAME PROTOCOL & API

### Official Technology Stack (from InnoGames job listings)

- **Backend**: PHP with OOP
- **Database**: PostgreSQL
- **Frontend**: Vanilla JavaScript + CSS + HTML (custom engine)
- **CDN**: `gpit.innogamescdn.com` for game assets

### Communication Protocol

**Primary**: HTTP POST over HTTPS to central endpoint:
```
POST https://{server}.grepolis.com/game/frontend_bridge
```

**Authentication**:
- Session cookies (obtained at login)
- CSRF token (embedded in page, sent with each request as `h` parameter)

**Request format**: Query params + JSON body
```
POST /game/frontend_bridge?town_id={id}&action=execute&h={csrf}
```

**Response format**: JSON with structure:
```json
{
  "json": {
    "towns": [...],
    "notifications": [...],
    "redirect": null
  }
}
```

### Public Data API (no auth required)

Pattern: `https://{world}.grepolis.com/data/{file}`

| File | Columns |
|------|---------|
| players.txt.gz | id, name, alliance_id, points, rank, towns |
| alliances.txt.gz | id, name, points, village_members, rank |
| towns.txt.gz | id, player_id, name, island_x, island_y, number_on_island, points |
| islands.txt.gz | id, x, y, island_type, available_towns |
| conquers.txt.gz | town_id, time, new_player_id, old_player_id, new_ally_id, old_ally_id, town_points |
| player_kills_all.txt.gz | rank, player_id, points |
| player_kills_att.txt.gz | rank, player_id, points |
| player_kills_def.txt.gz | rank, player_id, points |
| alliance_kills_all.txt.gz | rank, alliance_id, points |

Rate limit: max 1 request per hour per file. Encoding: CSV with commas, commas in data encoded as `%`.

### Known Game API Endpoints (80+ captured)

**Construction:**
- `BuildingOrder/{townId}` → `buildUp` (build)
- `BuildingOrder/{townId}` → `tearDown` (demolish)
- `BuildingOrder/{orderId}` → `buyInstant` (finish <5min free)

**Military:**
- `town_info/send_units` (XHR — attack/support)
- `Commands` → `cancelCommand` (recall)
- `CastedPowers` → `cast` (divine powers)

**Economy:**
- `town_info/trade` (send resources)
- `town_overviews/store_iron` (cave storage)
- `farm_town_overviews/claim_loads_multiple` (farm collection)
- `FarmTownPlayerRelation` → `upgrade` (improve villages)

**Recruitment:**
- `UnitOrder/{townId}` → `buildUp` (units)
- `building_barracks/build` (barracks units)
- `building_docks/build` (ships)

**Research & Culture:**
- `ResearchOrder` → `research` (academy queue)
- `town_overviews/start_all_celebrations` (all festivals)
- `building_place/start_celebration` (single town)

**Heroes & Gods:**
- `PlayerHero` → `assignToTown`
- `god_selection/change_god`

**Client-Side JavaScript Objects (accessible via unsafeWindow):**
- `MM.getOnlyCollectionByName('Town').models` — Town collection
- `ITowns.getCurrentTown()` — Current town
- `GameData` — Game constants (unit stats, building costs, etc.)
- `GameDataPremium` — Premium features status
- `gpAjax` — HTTP client for game API

---

## APPENDIX D: EXISTING GREPOLIS-AI PROJECT DATA

### Already Captured Game Data (in grepolis-AI/research/)

The grepolis-AI project has already extracted comprehensive game data via network interception:

| File | Contents |
|------|----------|
| gamedata-units.json | All 15 unit types with full stats |
| gamedata-buildings.json | All 22 buildings with costs per level |
| gamedata-researches.json | Full research tree with requirements |
| gamedata-gods.json | 8 gods with divine powers |
| gamedata-powers.json | 185+ divine spells with effects |
| gamedata-heroes-full.json | 38+ heroes with stats by level |
| gamedata-celebrations.json | Festival types with costs/durations |
| frontend-bridge-api.json | 80 API endpoint definitions |
| api-bible.json | Verified API call formats |
| all-towns-full.json | 41 towns with complete state |
| town-group-mapping.json | Group assignments for 9 groups |

### Building Templates Already Defined

5 pre-built templates in `grepolis-AI/templates/city-templates.json`:

| Template | Focus | Key Buildings |
|----------|-------|---------------|
| NC_FACTORY | Colony Ship production | Farm 45, Docks 30, Academy 34 |
| OLU | Offensive Land (cavalry/chariot) | Barracks 30, Farm 45, Harbor 20 |
| DLU | Defensive Land (biremes) | Docks 20, Harbor 20, Barracks 25, Tower 10 |
| BIREME | Naval Defense | Docks 30, Harbor 20, Lighthouse 15 |
| LS_CITY | Light Ship Offensive | Docks 30, Harbor 20 |

### Unit Requirements (from ModernBot codebase)

```javascript
REQUIREMENTS = {
    sword: {},
    archer: { research: 'archer' },
    hoplite: { research: 'hoplite' },
    slinger: { research: 'slinger' },
    catapult: { research: 'catapult' },
    rider: { research: 'rider', building: 'barracks', level: 10 },
    chariot: { research: 'chariot', building: 'barracks', level: 15 },
    big_transporter: { building: 'docks', level: 1 },
    small_transporter: { research: 'small_transporter', building: 'docks', level: 1 },
    bireme: { research: 'bireme', building: 'docks', level: 1 },
    attack_ship: { research: 'attack_ship', building: 'docks', level: 1 },
    trireme: { research: 'trireme', building: 'docks', level: 1 },
    colonize_ship: { research: 'colonize_ship', building: 'docks', level: 10 },
};
```

---

## APPENDIX D2: REAL GAMEDATA EXTRACTED (from browser console)

### Internal Naming Convention

| Wiki Name | Internal ID | Attack Type |
|-----------|------------|-------------|
| Blunt | `hack` | `attack_type: "hack"` |
| Sharp | `pierce` | `attack_type: "pierce"` |
| Ranged | `distance` | `attack_type: "distance"` |

Defense keys: `def_hack`, `def_pierce`, `def_distance`

### Unit Data (Real GameData.units — speed & build_time in internal units)

| Unit | ID | Speed (internal) | Attack | def_hack | def_pierce | def_distance | Pop | Build Time (s) | attack_type | Wood | Stone | Silver |
|------|-----|-------------------|--------|----------|------------|--------------|-----|----------------|-------------|------|-------|--------|
| Militia | militia | 0 | 0 | 6 | 8 | 4 | 0 | 2 | pierce | 0 | 0 | 0 |
| Swordsman | sword | 24 | 5 | 14 | 8 | 30 | 1 | 360 | hack | 95 | 0 | 85 |
| Slinger | slinger | 42 | 23 | 7 | 8 | 2 | 1 | 400 | distance | 55 | 100 | 40 |

**Note**: Speed values are in internal units (higher = faster). Wiki speed uses a different scale. Build times are in seconds at base level. Actual times depend on Barracks/Harbour level and world speed.

### Speed Conversion (internal → wiki)

Comparison: Sword internal=24, wiki=6. Slinger internal=42, wiki=14. Ratio = internal/4 = wiki speed approximately. To convert: `wiki_speed = internal_speed / 4` (fields per some unit).

### GameData Keys Available

Complete list of extractable data from GameData object:
```
units, powers, map_size, buildings, godPowersTown, godPowersCommand,
inventoryItems, heroes, progressable, campaignUnits, campaignStages,
campaignMeta, building, island_quests, heroes_meta, crafting_meta,
inventory, research_bonus, min_main_level_for_tear_down,
colonization_requirements, resources, resource_names, researches,
farm_town_time_values, farm_town, unit_order_refund_factor,
celebration_cost, additional_runtime_modifier, godPowersForOtherTowns,
cancel_times, events, default_flag_colors, gods, artifacts, texts,
currencies, world_masters_winner, Sounds
```

### Key Data Still To Extract

To get complete game data for the private server, dump these from the browser console:
```javascript
copy(JSON.stringify(GameData.buildings));    // All building costs/levels
copy(JSON.stringify(GameData.units));        // All unit stats (DONE - partial)
copy(JSON.stringify(GameData.researches));   // All research data
copy(JSON.stringify(GameData.powers));       // All divine powers
copy(JSON.stringify(GameData.gods));         // God definitions
copy(JSON.stringify(GameData.heroes));       // Hero data
copy(JSON.stringify(GameData.farm_town));    // Farm village mechanics
copy(JSON.stringify(GameData.farm_town_time_values)); // Farm timing
copy(JSON.stringify(GameData.celebration_cost));       // Festival costs
copy(JSON.stringify(GameData.colonization_requirements)); // Colony reqs
copy(JSON.stringify(GameData.map_size));     // World dimensions
```

### Combat Simulator Finding

`FightSimulator.simulate()` serializes the form and calls `executePost("simulate", {simulator: data})` — the combat calculation is **server-side only**. The client never computes battle outcomes. This means:
- The exact formula is proprietary and not extractable from JS
- We must implement our own based on community research
- The ratio-based system with hack/pierce/distance is confirmed by the data structure

---

## APPENDIX E: PRIVATE SERVER DESIGN DECISIONS

### Gold-Free World Adaptations

Features to **remove** (premium/gold-dependent):
- Instant Buy (finish timer with gold)
- Olympic Games culture event (costs gold)
- Phoenician Trader (summon merchant with gold)
- Gold trading at marketplace
- Extra hero slots (250 gold each)
- Vacation mode extensions (some cost gold)

Features to **decide** (advisor bonuses — currently premium):
- Administrator: +5 build queue → give to all? reduce to +2?
- Merchant: +30% resources → remove entirely? give to all at reduced %?
- High Priestess: +50% favor, +20% myth → remove? reduce?
- Commander: +20% land attack → remove? give to all?
- Captain: +20% naval attack → remove? give to all?

**Recommendation**: Give all players a subset of advisor bonuses for free (e.g., +1 build queue, +10% resources) to maintain game pace without pay-to-win.

### Recommended Tech Stack

Based on research findings:

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | React + TypeScript + Vite | Already used in grepolis-AI dashboard, modern, fast |
| Backend | Node.js + TypeScript + Fastify | Performance, WebSocket support, shared types with frontend |
| Database | PostgreSQL | Matches original game, complex relational data |
| Cache/Timers | Redis | Build queues, recruit timers, session management |
| Real-time | WebSocket (Socket.io or ws) | Attack notifications, live updates |
| Auth | JWT + bcrypt | Simple for private server |
| Hosting | VPS (Hetzner/OVH) | Already used for grepolis-AI infrastructure |

### Development Phases (Recommended)

| Phase | Systems | Estimated Complexity |
|-------|---------|---------------------|
| 1 | Auth, city creation, buildings, resources, warehouse | Foundation |
| 2 | Units, barracks/harbor recruitment, population | Military base |
| 3 | Map (islands, oceans), city view, island view | World |
| 4 | Combat system (land + naval), reports | Core gameplay |
| 5 | Research tree, academy | Progression |
| 6 | Gods, divine powers, mythical units, temple | Divine |
| 7 | Farming villages (conquest, looting, upgrading) | Economy |
| 8 | Alliances (creation, members, forums, pacts) | Social |
| 9 | Conquest/Revolt system, colony ships, culture | Expansion |
| 10 | Endgame (Domination or World Wonders) | Victory |
| 11 | Heroes, island quests | Polish |
| 12 | UI polish, notifications, attack planner | UX |

---

## APPENDIX F: MISSING INFORMATION & RESOLUTION

| # | Data Point | Status | Resolution |
|---|-----------|--------|------------|
| 1 | **Exact combat formula** | SERVER-SIDE | FightSimulator.simulate() calls executePost("simulate") — formula runs on server, NOT client JS. Use community ratio-based approximations. Attack types confirmed: hack (blunt), pierce (sharp), distance (ranged). Defense keys: def_hack, def_pierce, def_distance. |
| 2 | **Building cost formula** | RESOLVED | Per-level data in gamedata-buildings.json (extracted from GameData). Exponential curve can be fitted from data. |
| 3 | **Recruitment time formula** | RESOLVED | Same reduction formula as Harbour (confirmed by user). Coefficients in gamedata-buildings.json. |
| 4 | **Island generation algorithm** | CUSTOM | No official algo available. Implement custom: random placement with density gradient from center outward, 8 farming villages per large island, resource bonus assignment random +/-10%. |
| 5 | **Ghost town decay rates** | LOW PRIORITY | ~1 building level/day, troop decay gradual. Fine-tune during testing. |
| 6 | **Hero coin drop rates** | LOW PRIORITY | ~24 coins/day max from quests. Approximate with uniform distribution. |
| 7 | **Farming village mood** | LOW PRIORITY | Mood recovery ~linear, loot at >80% mood. Fine-tune during testing. |
| 8 | **Battle point calculation** | WIKI DATA | BP = sum of resource cost of killed units / some_divisor. Approximate from wiki. |
| 9 | **Market trade rates** | GAMEDATA | Likely in gamedata-buildings.json marketplace section. |
| 10 | **Anti-timer distribution** | DESIGN CHOICE | Use uniform +/-10s for simplicity. |

---

Sources:
- [Buildings Portal - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Buildings_Portal)
- [Senate - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Senate)
- [City Wall - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/City_Wall)
- [Land Units - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Land_Units)
- [Naval Units - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Naval_Units)
- [Unit Guide - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Unit_Guide)
- [The Battle System - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/The_Battle_System)
- [Divine Powers - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Divine_Powers)
- [Gods Portal - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Gods_Portal)
- [Research Portal - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Research_Portal)
- [Farm - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Farm)
- [Warehouse - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Warehouse)
- [Timber Camp - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Timber_Camp)
- [Temple - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Temple)
- [Morale - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Morale)
- [Espionage - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Espionage)
- [Culture - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Culture)
- [Revolt - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Revolt)
- [Conquest - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Conquest)
- [Colonizing - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Colonizing)
- [Domination - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Domination)
- [World Wonders - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/World_Wonders)
- [Farming - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Farming)
- [Ghost Towns - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Ghost_Towns)
- [Premium - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Premium)
- [Heroes - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Heroes)
- [Points Table - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Points_Table)
- [Farming Villages Guide - Wiki Grepolis EN](https://wiki.en.grepolis.com/wiki/Farming_Villages_Guide)
- [GROM's Research Guide](http://grepolis-pro.blogspot.com/2011/01/research.html)
- [GROM's Attacking Guide](http://grepolis-pro.blogspot.com/2010/11/attacking-anatomy.html)
- [Domination DevBlog](https://devblog.grepolis.com/2018/02/14/new-endgame-domination-updated/)
- [Morale DevBlog](https://devblog.grepolis.com/2017/09/19/morale-system-first-stage/)
- [Grepolis GitHub Topic](https://github.com/topics/grepolis)
