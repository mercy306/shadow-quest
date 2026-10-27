# Shadow Quest ⚔️

A realistic 3D third-person open-world action-adventure RPG built with **Three.js** and **Vite**. Cleanse corrupted ancient realms, defeat hostile void guardians and colossi, master stealth takedowns and weapon skills, ride across vast wilderness regions, capture breathtaking views with Photo Studio, and team up with a companion in authoritative 2-player online co-op.

---

## 🎮 Controls Reference

| Action | Primary Control | Secondary Control | Description |
|---|---|---|---|
| **Locomotion** | `W` `A` `S` `D` | Arrow Keys | Camera-relative movement (walking / running) |
| **Sprint Boost** | `Shift` (Hold) | `Double-tap W` | High-speed sprint ($10.5\text{ m/s}$) with camera speed punch |
| **Crouch / Sneak** | `C` | `Ctrl` | Silent sneak mode ($2.2\text{ m/s}$) with reduced noise & profile |
| **Toggle Walk / Run** | `Caps Lock` | — | Switch between deliberate Walk ($4.0\text{ m/s}$) and Run |
| **Jump** | `Space` | — | Jump with realistic gravity curve and landing detection |
| **Attack / Takedown** | `Left Click` | `F` | Melee sword combo or instant Stealth Takedown from behind |
| **Heavy Spin Slash** | `R` | — | 360° radial area strike (requires unlocked Sword Mastery skill) |
| **Dodge Roll** | `Q` | `Double-tap directional` | Agile invulnerability roll consuming stamina |
| **Interact / Talk** | `E` | — | Talk to NPCs, accept quests, trade with merchants, or mount steed |
| **Mount Whistle** | `H` | — | Call your steed to gallop to your location |
| **Inventory & Gear** | `I` | `Tab` | Open backpack, equipment slots, and character stats |
| **Skill Tree / Talents**| `K` | — | Open 3-branch skill tree (Sword Mastery, Survival, Mobility) |
| **World Map** | `M` | — | Open world map displaying discovered regions and landmarks |
| **Photo Mode** | `P` | — | Freeze simulation and open cinematic Photo Studio camera |
| **Camera Orbit** | `Mouse` | — | Orbit camera around player with pitch clamping |
| **Camera Zoom** | `Mouse Wheel` | — | Smooth third-person camera distance adjustment |
| **Pause / Close Menu** | `Escape` | — | Pause simulation or close active modal / interface |
| **Quick Mute** | `M` (when menu closed) | — | Quick toggle master audio mute |

---

## 🌟 Core Game Features & Architecture

### 1. Massive Connected World & Region Discovery
- **5 Connected Realms**:
  - **The Dark Forest**: Ancient wooded wilderness with shrines and hermit camps.
  - **Whispering Pines**: Dense evergreen woods populated by shadow stalkers.
  - **Mountain Pass**: Steep rocky terrain with mist and elevated vistas.
  - **Abandoned Village**: Ruined timber settlements with lurking prowlers.
  - **The Ancient Sanctum Ruins**: High dais sanctuary with arcane warding portals.
- **Dynamic Gateways & World Traversal**: Seamless paths, stone bridges, and ancient archways connect regions without immersion-breaking loading screens.
- **Landmark Discovery & Map Tracker**: Interactive World Map (`M`) with discovery banners, landmark icons, and fog-of-war tracking.

### 2. Major Boss Encounter: Malakor the Verdant Colossus
- **Dedicated Arena**: Secluded ancient grove arena with towering megaliths and perimeter barriers.
- **Three-Phase Boss State Machine**:
  - **Phase 1: Guardian Awakens** ($100\% - 65\%\text{ HP}$): Heavy stone cleave, tracking foot stomps.
  - **Phase 2: Primal Rage** ($65\% - 30\%\text{ HP}$): Aggressive charge rushes, ground tremors, $+35\%$ speed.
  - **Phase 3: Verdant Cataclysm** ($<30\%\text{ HP}$): Radial shockwaves, enraged combos, continuous glowing vfx.
