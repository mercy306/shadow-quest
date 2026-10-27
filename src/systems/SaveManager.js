/**
 * SaveManager.js - Robust persistent save system for Shadow Quest
 * Supports IndexedDB with localStorage fallback, versioned schemas,
 * schema validation, migrations, settings persistence, and transient state protection.
 */

export const SAVE_SCHEMA_VERSION = 1;
export const DB_NAME = 'ShadowQuestDB';
export const DB_VERSION = 1;
export const STORE_SAVES = 'saves';
export const SETTINGS_KEY = 'shadow_quest_settings_v1';
export const QUICK_SAVE_SLOT = 'quicksave';
export const AUTOSAVE_SLOT = 'autosave';
export const MANUAL_SLOT_1 = 'slot_1';
export const MANUAL_SLOT_2 = 'slot_2';
export const MANUAL_SLOT_3 = 'slot_3';

export const ALL_SAVE_SLOTS = [
  { id: AUTOSAVE_SLOT, name: 'Autosave Checkpoint', isAutosave: true },
  { id: QUICK_SAVE_SLOT, name: 'Quick Save', isAutosave: false },
  { id: MANUAL_SLOT_1, name: 'Save Slot 1', isAutosave: false },
  { id: MANUAL_SLOT_2, name: 'Save Slot 2', isAutosave: false },
  { id: MANUAL_SLOT_3, name: 'Save Slot 3', isAutosave: false }
];

export class SaveManager {
  constructor() {
    this.db = null;
    this.isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
    this.dbInitPromise = null;
  }

  /**
   * Initializes or gets the IndexedDB database instance
   */
  async getDB() {
    if (!this.isIndexedDBAvailable) return null;
    if (this.db) return this.db;

    if (!this.dbInitPromise) {
      this.dbInitPromise = new Promise((resolve) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_SAVES)) {
              db.createObjectStore(STORE_SAVES, { keyPath: 'slot' });
            }
          };

          request.onsuccess = (event) => {
            this.db = event.target.result;
            resolve(this.db);
          };

