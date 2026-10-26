# Shadow Quest ⚔️

A realistic 3D third-person action-adventure game built with **Three.js** and **Vite**. Cleanse corrupted ancient forest ruins, defeat hostile void guardians, collect magical relic crystals, and restore the lost sanctuary.

---

## 🎮 Gameplay & Controls

| Action | Control | Description |
|---|---|---|
| **Run / Move** | `W` `A` `S` `D` / Arrow Keys | Camera-relative running locomotion (default) |
| **Sprint Boost** | `Shift` (Hold) or `Double-tap W` | Fast sprint boost ($10.5\text{ m/s}$) with camera FOV speed punch & dust |
| **Toggle Walk / Run** | `Caps Lock` / `C` | Toggle between deliberate Walk mode ($4.0\text{ m/s}$) and Run mode |
| **Jump** | `Space` | Jump with gravity curve and ground landing detection |
| **Attack** | `Left Click` / `F` / `E` | Swing sword with trail VFX and hit detection |
| **Look / Aim** | `Mouse` | Orbit camera around player with pitch clamping |
| **Zoom** | `Mouse Wheel` | Smooth camera distance zoom |
| **Pause** | `Escape` | Pause simulation and open pause menu |
| **Mute** | `M` | Quick toggle master audio mute |

---

## ✨ Features

- **Realistic 3D World & Lighting**:
  - Two playable stages: **Stage 1: The Dark Forest** and **Stage 2: The Ancient Ruins**.
  - ACES Filmic tone mapping, PCF soft shadows, distance atmospheric fog, and procedural terrain.
- **Third-Person Player Controller**:
  - Skeletal humanoid animation blending (`Idle`, `Walk`, `Run`, `Jump`, `Attack`, `Death`).
  - Camera-relative movement with smooth rotational interpolation.
- **Collision & Physics Engine**:
  - Custom broadphase spatial hash grid for $O(1)$ collision lookups.
  - Cylinder colliders for trees and pillars; Oriented Bounding Box (OBB) colliders for stone walls.
  - Camera raycast collision avoidance to prevent clipping through walls and terrain.
- **Hostile AI Guardians**:
  - Finite State Machine AI: `PATROL` $\rightarrow$ `DETECT` $\rightarrow$ `CHASE` $\rightarrow$ `ATTACK` $\rightarrow$ `STUNNED` $\rightarrow$ `DEAD`.
  - Dynamic overhead canvas health bars and targeted boss-style HUD.
- **Quest & Collectible System**:
  - Objective tracking (*Enemies defeated*, *Crystals collected*, *Portal barrier status*).
  - Floating, glowing crystals with proximity collection detection and audio chimes.
  - Exit portal unlocking when objectives are fulfilled.
- **Audio & Visual Effects**:
  - Local WAV audio assets for sword swings, impacts, player damage, jumps, enemy death, victory fanfare, and looping forest/ruins ambient tracks.
  - GPU particle systems for weapon trails, impact sparks, crystal gathering bursts, and damage vignettes.
- **Polished UI / HUD**:
  - Full-screen main menu with live 3D background camera orbit.
  - In-game HUD: health bar, live score, targeted enemy health, crystal counter, objective list, and interaction prompts.
  - Settings modal: Master, Music, and SFX volume sliders, Mouse sensitivity, Invert Y-axis, and Graphics presets (High, Medium, Low).
  - Pause menu, Game Over screen (with Retry), and Victory mission results screen.
- **Robust Persistent Save System**:
  - IndexedDB storage with automatic `localStorage` fallback.
  - Versioned schema (v1) with validation, error handling, and migrations for backwards compatibility.
  - Saves player coordinates, rotation, health, level, experience, inventory, equipment, unlocked skills, discovered locations, collectibles, and quest progress.
  - Persists game settings (audio volumes, mute, mouse sensitivity, invert-Y, graphics preset).
  - Main menu **Continue** & **New Game** buttons; pause menu **Save Game** & **Load Game** buttons.
  - Visual save notification indicator toast with pulse animation.
  - Protection against saving transient states (e.g., during level transitions or player defeat).
  - Strict isolation between local single-player saves and future multiplayer states.

---

## 📁 Project Structure