- **Telegraphed Attacks & Stagger Recovery**: Distinct warning animations, glowing hitboxes, and vulnerability recovery windows reward precision dodging.
- **Epic Rewards & Defeat Flow**: Epic death dissolve, cinematic victory fanfare, $+1,500\text{ XP}$, $+500\text{ Gold}$, and legendary relic drops.

### 3. Dynamic Weather & 24-Hour Day/Night Cycle
- **Realistic Celestial Progression**: Smooth sun/moon directional transitions, dynamic sky hemisphere gradients, and time-of-day ambient modulation.
- **5 Weather States**: Clear, Cloudy, Foggy, Rainy, and Stormy.
- **Weather Physics & Atmospheric VFX**:
  - Volumetric rain particle systems aligned with wind vectors.
  - Specular wet-surface shader brightening on terrain and stone during rainfall.
  - Atmospheric fog density shifts affecting enemy line-of-sight and draw distance.
  - Procedural lightning flash illuminations with timed thunder audio rolls.

### 4. Mount & Riding System
- **Articulated Shadow Steed**: Rigged quadruped companion with responsive riding locomotion (walk, trot, canter, gallop).
- **Smooth Riding Camera**: Extended third-person chase camera with dynamic speed FOV scaling.
- **Interaction & Whistle Recall**: Mount and dismount with `E`; summon your steed from anywhere with `H` with obstacle-safe raycast pathing.
- **Collision & Terrain Following**: Ground elevation tracking and obstacle avoidance prevent clipping into structures.

### 5. Stealth Mechanics & Sensory AI
- **Multi-Tier Sensory Awareness**: Enemies use forward vision cones ($115^\circ$ FOV), line-of-sight occlusion against walls and terrain, and acoustic sound propagation.
- **Noise Propagation Radius**: Scaling noise generation for crouching ($0.8\text{m}$), walking ($4.0\text{m}$), running ($9.5\text{m}$), sprinting ($15.5\text{m}$), and stone terrain ($+25\%$).
- **Foliage Concealment**: 80+ forest bushes offer cover concealment, reducing enemy detection range by $60\%$.
- **Stealth Takedowns**: Contextual instant takedown when sneaking behind unaware foes, accompanied by shadow elimination VFX.

### 6. Progression, Leveling & 3-Branch Skill Trees
- **Exponential XP Curve**: Level up by defeating foes and completing quests, replenishing health and earning Skill Points (SP).
- **Three Skill Branches**:
  - **Sword Mastery**: `Sword Precision` (Damage $+20\%$), `Heavy Spin Slash` (360° AoE attack), `Blade Flow` (Critical strike chance $+25\%$).
  - **Survival**: `Iron Constitution` (Max HP $+30$), `Thick Skin` (Defense $+15$), `Second Wind` (Out-of-combat HP regeneration).
  - **Mobility**: `Fleet Footed` (Sprint speed $+15\%$), `Acrobat` (Roll stamina cost $-50\%$), `Adrenaline Surge` (Stamina restored on kill).
- **Talent Respec**: Reset spent skill points anytime at the village elder for a modest in-game gold fee.

