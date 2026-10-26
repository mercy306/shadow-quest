# Shadow Quest - Save System & Schema Specification 💾

**Schema Version**: `1`  
**Storage Engine**: Primary: IndexedDB (`ShadowQuestDB` / store `saves`), Fallback: `localStorage` (`sq_save_<slot>`)  
**Settings Storage**: `localStorage` (`shadow_quest_settings_v1`)  

---

## 1. Overview & Architecture

The persistent save system provides reliable, client-side game state persistence without requiring a centralized game server. It manages character progression, world status, quest progress, collectible tracking, and player preferences while maintaining strict isolation between local single-player progress and any future multiplayer state.

```
┌──────────────────────────────────────────────────────────┐
│                      SaveManager.js                      │
└────────────┬───────────────────────────────┬─────────────┘
             │                               │
             ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │   IndexedDB     │             │  localStorage   │
    │ (ShadowQuestDB) │             │ (sq_save_<slot>)│
    │  Primary Store  │ ◄─Fallback─►│ Resilience Copy │
    └─────────────────┘             └─────────────────┘
```

---

## 2. Schema Specification (Version 1)

All saves follow this validated JSON data schema:

```json
{
  "version": 1,
  "slot": "quicksave",
  "timestamp": 1729950000000,
  "gameTitle": "Shadow Quest",
  "meta": {
    "stageIndex": 0,
    "stageName": "The Dark Forest",
    "badgeText": "STAGE 1: THE DARK FOREST",
    "score": 1200,
    "saveDateFormatted": "10/26/2026, 5:15:00 PM"
  },
  "player": {
    "position": {
      "x": 12.5,
      "y": 1.085,
      "z": -18.2
    },
    "rotationY": 1.25,
    "health": 72,
    "maxHealth": 100,
    "isRunMode": true,
    "level": 2,
    "xp": 350,
    "inventory": [
      {
        "id": "health_potion",
        "name": "Ancient Elixir",
        "count": 2,
        "icon": "🧪"
      },
      {
        "id": "mana_stone",
        "name": "Mana Stone",
        "count": 1,
        "icon": "🔮"
      }
    ],
    "equipment": {
      "weapon": "Iron Sword",
      "armor": "Adventurer Tunic"
    },
    "unlockedSkills": [
      "sword_slash",
      "fast_sprint",
      "ground_roll",
      "void_step"
    ],
    "discoveredLocations": [
      "dark-forest",
      "ruins-ridge"
    ]
  },
  "world": {
    "currentLevelIndex": 0,
    "stageScores": [0, 0],
    "cumulativeScore": 1200,
    "discoveredLocations": [
      "dark-forest",
      "ruins-ridge"
    ]
  },
  "collectibles": {
    "collectedIds": [
      "crystal-1"
    ],
    "count": 1
  },
  "quest": {
    "id": "mission-restore-the-forest",
    "enemiesDefeated": 1,
    "crystalsCollected": 1,
    "isEntranceUnlocked": false,
    "isCompleted": false,
    "score": 300
  },
  "settings": {
    "masterVolume": 0.8,
    "musicVolume": 0.65,
    "sfxVolume": 0.85,
    "isMuted": false,
    "mouseSensitivity": 2.2,
    "invertY": false,
    "graphicsPreset": "high"
  },
  "multiplayer": {
    "isMultiplayer": false,
    "sessionId": null,
    "syncState": "LOCAL_ONLY"
  }
}
```

### Field Definitions

| Field | Type | Description |
|---|---|---|
| `version` | `number` | Integer schema version ($1, 2, \dots$) used for migration triggering. |
| `slot` | `string` | Slot key (e.g. `'quicksave'`, `'slot_1'`). |
| `timestamp` | `number` | Unix epoch in milliseconds when the save was captured. |
| `meta.stageIndex` | `number` | Active stage index ($0$: Dark Forest, $1$: Ancient Ruins). |
| `meta.score` | `number` | Aggregate player score at time of saving. |
| `player.position` | `object` | World position $\{x, y, z\}$ with finite numbers. |
| `player.rotationY` | `number` | Character yaw angle in radians. |
| `player.health` | `number` | Current player health points ($1 \le \text{health} \le \text{maxHealth}$). |
| `player.level` | `number` | Character level ($1, 2, \dots$). |
| `player.xp` | `number` | Character experience points. |
| `player.inventory` | `Array<object>` | Array of collected inventory items $\{id, name, count, icon\}$. |
| `player.equipment` | `object` | Currently equipped gear sockets (weapon, armor). |
| `player.unlockedSkills` | `Array<string>` | IDs of unlocked combat and movement abilities. |
| `player.discoveredLocations`| `Array<string>` | IDs of areas/waypoints visited by the player. |
| `collectibles.collectedIds` | `Array<string>` | IDs of crystals gathered in the current stage to prevent respawning. |
| `quest.enemiesDefeated` | `number` | Count of stage guardians eliminated. |
| `quest.crystalsCollected` | `number` | Count of stage crystals gathered. |
| `quest.isEntranceUnlocked` | `boolean` | Whether the ruins barrier has dissolved. |
| `quest.isCompleted` | `boolean` | Whether the mission objective has been finished. |
| `settings` | `object` | Audio, camera, and graphics configuration. |
| `multiplayer` | `object` | Network isolation payload; strictly disconnected from offline saves. |