```
game/
├── dist/                          # Production build output
├── public/
│   ├── audio/                     # Synthesized local WAV audio assets
│   │   ├── crystal_collect.wav
│   │   ├── enemy_attack.wav
│   │   ├── enemy_death.wav
│   │   ├── forest_ambience.wav
│   │   ├── jump.wav
│   │   ├── land.wav
│   │   ├── player_damage.wav
│   │   ├── ruins_ambience.wav
│   │   ├── sword_hit.wav
│   │   ├── sword_swing.wav
│   │   └── victory.wav
│   └── models/                    # 3D GLTF / GLB binary assets
│       ├── EnemyGuardian.glb
│       ├── Soldier.glb
│       └── Xbot.glb
├── scripts/
│   └── generate_audio_assets.cjs  # Procedural audio generator
├── src/
│   ├── audio/
│   │   └── AudioManager.js        # Web Audio manager with positional listener
│   ├── core/
│   │   ├── CameraManager.js       # Orbit camera, pointer lock, raycast avoidance
│   │   ├── Game.js                # Game state machine & main loop
│   │   └── LevelManager.js        # Stage configs, transitions, and resets
│   ├── entities/
│   │   ├── AnimationController.js # Three.js AnimationMixer cross-fader
│   │   ├── Enemy.js               # Guardian entity with state machine AI
│   │   ├── EnemyManager.js        # Stage enemy lifecycle and spawning
│   │   ├── Player.js              # Character controller & input handler
│   │   └── Sword.js               # Weapon tip-to-base collision geometry
│   ├── environment/
│   │   ├── Environment.js         # Lighting, sky, fog, stage loader
│   │   ├── Ruins.js               # Stage 1 ancient ruin structures & portal
│   │   ├── RuinsStage.js          # Stage 2 sanctum dais & stone pillars
│   │   ├── Terrain.js             # Procedural elevation mesh
│   │   ├── TextureGenerator.js    # Procedural canvas textures (bark, stone, grass)
│   │   └── Vegetation.js          # Foliage, trees, and rock scatter
│   ├── physics/
│   │   ├── Colliders.js           # Circle and Box OBB colliders
│   │   └── PhysicsWorld.js        # Spatial hash grid and collision resolution
│   ├── systems/
│   │   ├── Collectible.js         # Base and crystal collectible entities
│   │   ├── CollectibleManager.js  # Stage crystal placement & pickups
│   │   ├── CombatSystem.js        # Damage calculation, proximity targeting, score
│   │   ├── Quest.js               # Quest objectives & criteria
│   │   ├── QuestSystem.js         # Objective listeners & portal unlock logic
│   │   └── SaveManager.js         # IndexedDB persistent save system & schema migration
│   ├── ui/
│   │   └── UIManager.js           # Menu, HUD, modal, and screen controller
│   ├── vfx/
│   │   └── VFXManager.js          # Particle pools, sparks, and ribbons
│   ├── main.js                    # Application entry point
│   └── style.css                  # Modern UI styles & animations
├── index.html                     # HTML5 shell & UI overlays
├── package.json                   # Dependencies and scripts
├── vercel.json                    # Vercel deployment configuration
└── vite.config.js                 # Vite bundling & preview configuration
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

### Development Server
Start the local development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
Compile and minify the project into the `dist/` directory:
```bash
npm run build
```

### Preview Production Build Locally
Serve the compiled `dist/` directory locally to verify production behavior:
```bash
npm run preview
```
Open [http://localhost:4173](http://localhost:4173) in your browser.

---

## ☁️ Deployment to Vercel

The project includes a production-ready [`vercel.json`](./vercel.json) configured for optimal asset caching, CORS headers for 3D binary models and WAV audio, and single-page application (SPA) routing.

### Option A: Deploy via GitHub (Recommended)

1. Push your repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Shadow Quest"
   git remote add origin https://github.com/<your-username>/shadow-quest.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com/).
3. Click **"Add New..."** $\rightarrow$ **"Project"**.
4. Import your `shadow-quest` repository from GitHub.
5. In the configuration screen, Vercel will automatically detect **Vite**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `vite build` (or `npm run build`)
   - **Output Directory**: `dist`
6. Click **Deploy**. Vercel will build and publish your game to a live URL (e.g., `https://shadow-quest.vercel.app`).

### Option B: Deploy via Vercel CLI

1. Install the Vercel CLI globally (if not already installed):
   ```bash
   npm install -g vercel
   ```
2. Run the deployment command from the project root:
   ```bash
   vercel
   ```
3. Follow the on-screen prompts to link your project and deploy.
4. For production release:
   ```bash
   vercel --prod
   ```

---

## 📜 Third-Party Assets & Licenses

All assets utilized in Shadow Quest are open-source, permissive, or procedurally generated for the project:

### 1. 3D Character Models
- **`Soldier.glb`**:
  - *Source*: [Three.js Repository](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/Soldier.glb)
  - *License*: MIT License
  - *Author*: Three.js Authors
- **`Xbot.glb`**:
  - *Source*: [Three.js Repository](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/Xbot.glb)
  - *License*: MIT License
  - *Author*: Mixamo / Three.js Authors
- **`EnemyGuardian.glb`**:
  - *Source*: Custom low-poly procedural guardian bundled for Shadow Quest.

### 2. Audio Assets
- All sound effects and ambient tracks in `public/audio/` (`sword_swing.wav`, `sword_hit.wav`, `enemy_attack.wav`, `enemy_death.wav`, `crystal_collect.wav`, `player_damage.wav`, `jump.wav`, `land.wav`, `victory.wav`, `forest_ambience.wav`, `ruins_ambience.wav`) were procedurally synthesized in 16-bit PCM WAV format via [`scripts/generate_audio_assets.cjs`](./scripts/generate_audio_assets.cjs).
- *License*: Unlicense / Public Domain (free for commercial and non-commercial use).

### 3. Software Dependencies
- **Three.js** (`^0.172.0`): [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE) - Copyright © 2010-2025 Three.js Authors.
- **Vite** (`^6.0.7`): [MIT License](https://github.com/vitejs/vite/blob/main/LICENSE) - Copyright © 2019-present Yuxi (Evan) You and Vite Contributors.

---

## 📄 License

This game project is licensed under the [MIT License](./package.json).
