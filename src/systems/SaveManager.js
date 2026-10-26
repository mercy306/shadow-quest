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
   * Serializes the full current game state into the versioned schema
   */
  captureGameState(game, slot = QUICK_SAVE_SLOT) {
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

    const saveData = {
      version: SAVE_SCHEMA_VERSION,
      slot: slot,
      timestamp: now,
      gameTitle: 'Shadow Quest',
      meta: {
        stageIndex: currentLevelIndex,
        stageName: currentStage.name,
        badgeText: currentStage.badgeText,
        score: cumulativeScore + (currentQuest ? currentQuest.score : 0),
        saveDateFormatted: new Date(now).toLocaleString()
      },
      player: player ? player.getSaveState() : {
        position: { x: 0, y: 0.8, z: 2 },
        rotationY: Math.PI,
        health: 100,
        maxHealth: 100,
        isRunMode: true,
        level: 1,
        xp: 0,
        inventory: [{ id: 'health_potion', name: 'Ancient Elixir', count: 2, icon: '🧪' }],
        equipment: { weapon: 'Iron Sword', armor: 'Adventurer Tunic' },
        unlockedSkills: ['sword_slash', 'fast_sprint', 'ground_roll'],
        discoveredLocations: [currentStage.id]
      },
      world: {
        currentLevelIndex: currentLevelIndex,
        stageScores: stageScores,
        cumulativeScore: cumulativeScore,
        discoveredLocations: player?.discoveredLocations || [currentStage.id]
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
        syncState: 'LOCAL_ONLY'
      }
    };

    return saveData;
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
   * Save the game state to a slot
   */
  async saveGame(game, slot = QUICK_SAVE_SLOT) {
    const canSaveResult = this.canSave(game);
    if (!canSaveResult.allowed) {
      console.warn('[SaveManager] Save rejected:', canSaveResult.reason);
      return { success: false, reason: canSaveResult.reason };
    }

    try {
      const saveData = this.captureGameState(game, slot);
      const validation = this.validateSaveData(saveData);

      if (!validation.valid) {
        return { success: false, reason: `Validation failed: ${validation.error}` };
      }

      await this.writeToStorage(slot, saveData);

      // Trigger visual save notification toast
      if (game.uiManager && typeof game.uiManager.showSaveIndicator === 'function') {
        game.uiManager.showSaveIndicator('GAME PROGRESS SAVED', 'success');
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
        if (game.uiManager && typeof game.uiManager.showSaveIndicator === 'function') {
          game.uiManager.showSaveIndicator('CORRUPTED SAVE DATA', 'error');
        }
        return { success: false, reason: validation.error };
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

      // Update HUD Score
      const totalScore = game.levelManager.cumulativeScore + (game.questSystem?.currentQuest?.score || 0);
      if (game.uiManager && typeof game.uiManager.updateScore === 'function') {
        game.uiManager.updateScore(totalScore);
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
