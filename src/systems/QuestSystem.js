import { Quest } from './Quest.js';

export class QuestSystem {
  constructor(collectibleManager = null, uiManager = null, environment = null, audioManager = null) {
    this.collectibleManager = collectibleManager;
    this.uiManager = uiManager;
    this.environment = environment;
    this.audioManager = audioManager;

    this.currentQuest = null;
    this.currentLevelIndex = 0;
    this.exitLocation = { x: 40, z: -75, radius: 3.5 };
    this.isEntranceUnlocked = false;

    this.onQuestCompletedCallbacks = [];

    // Auto-wire collectible manager if provided
    if (this.collectibleManager && typeof this.collectibleManager.onCollect === 'function') {
      this.collectibleManager.onCollect((item) => this.onCrystalCollected(item));
    }
  }

  setManagers({ collectibleManager, uiManager, environment, audioManager }) {
    if (collectibleManager) {
      this.collectibleManager = collectibleManager;
      if (typeof this.collectibleManager.onCollect === 'function') {
        this.collectibleManager.onCollect((item) => this.onCrystalCollected(item));
      }
    }
    if (uiManager) this.uiManager = uiManager;
    if (environment) this.environment = environment;
    if (audioManager) this.audioManager = audioManager;
  }

  onQuestCompleted(callback) {
    if (typeof callback === 'function') {
      this.onQuestCompletedCallbacks.push(callback);
    }
  }

  loadQuestForLevel(levelIndex = 0, questConfig = null, environment = this.environment) {
    this.currentLevelIndex = levelIndex;
    this.environment = environment;
    this.isEntranceUnlocked = false;

    const defaultConfig = levelIndex === 0
      ? {
          id: 'mission-restore-the-forest',
          title: 'RESTORE THE FOREST',
          description: 'Defeat hostile guardians, gather magical crystals, and escape through the ancient ruins portal.',
          enemiesRequired: 3,
          crystalsRequired: 5,
          enemiesLabel: 'Enemies defeated',
          crystalsLabel: 'Crystals collected',
          entranceLabel: 'Ancient entrance',
          exitLabel: 'Ruins Exit Portal',
          exitLocation: { x: 40, z: -75, radius: 3.5 },
          unlockMessage: 'ANCIENT RUINS UNLOCKED - The barrier has dissolved! Enter the Altar Portal.'
        }
      : {
          id: 'mission-sanctuary-of-the-ancients',
          title: 'SANCTUARY OF THE ANCIENTS',
          description: 'Defeat the elite void guardians, gather the lost relic orbs, and activate the sanctum dais.',
          enemiesRequired: 4,
          crystalsRequired: 3,
          enemiesLabel: 'Guardians defeated',
          crystalsLabel: 'Void Relics gathered',
          entranceLabel: 'Sanctum Seal',
          exitLabel: 'Sanctum Dais Portal',
          exitLocation: { x: 0, z: 0, radius: 3.5 },
          unlockMessage: 'SANCTUM SEAL BROKEN - The Central Dais Beacon is active! Enter the Dais to complete the trial.'
        };

    const config = questConfig || defaultConfig;
    this.exitLocation = config.exitLocation || (levelIndex === 0 ? { x: 40, z: -75, radius: 3.5 } : { x: 0, z: 0, radius: 3.5 });

    this.currentQuest = new Quest(config);

    // Wire up events
    this.currentQuest.onProgress(q => {
      if (this.uiManager && typeof this.uiManager.updateQuestHUD === 'function') {
        this.uiManager.updateQuestHUD(q);
      }
    });

    this.currentQuest.onEntranceUnlocked(() => {
      this.isEntranceUnlocked = true;

      // 1. Visual change in the environment
      if (this.currentLevelIndex === 0) {
        if (this.environment?.ruins && typeof this.environment.ruins.unlockEntrance === 'function') {
          this.environment.ruins.unlockEntrance();
        }
      } else {
        if (this.environment?.ruinsStage && typeof this.environment.ruinsStage.unlockSanctum === 'function') {
          this.environment.ruinsStage.unlockSanctum();
        }
      }

      // 2. Play mystical unlock sound
      if (this.audioManager && typeof this.audioManager.playEntranceUnlocked === 'function') {
        this.audioManager.playEntranceUnlocked();
      }

      // 3. UI Notification banner
      if (this.uiManager && typeof this.uiManager.showEntranceUnlockedBanner === 'function') {
        this.uiManager.showEntranceUnlockedBanner(config.unlockMessage || 'BARRIER UNLOCKED - Enter the Portal!');
      }
    });

    this.currentQuest.onCompleted(results => {
      if (this.audioManager && typeof this.audioManager.playVictoryFanfare === 'function') {
        this.audioManager.playVictoryFanfare();
      }

      // Forward to registered completion handlers (LevelManager)
      this.onQuestCompletedCallbacks.forEach(cb => cb(results));
    });

    // Initial HUD update
    if (this.uiManager && typeof this.uiManager.updateQuestHUD === 'function') {
      this.uiManager.updateQuestHUD(this.currentQuest);
    }
  }

  init() {
    this.loadQuestForLevel(0);
  }

  onEnemyDefeated(enemy) {
    if (this.currentQuest) {
      this.currentQuest.onEnemyDefeated(enemy);
    }
  }

  onCrystalCollected(crystal) {
    if (this.currentQuest) {
      this.currentQuest.onCrystalCollected(crystal);
    }
  }

  update(deltaTime, playerPosition) {
    if (!this.currentQuest || this.currentQuest.isCompleted) return;

    // Check exit trigger zone if entrance is unlocked
    if (this.currentQuest.isEntranceUnlocked && playerPosition) {
      const distToExit = Math.hypot(
        playerPosition.x - this.exitLocation.x,
        playerPosition.z - this.exitLocation.z
      );

      if (distToExit <= this.exitLocation.radius) {
        this.currentQuest.onEnterExitArea();
      }
    }
  }

  getCurrentQuest() {
    return this.currentQuest;
  }

  isMissionCompleted() {
    return this.currentQuest ? this.currentQuest.isCompleted : false;
  }
}
