export const STAGE_CONFIGS = [
  {
    index: 0,
    id: 'dark-forest',
    name: 'The Dark Forest',
    badgeText: 'STAGE 1: THE DARK FOREST',
    playerSpawn: { x: 0, z: 2, rotY: Math.PI },
    quest: {
      id: 'mission-restore-the-forest',
      title: 'RESTORE THE FOREST',
      subtitle: 'The ancient darkness recedes as the forest comes back to life.',
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
  },
  {
    index: 1,
    id: 'ancient-ruins',
    name: 'The Ancient Ruins',
    badgeText: 'STAGE 2: THE ANCIENT RUINS',
    playerSpawn: { x: 0, z: 30, rotY: 0 },
    quest: {
      id: 'mission-sanctuary-of-the-ancients',
      title: 'SANCTUARY OF THE ANCIENTS',
      subtitle: 'The corrupted sanctum is cleansed. The Shadow Lord’s reign has ended.',
      description: 'Defeat the elite void guardians, gather the lost relic orbs, and activate the sanctum dais.',
      enemiesRequired: 4,
      crystalsRequired: 3,
      enemiesLabel: 'Guardians defeated',
      crystalsLabel: 'Void Relics gathered',
      entranceLabel: 'Sanctum Seal',
      exitLabel: 'Sanctum Dais Portal',
      exitLocation: { x: 0, z: 0, radius: 3.5 },
      unlockMessage: 'SANCTUM SEAL BROKEN - The Central Dais Beacon is active! Enter the Dais to complete the trial.'
    }
  }
];

export class LevelManager {
  constructor(game) {
    this.game = game;
    this.currentLevelIndex = 0;
    this.stageScores = [0, 0];
    this.cumulativeScore = 0;
    this.isTransitioning = false;
    this.hasInitiallyLoaded = false;
  }

  getCurrentStage() {
    return STAGE_CONFIGS[this.currentLevelIndex] || STAGE_CONFIGS[0];
  }

  getStageConfigs() {
    return STAGE_CONFIGS;
  }

  async init() {
    // Wire quest completion callback
    if (this.game.questSystem) {
      this.game.questSystem.onQuestCompleted((results) => {
        this.onStageCompleted(results);
      });
    }

    // Load Stage 1 initially
    await this.loadLevel(0);
    this.hasInitiallyLoaded = true;
  }

  async loadLevel(levelIndex = 0, isRestart = false) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const performLoad = async () => {
      try {
        const targetIndex = Math.max(0, Math.min(levelIndex, STAGE_CONFIGS.length - 1));
        this.currentLevelIndex = targetIndex;
        const stageConfig = STAGE_CONFIGS[targetIndex];

        // Calculate cumulative score preserved from earlier stages
        if (!isRestart) {
          this.cumulativeScore = this.stageScores.slice(0, targetIndex).reduce((sum, s) => sum + s, 0);
        }

        // 1. Clear physics world colliders and platforms
        if (this.game.physicsWorld) {
          this.game.physicsWorld.clear();
        }

        // 2. Clear previous active VFX particles
        if (this.game.vfxManager) {
          this.game.vfxManager.clear();
        }

        // 3. Load 3D environment for the stage
        if (this.game.environment) {
          this.game.environment.loadLevel(targetIndex, this.game.physicsWorld);
        }

        // 4. Reset and spawn stage enemies
        if (this.game.enemyManager) {
          await this.game.enemyManager.init(targetIndex);
        }

        // 4b. Reset and spawn stage NPCs
        if (this.game.npcManager) {
          await this.game.npcManager.init(targetIndex);
        }

        // 5. Reset and spawn stage collectibles
        if (this.game.collectibleManager) {
          this.game.collectibleManager.init(targetIndex);
        }

        // 6. Reposition, heal and ground player character
        if (this.game.player) {
          this.game.player.heal(100);
          const shouldEnable = (this.game.gameState === 'PLAYING');
          this.game.player.teleport(
            stageConfig.playerSpawn.x,
            stageConfig.playerSpawn.z,
            stageConfig.playerSpawn.rotY,
            shouldEnable
          );
        }

        // 7. Reset camera position and orientation behind player
        if (this.game.cameraManager && this.game.player) {
          this.game.cameraManager.snapToTarget(this.game.player);
        }

        // 8. Initialize quest and objective tracking for this stage
        if (this.game.questSystem) {
          this.game.questSystem.loadQuestForLevel(
            targetIndex,
            stageConfig.quest,
            this.game.environment
          );
        }

        // 9. Switch atmospheric music and background ambience
        if (this.game.audioManager) {
          this.game.audioManager.playAmbience(targetIndex);
        }

        // 10. Update HUD & UI
        if (this.game.uiManager) {
          this.game.uiManager.updateStageIndicator(stageConfig.badgeText);
          this.game.uiManager.updateCrystalCount(0, stageConfig.quest.crystalsRequired);
          if (this.game.player) {
            this.game.uiManager.updatePlayerHealth(this.game.player.health, this.game.player.maxHealth);
          }
          this.game.uiManager.hideVictoryScreen();

          if (this.game.isPaused) {
            this.game.togglePause();
          }
        }

        console.log(`[LevelManager] Successfully loaded Stage ${targetIndex + 1}: ${stageConfig.name}`);

        if (this.hasInitiallyLoaded && this.game && typeof this.game.autoSave === 'function') {
          this.game.autoSave(`Entered ${stageConfig.name}`);
        }

      } catch (err) {
        console.error('[LevelManager] Error loading level:', err);
      } finally {
        this.isTransitioning = false;
      }
    };

    // Smooth transition overlay on stage switches and restarts
    if (this.hasInitiallyLoaded && this.game.uiManager) {
      await this.game.uiManager.transitionLevel(performLoad);
    } else {
      await performLoad();
    }

    // Auto-save on stage transitions if actively playing
    if (this.hasInitiallyLoaded && this.game.gameState === 'PLAYING' && this.game.saveManager) {
      this.game.saveManager.saveGame(this.game, 'quicksave');
    }
  }

  onStageCompleted(results) {
    const stageConfig = this.getCurrentStage();
    this.stageScores[this.currentLevelIndex] = results.score;
    const totalScore = this.cumulativeScore + results.score;
    const isFinalLevel = (this.currentLevelIndex + 1 >= STAGE_CONFIGS.length);

    if (this.game && typeof this.game.onVictory === 'function') {
      this.game.onVictory();
    }

    // Trigger victory celebration VFX particles!
    if (this.game.vfxManager && this.game.player) {
      this.game.vfxManager.triggerVictoryCelebration(this.game.player.getPosition());
    }

    if (this.game.uiManager) {
      this.game.uiManager.showMissionCompleted({
        ...results,
        title: stageConfig.quest.title,
        subtitle: stageConfig.quest.subtitle,
        cumulativeScore: totalScore,
        isFinalLevel: isFinalLevel,
        currentLevelIndex: this.currentLevelIndex,
        onNextLevel: () => this.nextLevel(),
        onRestartLevel: () => this.restartCurrentLevel(),
        onMainMenu: () => this.game.returnToMainMenu()
      });
    }
  }

  async nextLevel() {
    if (this.currentLevelIndex + 1 < STAGE_CONFIGS.length) {
      await this.loadLevel(this.currentLevelIndex + 1);
    } else {
      // Loop campaign from beginning with reset score
      this.stageScores = [0, 0];
      this.cumulativeScore = 0;
      await this.loadLevel(0);
    }
    if (this.game && typeof this.game.resumeFromMenuOrEnd === 'function') {
      this.game.resumeFromMenuOrEnd();
    }
  }

  async restartCurrentLevel() {
    await this.loadLevel(this.currentLevelIndex, true);
    if (this.game && typeof this.game.resumeFromMenuOrEnd === 'function') {
      this.game.resumeFromMenuOrEnd();
    }
  }
}