          request.onerror = (event) => {
            console.warn('[SaveManager] IndexedDB open error, falling back to localStorage:', event.target?.error);
            this.isIndexedDBAvailable = false;
            resolve(null);
          };
        } catch (err) {
          console.warn('[SaveManager] IndexedDB exception, falling back to localStorage:', err);
          this.isIndexedDBAvailable = false;
          resolve(null);
        }
      });
    }

    return this.dbInitPromise;
  }

  /**
   * Check whether a state can be safely saved without capturing transient/corrupt state
   */
  canSave(game) {
    if (!game) {
      return { allowed: false, reason: 'Game instance is not available.' };
    }

    if (game.gameState === 'MAIN_MENU') {
      return { allowed: false, reason: 'Cannot save while in the Main Menu.' };
    }

    if (game.gameState === 'GAME_OVER' || (game.player && game.player.health <= 0)) {
      return { allowed: false, reason: 'Cannot save after player defeat.' };
    }

    if (game.levelManager && game.levelManager.isTransitioning) {
      return { allowed: false, reason: 'Cannot save during level transition.' };
    }

    return { allowed: true };
  }

  /**
   * Sanitizes save data to ensure strict serializability and prevent runtime leaks
   */
  sanitizeSerializable(data) {
    const isRuntimeObject = (val) => {
      if (!val || typeof val !== 'object') return false;
      if (val.isObject3D || val.isMesh || val.isGroup || val.isBufferGeometry || val.isMaterial || val.isTexture) return true;
      if (typeof Element !== 'undefined' && val instanceof Element) return true;
      if (typeof AudioNode !== 'undefined' && val instanceof AudioNode) return true;
      if (typeof AudioContext !== 'undefined' && val instanceof AudioContext) return true;
      return false;
    };

    const clean = (val, seen = new Set()) => {
      if (val === null || val === undefined) return val;
      if (typeof val === 'function') return undefined;
      if (typeof val !== 'object') return val;
      if (isRuntimeObject(val)) return undefined;
      if (seen.has(val)) return undefined;
      seen.add(val);

      if (Array.isArray(val)) {
        return val.map(item => clean(item, seen)).filter(item => item !== undefined);
      }

      const out = {};
      for (const [k, v] of Object.entries(val)) {
        if (typeof v === 'function') continue;
        if (isRuntimeObject(v)) continue;
        const cleaned = clean(v, seen);
        if (cleaned !== undefined) {
          out[k] = cleaned;
        }
      }
      return out;
    };

    try {
      const sanitizedObj = clean(data);
      return JSON.parse(JSON.stringify(sanitizedObj));
    } catch (err) {
      console.error('[SaveManager] Non-serializable runtime reference detected:', err);
      throw new Error(`Non-serializable object in save state: ${err.message}`);
    }
  }

  /**
   * Serializes the full current game state into the versioned schema
   */
  captureGameState(game, slot = QUICK_SAVE_SLOT, options = {}) {
    const player = game.player;
    const levelMgr = game.levelManager;
    const questSys = game.questSystem;
    const collectibleMgr = game.collectibleManager;
    const camMgr = game.cameraManager;
    const audioMgr = game.audioManager;

    const currentStage = levelMgr.getCurrentStage();
    const currentQuest = questSys.getCurrentQuest();

    const currentLevelIndex = levelMgr.currentLevelIndex;
    const stageScores = [...levelMgr.stageScores];
    const cumulativeScore = levelMgr.cumulativeScore;

    const collectedIds = collectibleMgr ? collectibleMgr.getCollectedIds() : [];

    const now = Date.now();

    const rawData = {
      version: SAVE_SCHEMA_VERSION,
      slot: slot,
      timestamp: now,
      gameTitle: 'Shadow Quest',
      meta: {
        stageIndex: currentLevelIndex,
        stageName: currentStage.name,
        badgeText: currentStage.badgeText,
        score: cumulativeScore + (currentQuest ? currentQuest.score : 0),
        saveDateFormatted: new Date(now).toLocaleString(),
        autosaveReason: options.autosaveReason || null
      },
      player: player ? player.getSaveState() : {
        position: { x: 0, y: 0.8, z: 2 },
        rotationY: Math.PI,
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        isRunMode: true,
        level: 1,
        xp: 0,
        skillPoints: 0,
        spentSkillPoints: 0,
        skillTree: {},
        inventory: [{ id: 'health_potion', name: 'Ancient Elixir', count: 2, icon: '🧪' }],
        equipment: { weapon: 'Iron Sword', armor: 'Adventurer Tunic' },
        unlockedSkills: ['sword_slash', 'fast_sprint', 'ground_roll'],
        discoveredLocations: [currentStage.id]
      },
      world: {
        currentLevelIndex: currentLevelIndex,
        stageScores: stageScores,
        cumulativeScore: cumulativeScore,
        discoveredLocations: player?.discoveredLocations || [currentStage.id],
        weather: game.environment?.weatherManager ? {
          type: game.environment.weatherManager.currentWeather,
          timeOfDay: game.environment.weatherManager.timeOfDay,
          isCycleActive: game.environment.weatherManager.isCycleActive
        } : null
      },
      collectibles: {
        collectedIds: collectedIds,
        count: collectedIds.length
      },
      quest: questSys ? questSys.getQuestSaveState() : {
        id: currentStage.quest.id,
        enemiesDefeated: 0,
        crystalsCollected: 0,
        isEntranceUnlocked: false,
        isCompleted: false
      },
      settings: this.loadSettings(),
      // Separate single-player local save from multiplayer state (Requirement 10)
      multiplayer: {
        isMultiplayer: false,
        sessionId: null,
        syncState: 'LOCAL_ONLY',
        authoritativeServer: null,
        notice: 'Multiplayer progression is strictly isolated and validated server-side.'
      }
    };

    return this.sanitizeSerializable(rawData);
  }

  /**
   * Validates save data integrity and structure
   */
  validateSaveData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Save data is empty or not an object.' };
    }

    if (typeof data.version !== 'number' || data.version <= 0) {
      return { valid: false, error: 'Invalid or missing schema version.' };
    }

    if (!data.player || typeof data.player !== 'object') {
      return { valid: false, error: 'Missing player state in save data.' };
    }

    const pos = data.player.position;
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number' ||
        !isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z)) {
      return { valid: false, error: 'Corrupted player position coordinates.' };
    }

    if (typeof data.player.health !== 'number' || data.player.health <= 0 || !isFinite(data.player.health)) {
      return { valid: false, error: 'Player health must be a positive finite number.' };
    }

    if (!data.world || typeof data.world.currentLevelIndex !== 'number') {
      return { valid: false, error: 'Missing world level progress in save data.' };
    }

    if (!data.quest || typeof data.quest !== 'object') {
      return { valid: false, error: 'Missing quest state in save data.' };
    }

    // Multiplayer integrity check: client cannot author authoritative multiplayer progression
    if (data.multiplayer && data.multiplayer.isMultiplayer === true && !data.multiplayer.authoritativeServer) {
      return { valid: false, error: 'Multiplayer progression must be validated by the server.' };
    }

    return { valid: true };
  }

  /**
   * Applies schema migrations for backwards compatibility
   */
  migrateSaveData(raw) {
    if (!raw || typeof raw !== 'object') return raw;

    let data = { ...raw };

    // Legacy unversioned / v0 schema migration
    if (!data.version || data.version < 1) {
      console.log('[SaveManager] Migrating legacy save format to schema v1...');
      data.version = 1;
      if (!data.player) data.player = {};
      if (!data.player.inventory) {
        data.player.inventory = [{ id: 'health_potion', name: 'Ancient Elixir', count: 2, icon: '🧪' }];
      }
      if (!data.player.equipment) {
        data.player.equipment = { weapon: 'Iron Sword', armor: 'Adventurer Tunic' };
      }
      if (!data.player.unlockedSkills) {
        data.player.unlockedSkills = ['sword_slash', 'fast_sprint', 'ground_roll'];
      }
      if (!data.player.level) data.player.level = 1;
      if (!data.player.xp) data.player.xp = 0;
      if (typeof data.player.skillPoints !== 'number') data.player.skillPoints = Math.max(0, (data.player.level || 1) - 1);
      if (typeof data.player.spentSkillPoints !== 'number') data.player.spentSkillPoints = 0;
      if (!data.player.skillTree) data.player.skillTree = {};
      if (!data.world) data.world = { currentLevelIndex: 0, stageScores: [0, 0], cumulativeScore: 0 };
      if (!data.quest) {
        data.quest = {
          id: 'mission-restore-the-forest',
          enemiesDefeated: 0,
          crystalsCollected: 0,
          isEntranceUnlocked: false,
          isCompleted: false,
          score: 0
        };
      }
      if (!data.collectibles) {
        data.collectibles = { collectedIds: [], count: 0 };
      }
      if (!data.multiplayer) {
        data.multiplayer = { isMultiplayer: false, sessionId: null, syncState: 'LOCAL_ONLY' };
      }
    }

    if (data.player) {
      if (typeof data.player.skillPoints !== 'number') data.player.skillPoints = Math.max(0, (data.player.level || 1) - 1);
      if (typeof data.player.spentSkillPoints !== 'number') data.player.spentSkillPoints = 0;
      if (!data.player.skillTree) data.player.skillTree = {};
    }

    // Future version migrations (e.g. v1 -> v2) would follow sequentially here

    return data;
  }

  /**
   * Persists save data to storage (IndexedDB with localStorage fallback)
   */
  async writeToStorage(slot, data) {
    const db = await this.getDB();
    if (db) {
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_SAVES, 'readwrite');
          const store = tx.objectStore(STORE_SAVES);
          const req = store.put(data);

          req.onsuccess = () => {
            // Also maintain localStorage replica for resilience
            try {
              localStorage.setItem(`sq_save_${slot}`, JSON.stringify(data));
            } catch (e) {
              // Ignore localStorage quota warnings
            }
            resolve(true);
          };

          req.onerror = (e) => {
            console.warn('[SaveManager] IndexedDB write failed, writing to localStorage:', e);
            try {
              localStorage.setItem(`sq_save_${slot}`, JSON.stringify(data));
              resolve(true);
            } catch (err) {
              reject(err);
            }
          };
        } catch (err) {
          try {
            localStorage.setItem(`sq_save_${slot}`, JSON.stringify(data));
            resolve(true);
          } catch (e) {
            reject(e);
          }
        }
      });
    } else {
      // Fallback directly to localStorage
      localStorage.setItem(`sq_save_${slot}`, JSON.stringify(data));
      return Promise.resolve(true);
    }
  }

  /**
   * Reads raw save data from storage (IndexedDB with localStorage fallback)
   */
  async readFromStorage(slot) {
    const db = await this.getDB();
    if (db) {
      const dbPromise = new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_SAVES, 'readonly');
          const store = tx.objectStore(STORE_SAVES);
          const req = store.get(slot);

          req.onsuccess = () => {
            resolve(req.result || null);
          };

          req.onerror = () => {
            resolve(null);
          };
        } catch (e) {
          resolve(null);
        }
      });

      const result = await dbPromise;
      if (result) return result;
    }

    // Try localStorage fallback
    try {
      const raw = localStorage.getItem(`sq_save_${slot}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[SaveManager] Failed to read from localStorage fallback:', e);
    }

    return null;
  }

  /**
   * Check whether a save exists for the given slot
   */
  async hasSave(slot = QUICK_SAVE_SLOT) {
    try {
      const save = await this.readFromStorage(slot);
      if (!save) return false;
      const migrated = this.migrateSaveData(save);
      const validation = this.validateSaveData(migrated);
      return validation.valid;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get metadata summary of a save file (for menus)
   */
  async getSaveMetadata(slot = QUICK_SAVE_SLOT) {
    try {
      const save = await this.readFromStorage(slot);
      if (!save) return null;
      return save.meta || {
        stageIndex: save.world?.currentLevelIndex || 0,
        score: save.world?.cumulativeScore || 0,
        saveDateFormatted: new Date(save.timestamp).toLocaleString()
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Check whether any valid save exists in any slot
   */
  async hasAnySave() {
    for (let i = 0; i < ALL_SAVE_SLOTS.length; i++) {
      const slotId = ALL_SAVE_SLOTS[i].id;
      if (await this.hasSave(slotId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Finds the slot with the most recent valid timestamp
   */
  async getLatestSaveSlot() {
    let latestSlot = null;
    let latestTime = -1;

    for (let i = 0; i < ALL_SAVE_SLOTS.length; i++) {
      const slotId = ALL_SAVE_SLOTS[i].id;
      try {
        const raw = await this.readFromStorage(slotId);
        if (!raw) continue;
        const migrated = this.migrateSaveData(raw);
        const valid = this.validateSaveData(migrated);
        if (valid.valid) {
          const ts = typeof migrated.timestamp === 'number' ? migrated.timestamp : 0;
          if (ts > latestTime) {
            latestTime = ts;
            latestSlot = slotId;
          }
        }
      } catch (e) {}
    }

    return latestSlot || QUICK_SAVE_SLOT;
  }

  /**
   * Returns metadata and status for all predefined save slots
   */
  async listAllSlots() {
    const results = [];
    for (let i = 0; i < ALL_SAVE_SLOTS.length; i++) {
      const slotCfg = ALL_SAVE_SLOTS[i];
      const slotId = slotCfg.id;
      try {
        const raw = await this.readFromStorage(slotId);
        if (!raw) {
          results.push({
            id: slotId,
            name: slotCfg.name,
            isAutosave: slotCfg.isAutosave,
            exists: false
          });
          continue;
        }

        const migrated = this.migrateSaveData(raw);
        const validation = this.validateSaveData(migrated);

        if (!validation.valid) {
          results.push({
            id: slotId,
            name: slotCfg.name,
            isAutosave: slotCfg.isAutosave,
            exists: true,
            isCorrupted: true,
            corruptionReason: validation.error,
            timestamp: raw.timestamp || Date.now(),
            dateFormatted: raw.timestamp ? new Date(raw.timestamp).toLocaleString() : 'Unknown'
          });
          continue;
        }

        const meta = migrated.meta || {};
        results.push({
          id: slotId,
          name: slotCfg.name,
          isAutosave: slotCfg.isAutosave,
          exists: true,
          isCorrupted: false,
          version: migrated.version,
          timestamp: migrated.timestamp,
          dateFormatted: new Date(migrated.timestamp).toLocaleString(),
          stageIndex: migrated.world?.currentLevelIndex ?? meta.stageIndex ?? 0,
          stageName: meta.stageName || (migrated.world?.currentLevelIndex === 1 ? 'The Ancient Ruins' : 'The Dark Forest'),
          badgeText: meta.badgeText || '',
          score: meta.score ?? (migrated.world?.cumulativeScore || 0),
          level: migrated.player?.level || 1,
          health: migrated.player?.health || 100,
          maxHealth: migrated.player?.maxHealth || 100,
          gold: migrated.player?.gold || 0,
          autosaveReason: meta.autosaveReason || null
        });
      } catch (err) {
        results.push({
          id: slotId,
          name: slotCfg.name,
          isAutosave: slotCfg.isAutosave,
          exists: true,
          isCorrupted: true,
          corruptionReason: err.message
        });
      }
    }
    return results;
  }

  /**
   * Quarantines a corrupted save instead of silently deleting it
   */
  async quarantineCorruptedSave(slot, reason = 'Unknown corruption') {
    try {
      const raw = await this.readFromStorage(slot);
      if (raw) {
        const backupKey = `sq_corrupted_${slot}_${Date.now()}`;
        try {
          localStorage.setItem(backupKey, JSON.stringify({ raw, reason, quarantinedAt: Date.now() }));
          console.warn(`[SaveManager] Quarantined corrupted save for slot '${slot}' to '${backupKey}'`);
        } catch (e) {}
      }
    } catch (e) {}
  }

  /**
   * Recovers a slot from the latest valid autosave checkpoint
   */
  async recoverFromAutosave(targetSlot = QUICK_SAVE_SLOT) {
    try {
      const autosaveData = await this.readFromStorage(AUTOSAVE_SLOT);
      if (!autosaveData) {
        return { success: false, reason: 'No autosave checkpoint available for recovery.' };
      }
      const migrated = this.migrateSaveData(autosaveData);
      const validation = this.validateSaveData(migrated);
      if (!validation.valid) {
        return { success: false, reason: `Autosave is also corrupted: ${validation.error}` };
      }
      migrated.slot = targetSlot;
      migrated.meta = {
        ...migrated.meta,
        recoveredFrom: AUTOSAVE_SLOT,
        recoveredAt: Date.now()
      };
      await this.writeToStorage(targetSlot, migrated);
      return { success: true, slot: targetSlot };
    } catch (err) {
      return { success: false, reason: err.message };
    }
  }

  /**
   * Save the game state to a slot
   */
  async saveGame(game, slot = QUICK_SAVE_SLOT, options = {}) {
    const canSaveResult = this.canSave(game);
    if (!canSaveResult.allowed) {
      console.warn('[SaveManager] Save rejected:', canSaveResult.reason);
      return { success: false, reason: canSaveResult.reason };
    }

    try {
      const saveData = this.captureGameState(game, slot, options);
      const validation = this.validateSaveData(saveData);

      if (!validation.valid) {
        return { success: false, reason: `Validation failed: ${validation.error}` };
      }

      await this.writeToStorage(slot, saveData);

      // Trigger visual save notification toast
      if (game.uiManager && typeof game.uiManager.showSaveIndicator === 'function') {
        if (slot === AUTOSAVE_SLOT) {
          game.uiManager.showSaveIndicator(options.autosaveReason ? `AUTOSAVED: ${options.autosaveReason}` : 'CHECKPOINT AUTOSAVED', 'autosave');
        } else {
          game.uiManager.showSaveIndicator(options.toastMessage || 'GAME PROGRESS SAVED', 'success');
        }
      }

      console.log(`[SaveManager] Successfully saved progress to slot '${slot}'.`);
      return { success: true, slot, timestamp: saveData.timestamp };
    } catch (err) {
      console.error('[SaveManager] Failed to save game:', err);
      if (game.uiManager && typeof game.uiManager.showSaveIndicator === 'function') {
        game.uiManager.showSaveIndicator('FAILED TO SAVE GAME', 'error');
      }
      return { success: false, reason: err.message };
    }
  }

  /**
   * Load and restore game state from a slot
   */
  async loadGame(game, slot = QUICK_SAVE_SLOT) {
    try {
      const rawData = await this.readFromStorage(slot);
      if (!rawData) {
        return { success: false, reason: `No save data found for slot '${slot}'.` };
      }

      // Apply migrations
      const migrated = this.migrateSaveData(rawData);

      // Validate integrity
      const validation = this.validateSaveData(migrated);
      if (!validation.valid) {
        console.error('[SaveManager] Corrupted save data detected:', validation.error);
        await this.quarantineCorruptedSave(slot, validation.error);
        if (game.uiManager && typeof game.uiManager.showSaveIndicator === 'function') {
          game.uiManager.showSaveIndicator('CORRUPTED SAVE DATA', 'error');
        }
        return { success: false, reason: validation.error, isCorrupted: true, slot };
      }

      // Restore Level and World
      const targetLevel = migrated.world.currentLevelIndex;
      await game.levelManager.loadLevel(targetLevel, false);

      // Restore scores
      if (migrated.world.stageScores) {
        game.levelManager.stageScores = [...migrated.world.stageScores];
      }
      if (typeof migrated.world.cumulativeScore === 'number') {
        game.levelManager.cumulativeScore = migrated.world.cumulativeScore;
      }

      // Restore weather & time of day
      if (migrated.world?.weather && game.environment?.weatherManager) {
        if (migrated.world.weather.type) {
          game.environment.weatherManager.setWeather(migrated.world.weather.type, true);
        }
        if (typeof migrated.world.weather.timeOfDay === 'number') {
          game.environment.weatherManager.setTimeOfDay(
            migrated.world.weather.timeOfDay,
            migrated.world.weather.isCycleActive !== false
          );
        }
      }

      // Restore Player state (position, rotation, health, inventory, skills)
      if (game.player && migrated.player) {
        game.player.restoreSaveState(migrated.player);
      }

      // Restore Collectibles state
      if (game.collectibleManager && migrated.collectibles?.collectedIds) {
        game.collectibleManager.restoreCollectedIds(migrated.collectibles.collectedIds);
      }

      // Restore Quest objectives & entrance unlock state
      if (game.questSystem && migrated.quest) {
        game.questSystem.restoreQuestSaveState(migrated.quest);
      }

      // Restore Camera alignment behind player
      if (game.cameraManager && game.player) {
        game.cameraManager.snapToTarget(game.player);
      }

      // Restore Settings if present
      if (migrated.settings) {
        this.applySettings(game, migrated.settings);
      }

      // Update HUD Score & Gold
      const totalScore = game.levelManager.cumulativeScore + (game.questSystem?.currentQuest?.score || 0);
      if (game.uiManager && typeof game.uiManager.updateScore === 'function') {
        game.uiManager.updateScore(totalScore);
      }
      if (game.uiManager && game.player) {
        game.uiManager.updateGold(game.player.gold);
        if (typeof game.uiManager.refreshInventoryUI === 'function') {
          game.uiManager.refreshInventoryUI();
        }
        if (typeof game.uiManager.updateProgressionUI === 'function') {
          game.uiManager.updateProgressionUI(game.player);
        }
        if (typeof game.uiManager.refreshSkillTreeUI === 'function') {
          game.uiManager.refreshSkillTreeUI();
        }
      }

      // Feedback indicator
      if (game.uiManager && typeof game.uiManager.showSaveIndicator === 'function') {
        game.uiManager.showSaveIndicator('GAME PROGRESS LOADED', 'success');
      }

      console.log(`[SaveManager] Successfully loaded and restored save from slot '${slot}'.`);
      return { success: true, slot, data: migrated };
    } catch (err) {
      console.error('[SaveManager] Failed to load game:', err);
      if (game.uiManager && typeof game.uiManager.showSaveIndicator === 'function') {
        game.uiManager.showSaveIndicator('FAILED TO LOAD SAVE', 'error');
      }
      return { success: false, reason: err.message };
    }
  }

  /**
   * Delete a save slot
   */
  async deleteSave(slot = QUICK_SAVE_SLOT) {
    const db = await this.getDB();
    if (db) {
      try {
        const tx = db.transaction(STORE_SAVES, 'readwrite');
        tx.objectStore(STORE_SAVES).delete(slot);
      } catch (e) {
        // Continue to localStorage delete
      }
    }
    try {
      localStorage.removeItem(`sq_save_${slot}`);
    } catch (e) {}
    return true;
  }

  // ==================== SETTINGS PERSISTENCE ====================

  /**
   * Loads saved settings or returns default settings
   */
  loadSettings() {
    const defaults = {
      masterVolume: 0.8,
      musicVolume: 0.65,
      sfxVolume: 0.85,
      isMuted: false,
      mouseSensitivity: 2.2,
      invertY: false,
      graphicsPreset: 'high'
    };

    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      console.warn('[SaveManager] Failed to parse stored settings:', e);
    }

    return defaults;
  }

  /**
   * Saves settings to local storage
   */
  saveSettings(settings) {
    try {
      const current = this.loadSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('[SaveManager] Failed to persist settings:', e);
      return settings;
    }
  }

  /**
   * Applies loaded settings to audioManager, cameraManager, and renderer
   */
  applySettings(game, settings) {
    if (!settings) return;

    if (game.audioManager) {
      if (typeof settings.masterVolume === 'number') game.audioManager.setMasterVolume(settings.masterVolume);
      if (typeof settings.musicVolume === 'number') game.audioManager.setMusicVolume(settings.musicVolume);
      if (typeof settings.sfxVolume === 'number') game.audioManager.setSFXVolume(settings.sfxVolume);
      if (typeof settings.isMuted === 'boolean') game.audioManager.setMute(settings.isMuted);
    }

    if (game.cameraManager) {
      if (typeof settings.mouseSensitivity === 'number') {
        game.cameraManager.setMouseSensitivity(settings.mouseSensitivity * 0.001);
      }
      if (typeof settings.invertY === 'boolean') {
        game.cameraManager.setInvertY(settings.invertY);
      }
    }

    if (game.setGraphicsQuality && settings.graphicsPreset) {
      game.setGraphicsQuality(settings.graphicsPreset);
    }
  }
}