---

## 3. Storage Mechanism & Fallback Strategy

1. **IndexedDB (Primary)**:
   - Utilizes browser `window.indexedDB` under database name `'ShadowQuestDB'` and object store `'saves'`.
   - IndexedDB permits structured cloning of large data objects and has virtually unlimited storage space compared to cookies or web storage.
2. **localStorage (Dual-Write Fallback)**:
   - On every save operation, a JSON-serialized copy is mirrored to `localStorage.setItem('sq_save_<slot>', ...)`.
   - If IndexedDB is blocked (e.g. in certain private-browsing modes or restrictive iframes), reads and writes automatically failover to `localStorage` transparently without user disruption.
3. **Settings Persistence**:
   - Game settings are independently synchronized to `localStorage.getItem('shadow_quest_settings_v1')` so that UI volume sliders and camera controls persist immediately without waiting for in-game save points.

---

## 4. Transient State Protection

The save engine enforces strict guard conditions via `canSave(game)` to prevent corrupting state:
- **Level Transitions**: Saving is blocked while `levelManager.isTransitioning === true` to avoid saving half-spawned scenes.
- **Player Defeat**: Saving is blocked when player health reaches $0$ or `gameState === 'GAME_OVER'` so players cannot load into an immediate death loop.
- **Main Menu**: Saving is blocked while exploring the menu orbit.

---

## 5. Schema Validation & Migration Lifecycle

### Validation
Before restoring any save file, `validateSaveData(data)` verifies:
- `version` is a positive finite number.
- `player.position` contains finite numeric coordinates ($x, y, z$).
- `player.health` is a positive finite number $> 0$.
- `world` and `quest` structures are valid objects.

If malformed or corrupted data is detected, the engine surfaces a notification (`⚠️ CORRUPTED SAVE DATA`), discards the invalid state, and safely falls back to a clean New Game initialization rather than crashing.

### Migrations
When schema updates occur, `migrateSaveData(data)` handles sequential version transformations:
- **Legacy (v0 / Unversioned) $\rightarrow$ Version 1**:
  - Injects schema version `1`.
  - Generates default player inventory (`Ancient Elixir`), equipment, and skills.
  - Generates default quest and collectible tracking fields.
  - Injects isolated `multiplayer` block.
- Future versions (e.g. `v1 -> v2`) will follow a forward-piping migration ladder.

---

## 6. Multiplayer State Separation

Requirement 10 dictates that multiplayer state must remain distinct from local single-player progress:
- The `multiplayer` property in every single-player save file is explicitly flagged with `{ isMultiplayer: false, sessionId: null, syncState: 'LOCAL_ONLY' }`.
- Local player coordinates, stage progression, and quest milestones are stored in the client-side database and never sent to or overridden by network session packets.

---

## 7. Known Limitations & Browser Quotas

| Limitation | Impact | Mitigation |
|---|---|---|
| **Private Browsing Quotas** | Some mobile browsers limit IndexedDB to 50MB or wipe on tab closure. | Shadow Quest save payloads are compact ($\approx 1.8\text{ KB}$), easily fitting within restrictive private browsing quotas. Dual-write fallback preserves state in `localStorage`. |
| **Cross-Origin / Domain Isolation** | Browser storage is origin-bound (`http://localhost:5173` is distinct from production domains). | Saves cannot be transferred automatically across different host domains. |
| **Manual Cache Clear** | User clearing site data in browser settings deletes IndexedDB and localStorage. | Standard web limitation; exports/cloud sync can be added in future multiplayer phases. |

---

## 8. Verification & QA Suite

Automated verification is implemented in `tests/save_system.test.js` and can be run via:

```bash
node tests/save_system.test.js
```

The test runner launches headless Chrome and validates 9 comprehensive suites:
1. Initial Main Menu Continue button state (disabled when no save exists).
2. Starting game, moving player, taking damage, and collecting crystals.
3. Manual save execution and visual save indicator toast verification.
4. Schema validation and multiplayer isolation inspection.
5. Transient state rejection (transitions, death, menu).
6. Schema migration of unversioned saves and corrupted data detection.
7. Settings persistence across reloads.
8. Full browser page reload, Continue button enablement, and complete restoration of player transform, health, XP, inventory, skills, and quest objectives.
9. In-game pause menu Save and Load action verification.