### 7. Interactive NPCs, Dynamic Dialogue & Merchant Economy
- **Authentic NPCs**: Elder Kaelen (Village Elder), Valen (Wandering Merchant), Sylas (Forest Hermit) with custom animations and proximity prompts.
- **Branching Authored Dialogue**: Contextual dialogues that update based on active quests, milestones, and world state.
- **Merchant Shop**: Buy and sell weapons, armor, consumables, and materials. Complete transaction validation prevents invalid purchases or quest item sales.
- **Side Quests**: Retrieval (*The Hermit's Lost Satchel*), Monster Hunt (*Bane of Grimfang*), and Exploration (*The Sunken Grotto*).

### 8. Advanced Inventory, Equipment & Loot System
- **20-Slot Grid Inventory**: Categorized tabs (*All*, *Weapons*, *Armor*, *Consumables*, *Materials*, *Quest Items*, *Collectibles*).
- **Side-by-Side Equipment Comparison**: Stat comparison tooltips showing delta values before equipping.
- **Physical In-World Drops**: Dropping items instantiates interactive 3D loot pickups with rarity halos.
- **Potions & Consumables**: Potions with cooldown protection and audio feedback.

### 9. Dedicated Cinematic Photo Studio Mode
- **Free-Flight Camera**: Detach camera from player with 6-DOF controls (`W`/`A`/`S`/`D`, `Space` for up, `Shift` for down, mouse pan).
- **Cinematic Adjustments**: Adjustable FOV zoom ($20^\circ$ to $100^\circ$), Dutch angle camera roll ($-45^\circ$ to $+45^\circ$).
- **Visual Filters & Framing**: Sepia, Noir, Vibrant, Dramatic, Cinematic letterboxing, and rule-of-thirds grid.
- **WebGL Screenshot Export**: Zero-compression PNG capture directly downloading to the player's device.
- **Simulation Pause**: Enemies, particles, and quest timers safely freeze during photo composition.

### 10. Authoritative Two-Player Online Co-Op Mode
- **Architecture**: Lightweight WebSocket authoritative game server (`server/coop-server.js`) supporting 5-character private room codes.
- **Kinematic Synchronization**: 20 Hz tick rate with linear interpolation (lerp) and slerp quaternion rotation smoothing.
- **Synchronized Combat & Anti-Cheat**: Authoritative damage verification, shared enemy health pools, and duplicate reward prevention.
- **Graceful Single-Player Isolation**: Single-player runs fully client-side without network dependencies; multiplayer state is isolated from local save files.

---

## 📁 Repository Structure

```
game/
├── dist/                          # Production build output
├── public/
│   ├── audio/                     # Synthesized local WAV audio assets
│   └── models/                    # 3D GLTF / GLB binary assets
├── server/
│   └── coop-server.js             # Authoritative WebSocket multiplayer co-op server
├── tests/                         # End-to-end automated regression test suites
│   ├── boss_encounter.test.js
│   ├── core_gameplay.test.js
│   ├── inventory_advanced_equipment.test.js
│   ├── mount_riding.test.js
│   ├── multiplayer_coop.test.js
│   ├── npc_advanced_dialogue_quests.test.js
│   ├── photo_mode.test.js
│   ├── save_slots_progression.test.js
│   ├── skills_progression.test.js
│   ├── stealth_system.test.js
│   ├── weather_daynight.test.js
│   └── world_expansion.test.js
├── src/
│   ├── audio/                     # Web Audio manager and sound synth
│   ├── core/                      # Game loop, CameraManager, LevelManager
│   ├── entities/                  # Player, Mount, RemotePlayer, Enemy, NPC
│   ├── environment/               # Terrain, Vegetation, Ruins, Weather, Sky
│   ├── network/                   # NetworkManager client WebSocket protocol
│   ├── physics/                   # Colliders and PhysicsWorld spatial hash
│   ├── systems/                   # Quests, Inventory, SkillTree, SaveManager
│   ├── ui/                        # UIManager and DOM HUD components
│   └── vfx/                       # Particle systems, sparks, and trails
├── index.html                     # HTML5 shell & UI overlays
├── package.json                   # Dependencies and scripts
├── vercel.json                    # Client deployment configuration
└── vite.config.js                 # Vite bundling configuration
```

---

## 🚀 Setup & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- `npm` (bundled with Node.js)

### Installation
```bash
npm install
```

### Run Client Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Multiplayer Co-Op Server Locally
```bash
npm run server
# or: node server/coop-server.js
```
The server listens on `ws://localhost:8080`.

### Production Build
```bash
npm run build
```
Compiles and bundles production assets into `dist/` in under 3 seconds.

### Preview Production Build Locally
```bash
npm run preview
```
Serves the compiled `dist/` directory at [http://localhost:4173](http://localhost:4173).

---

## 🧪 Comprehensive Automated QA Test Suites

The game includes 12 automated headless browser test suites verifying all systems with a **100% pass rate**:

```bash
# Core Gameplay & Locomotion
node tests/core_gameplay.test.js

# Save Slots, Multi-Slot Persistence & Migrations
node tests/save_slots_progression.test.js

# Advanced Inventory, Gear Comparison & Equipment
node tests/inventory_advanced_equipment.test.js

# Skill Tree, Progression Curve & Respec
node tests/skills_progression.test.js

# NPCs, Dialogue & Side Quests
node tests/npc_advanced_dialogue_quests.test.js

# Stealth, Vision Occlusion & Awareness
node tests/stealth_system.test.js

# Forest Guardian Boss Encounter
node tests/boss_encounter.test.js

# World Expansion & Region Discovery
node tests/world_expansion.test.js

# Dynamic Weather & Day/Night Cycle
node tests/weather_daynight.test.js

# Mount & Riding Locomotion
node tests/mount_riding.test.js

# Dedicated Photo Mode & Capture
node tests/photo_mode.test.js

# Two-Player Authoritative Online Co-Op
node tests/multiplayer_coop.test.js
```

---

## ☁️ Production Hosting & Deployment Architecture

### 1. Web Client Hosting (Static SPA)
The client compiles to static HTML, CSS, and JS chunks requiring no runtime Node.js server.
- **Recommended Providers**:
  - **Vercel** (included [`vercel.json`](./vercel.json) with gzip/brotli caching and asset headers).
  - **Netlify** / **Cloudflare Pages** / **AWS S3 + CloudFront**.
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_COOP_SERVER_URL`: Production WebSocket URL (e.g., `wss://coop.shadowquest.game` or `wss://shadow-quest-server.onrender.com`).

### 2. Multiplayer Server Hosting (WebSocket State Machine)
The authoritative server (`server/coop-server.js`) requires persistent WebSocket connections.
- **Recommended Providers**:
  - **Render.com**: Web Service (Node.js runtime, auto-TLS, WebSocket support).
  - **Railway.app**: Instant container deploy with zero configuration.
  - **Fly.io**: Global edge container deployment with low network latency.
  - **DigitalOcean App Platform** or **AWS Lightsail Containers** ($5/mo flat).
- **Start Command**: `node server/coop-server.js`
- **Environment Variables**:
  - `PORT`: Server port (defaults to `8080`).

### 3. Estimated Hosting Costs

| Scale Tier | Concurrent Players | Client Hosting | WebSocket Server | Est. Monthly Cost |
|---|---|---|---|---|
| **Hobby / Testing** | 1 - 20 players | Vercel Hobby (Free) | Render / Railway Free Tier | **$0.00 / mo** |
| **Indie Launch** | 20 - 500 players | Vercel Pro ($20/mo) | Railway / Fly.io ($5 - $10/mo) | **~$25 - $30 / mo** |
| **Growing Community** | 500 - 5,000 players | Cloudflare Pages ($0) + R2 | Fly.io 2x dedicated nodes ($30/mo) | **~$30 - $50 / mo** |

---

## 📜 Third-Party Assets & Licenses

All assets utilized in Shadow Quest are open-source, permissive, or procedurally generated:

1. **3D Character Models**:
   - `Soldier.glb`: Three.js Example Assets (MIT License - mrdoob/three.js).
   - `Xbot.glb`: Mixamo / Three.js Authors (MIT License).
   - `EnemyGuardian.glb`: Procedural low-poly entity bundled for Shadow Quest.
2. **Audio Assets**:
   - All sound effects and ambient tracks in `public/audio/` were synthesized in 16-bit PCM WAV format via [`scripts/generate_audio_assets.cjs`](./scripts/generate_audio_assets.cjs) (Public Domain / Unlicense).
3. **Software Dependencies**:
   - Three.js (`^0.172.0`): [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE).
   - Vite (`^6.0.7`): [MIT License](https://github.com/vitejs/vite/blob/main/LICENSE).
   - ws (`^8.18.0`): [MIT License](https://github.com/websockets/ws/blob/master/LICENSE).

---

## 📄 License

This game project is licensed under the [MIT License](./package.json).
