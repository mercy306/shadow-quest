export const STAGE_CONFIGS = [
  {
    index: 0,
    id: 'simien-highlands',
    name: 'The Simien Highlands',
    badgeText: 'ደረጃ ፩: ደብረ ስሜን • STAGE 1: SIMIEN HIGHLANDS',
    playerSpawn: { x: 0, z: 2, rotY: Math.PI },
    passages: [
      {
        id: 'forest-to-ruins',
        name: 'Axumite Sanctuary',
        targetLevelIndex: 1,
        targetSpawn: { x: 0, z: 28, rotY: 0 },
        x: 40,
        z: -75,
        radius: 4.5,
        prompt: '[E] Enter Axumite Sanctuary Altar'
      },
      {
        id: 'forest-to-mountain',
        name: 'Gorge of Ras Dashen',
        targetLevelIndex: 2,
        targetSpawn: { x: 30, z: 25, rotY: -Math.PI / 4 },
        x: -55,
        z: -20,
        radius: 5.0,
        prompt: '[E] Ascend to Ras Dashen Pass'
      },
      {
        id: 'forest-to-village',
        name: 'Lalibela Monasteries',
        targetLevelIndex: 3,
        targetSpawn: { x: 0, z: -35, rotY: 0 },
        x: 10,
        z: 30,
        radius: 5.0,
        prompt: '[E] Travel to Lalibela Village'
      },
      {
        id: 'forest-to-cavern',
        name: 'Caverns of Lake Tana',
        targetLevelIndex: 4,
        targetSpawn: { x: -28, z: 28, rotY: Math.PI / 4 },
        x: -32,
        z: -35,
        radius: 5.0,
        prompt: '[E] Descend into Lake Tana Caverns'
      }
    ],
    landmarks: [
      { id: 'df-clearing', name: 'Highland Escarpment', x: 0, z: 0, radius: 10.0, xpReward: 30 },
      { id: 'df-ridge', name: 'Ras Dashen Ridge', x: 24, z: -45, radius: 11.0, xpReward: 30 },
      { id: 'df-altar', name: 'Altar of Axumite Kings', x: 40, z: -75, radius: 10.0, xpReward: 40 },
      { id: 'df-grove', name: "Arwe's Sacred Acacia Grove", x: -38, z: -66, radius: 14.0, xpReward: 50 },
      { id: 'df-canyon-trail', name: 'Sanctuary of the Walia', x: -55, z: -20, radius: 9.0, xpReward: 30 }
    ],
    quest: {
      id: 'mission-restore-the-forest',
      title: 'ደብረ ስሜንን ማደስ • RESTORE THE HIGHLANDS',
      subtitle: 'The sacred Simien peaks awaken as ancient blessings return.',
      description: 'Defeat shadow sentinels, gather sacred Wollo Opals (ዕንቁ), and open the ancient Axumite portal.',
      enemiesRequired: 3,
      crystalsRequired: 5,
      enemiesLabel: 'Sentinels banished',
      crystalsLabel: 'Wollo Opals collected',
      entranceLabel: 'Highland Sanctuary',
      exitLabel: 'Axum Sanctuary Portal',
      exitLocation: { x: 40, z: -75, radius: 3.5 },
      unlockMessage: 'AXUMITE GATEWAY AWAKENED - The sacred seal is broken! Enter the Obelisk Portal.'
    }
  },
  {
    index: 1,
    id: 'axum-sanctuary',
    name: 'Axumite Sanctuary',
    badgeText: 'ደረጃ ፪: አክሱም ሐውልት • STAGE 2: AXUMITE SANCTUARY',
    playerSpawn: { x: 0, z: 30, rotY: 0 },
    passages: [
      {
        id: 'ruins-to-forest',
        name: 'The Simien Highlands',
        targetLevelIndex: 0,
        targetSpawn: { x: 38, z: -70, rotY: 0 },
        x: 0,
        z: 35,
        radius: 4.5,
        prompt: '[E] Return to Simien Highlands'
      },
      {
        id: 'ruins-to-mountain',
        name: 'Gorge of Ras Dashen',
        targetLevelIndex: 2,
        targetSpawn: { x: 28, z: -18, rotY: -Math.PI / 2 },
        x: -35,
        z: 0,
        radius: 4.5,
        prompt: '[E] Cross to Ras Dashen'
      },
      {
        id: 'ruins-to-cavern',
        name: 'Caverns of Lake Tana',
        targetLevelIndex: 4,
        targetSpawn: { x: 25, z: -25, rotY: -Math.PI / 4 },
        x: 35,
        z: 0,
        radius: 4.5,
        prompt: '[E] Descend to Tana Caverns'
      }
    ],
    landmarks: [
      { id: 'ar-antechamber', name: 'Great Obelisk Plaza (ሐውልት)', x: 0, z: 30, radius: 10.0, xpReward: 30 },
      { id: 'ar-dais', name: 'Sanctum of the Ark (ጽዮን)', x: 0, z: 0, radius: 8.0, xpReward: 40 },
      { id: 'ar-catacombs', name: 'Monolithic Royal Vaults', x: -18, z: 18, radius: 9.0, xpReward: 30 }
    ],
    quest: {
      id: 'mission-sanctuary-of-the-ancients',
      title: 'የአክሱም መቅደስ • SANCTUARY OF AXUM',
      subtitle: 'The sacred obelisks shine once more. Ancient peace reigns.',
      description: 'Defeat the elite void guardians, recover the golden Axumite relics, and kindle the Central Obelisk.',
      enemiesRequired: 4,
      crystalsRequired: 3,
      enemiesLabel: 'Guardians banished',
      crystalsLabel: 'Axumite Relics recovered',
      entranceLabel: 'Sanctum Gate',
      exitLabel: 'Great Obelisk Dais',
      exitLocation: { x: 0, z: 0, radius: 3.5 },
      unlockMessage: 'AXUMITE SEAL RESTORED - The Great Obelisk Beacon is ablaze! Enter the Dais to complete the trial.'
    }
  },
  {
    index: 2,
    id: 'mountain-pass',
    name: 'Ras Dashen Pass',
    badgeText: 'ደረጃ ፫: ደጀን ገደል • STAGE 3: RAS DASHEN PASS',
    playerSpawn: { x: 30, z: 25, rotY: -Math.PI / 4 },
    passages: [
      {
        id: 'mountain-to-forest',
        name: 'The Simien Highlands',
        targetLevelIndex: 0,
        targetSpawn: { x: -50, z: -18, rotY: 0 },
        x: 35,
        z: 28,
        radius: 4.5,
        prompt: '[E] Descend to Simien Highlands'
      },
      {
        id: 'mountain-to-village',
        name: 'Lalibela Rock Enclave',
        targetLevelIndex: 3,
        targetSpawn: { x: -30, z: 12, rotY: 0 },
        x: -30,
        z: -30,
        radius: 4.5,
        prompt: '[E] Follow Path to Lalibela'
      },
      {
        id: 'mountain-to-ruins',
        name: 'Axumite Sanctuary',
        targetLevelIndex: 1,
        targetSpawn: { x: -30, z: 0, rotY: Math.PI / 2 },
        x: 32,
        z: -20,
        radius: 4.5,
        prompt: '[E] Ascend to Axumite Sanctuary'
      }
    ],
    landmarks: [
      { id: 'mp-canyon', name: 'ደጀን ገደል • Highwind Simien Escarpment', x: 30, z: 25, radius: 9.0, xpReward: 30 },
      { id: 'mp-bridge', name: 'የዋላ ድልድይ • Sanctuary Bridge of the Walia', x: 0, z: 5, radius: 7.0, xpReward: 40 },
      { id: 'mp-cairn', name: "የንስር ጫፍ • Eagle's Peak Monolith", x: -25, z: -20, radius: 9.0, xpReward: 50 },
      { id: 'mp-cache', name: "የአዳኝ መሸሸጊያ • Simien Hunter's Cache", x: -15, z: 30, radius: 6.0, xpReward: 30 }
    ],
    quest: {
      id: 'mission-mountain-pass',
      title: 'የራስ ዳሸን ገደል • RAS DASHEN CRAGS',
      subtitle: 'High Simien winds quiet as the ancient trails are made safe.',
      description: 'Traverse the Afro-alpine crags, defeat highland sentinels, and secure the Simien Bridge.',
      enemiesRequired: 3,
      crystalsRequired: 2,
      enemiesLabel: 'Highland Sentinels defeated',
      crystalsLabel: 'Simien Fire Opals gathered',
      entranceLabel: 'Highwind Ridge',
      exitLabel: 'Lalibela Pass Waypoint',
      exitLocation: { x: -30, z: -30, radius: 3.5 },
      unlockMessage: 'RAS DASHEN PASS SECURED - The route to Lalibela is open!'
    }
  },
  {
    index: 3,
    id: 'abandoned-village',
    name: 'Gondar Imperial City',
    badgeText: 'ደረጃ ፬: ጎንደር ፋሲል ግቢ • STAGE 4: GONDAR IMPERIAL CITY',
    playerSpawn: { x: 0, z: -35, rotY: 0 },
    passages: [
      {
        id: 'village-to-forest',
        name: 'The Simien Highlands',
        targetLevelIndex: 0,
        targetSpawn: { x: 10, z: 24, rotY: Math.PI },
        x: 0,
        z: -40,
        radius: 4.5,
        prompt: '[E] Return to Simien Highlands'
      },
      {
        id: 'village-to-mountain',
        name: 'Ras Dashen Pass',
        targetLevelIndex: 2,
        targetSpawn: { x: -26, z: -26, rotY: Math.PI / 4 },
        x: -35,
        z: 15,
        radius: 4.5,
        prompt: '[E] Climb Ras Dashen Trail'
      },
      {
        id: 'village-to-cavern',
        name: 'Sof Omar Sacred Caverns',
        targetLevelIndex: 4,
        targetSpawn: { x: -5, z: -25, rotY: Math.PI },
        x: -5,
        z: 5,
        radius: 4.0,
        prompt: '[E] Descend into Holy Crypt'
      }
    ],
    landmarks: [
      { id: 'av-square', name: 'የፋሲል ግቢ አደባባይ • Fasilides Royal Plaza', x: 0, z: 0, radius: 9.0, xpReward: 30 },
      { id: 'av-castle', name: 'የፋሲል ግንብ • Fasilides Castle Keep', x: 16, z: 16, radius: 10.0, xpReward: 50 },
      { id: 'av-bazaar', name: 'የጎንደር ገበያና ቡና ቤት • Royal Bazaar & Coffee Ceremony', x: 6, z: -8, radius: 8.0, xpReward: 40 },
      { id: 'av-music', name: 'የአዝማሪ ቤት • Azmari Minstrel Station', x: -8, z: -8, radius: 7.0, xpReward: 30 },
      { id: 'av-well', name: 'የቅዱስ ጸበል ምንጭ • Sacred Tsebel Holy Spring', x: -5, z: 5, radius: 7.0, xpReward: 30 },
      { id: 'av-manor', name: "የቤተ ጊዮርጊስ ቅዱስ መቅደስ • Bet Giyorgis Rock-Hewn Sanctuary", x: -1, z: -2, radius: 9.0, xpReward: 40 }
    ],
    quest: {
      id: 'mission-abandoned-village',
      title: 'የጎንደር ግርማ ሞገስ • GLORY OF GONDAR',
      subtitle: 'The imperial city of Gondar rejoices as peace returns to the royal court.',
      description: 'Protect the royal imperial city of Gondar, partake in the sacred coffee ceremony, gather traditional relics, and unseal the Holy Crypt.',
      enemiesRequired: 3,
      crystalsRequired: 3,
      enemiesLabel: 'Blight sentinels banished',
      crystalsLabel: 'Imperial Relics recovered',
      entranceLabel: 'Gondar Ras Ber Gate',
      exitLabel: 'Holy Crypt Descent',
      exitLocation: { x: -5, z: 5, radius: 3.5 },
      unlockMessage: 'GONDAR IMPERIAL SANCTUARY RESTORED - The Holy Crypt seal has opened!'
    }
  },
  {
    index: 4,
    id: 'hidden-cavern',
    name: 'Sof Omar Sacred Caverns',
    badgeText: 'ደረጃ ፭: የሶፍ ዑመር ዋሻ • STAGE 5: SOF OMAR SACRED CAVERNS',
    playerSpawn: { x: -28, z: 28, rotY: Math.PI / 4 },
    passages: [
      {
        id: 'cavern-to-forest',
        name: 'The Simien Highlands',
        targetLevelIndex: 0,
        targetSpawn: { x: -30, z: -30, rotY: 0 },
        x: -30,
        z: 30,
        radius: 4.5,
        prompt: '[E] Climb to Simien Highlands'
      },
      {
        id: 'cavern-to-village',
        name: 'Lalibela Rock Enclave',
        targetLevelIndex: 3,
        targetSpawn: { x: -5, z: 8, rotY: 0 },
        x: -5,
        z: -30,
        radius: 4.5,
        prompt: '[E] Ascend to Lalibela Holy Spring'
      },
      {
        id: 'cavern-to-ruins',
        name: 'Axumite Sanctuary',
        targetLevelIndex: 1,
        targetSpawn: { x: 30, z: 0, rotY: -Math.PI / 2 },
        x: 28,
        z: -28,
        radius: 4.5,
        prompt: '[E] Enter Crypt Portal to Axum'
      }
    ],
    landmarks: [
      { id: 'hc-grotto', name: 'የሶፍ ዑመር አዳራሽ • Chamber of Limestone Pillars', x: -30, z: 30, radius: 9.0, xpReward: 30 },
      { id: 'hc-bridge', name: 'የወይብ ወንዝ ድልድይ • Subterranean Weyb River Bridge', x: 0, z: 0, radius: 8.0, xpReward: 40 },
      { id: 'hc-dungeon-gate', name: 'የጥንቱ መቅደስ በር • Ancient Monolithic Crypt Gate', x: 25, z: -25, radius: 9.0, xpReward: 60 },
      { id: 'hc-smuggler', name: "የነጋዴው ዋሻ • Caravaneer's Subterranean Alcove", x: 30, z: 20, radius: 7.0, xpReward: 30 }
    ],
    quest: {
      id: 'mission-whispering-cavern',
      title: 'የሶፍ ዑመር ጥልቅ ዋሻ • CAVERNS OF SOF OMAR',
      subtitle: 'The subterranean limestone chambers echo in reverent silence. The ancient crypt portal beckons.',
      description: 'Explore the vast subterranean limestone galleries of the Weyb River, harvest glowing cavern opals, and unseal the sacred crypt.',
      enemiesRequired: 3,
      crystalsRequired: 3,
      enemiesLabel: 'Cavern beasts defeated',
      crystalsLabel: 'Weyb River Cavern Opals harvested',
      entranceLabel: 'Grotto Fissure',
      exitLabel: 'Crypt Dungeon Gate',
      exitLocation: { x: 25, z: -25, radius: 3.5 },
      unlockMessage: 'SOF OMAR CRYPT REVEALED - The sacred stone portcullis rises!'
    }
  }
];

export class LevelManager {
  constructor(game) {
    this.game = game;
    this.currentLevelIndex = 0;
    this.stageScores = [0, 0, 0, 0, 0];
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

  getPassages() {
    const stage = this.getCurrentStage();
    return stage.passages || [];
  }

  getLandmarks() {
    const stage = this.getCurrentStage();
    return stage.landmarks || [];
  }

  getNearbyPassage(playerPos, radius = 4.2) {
    if (!playerPos) return null;
    const passages = this.getPassages();
    for (const p of passages) {
      const dist = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
      if (dist <= (p.radius || radius)) {
        return p;
      }
    }
    return null;
  }

  getNearbyLandmark(playerPos) {
    if (!playerPos) return null;
    const landmarks = this.getLandmarks();
    for (const lm of landmarks) {
      const dist = Math.hypot(playerPos.x - lm.x, playerPos.z - lm.z);
      if (dist <= lm.radius) {
        return lm;
      }
    }
    return null;
  }

  async transitionToPassage(passage) {
    if (!passage || this.isTransitioning) return;
    await this.loadLevel(passage.targetLevelIndex, false, passage.targetSpawn);
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

  async loadLevel(levelIndex = 0, isRestart = false, spawnPos = null) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Capture preserved stats synchronously at transition initiation
    const preservedHealth = (this.game.player && !isRestart && this.hasInitiallyLoaded)
      ? this.game.player.health
      : null;
    const preservedStamina = (this.game.player && !isRestart && this.hasInitiallyLoaded)
      ? this.game.player.stamina
      : null;

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
          if (this.game.enemyManager.boss) {
            this.game.enemyManager.boss.setManagers({
              game: this.game,
              uiManager: this.game.uiManager,
              audioManager: this.game.audioManager,
              vfxManager: this.game.vfxManager,
              questSystem: this.game.questSystem,
              arena: this.game.environment?.arenaGrove
            });

            // If boss was already defeated in this save/quest run, mark defeated on spawn
            if (this.game.questSystem && this.game.questSystem.completedQuestIds && this.game.questSystem.completedQuestIds.has('boss-malakor')) {
              this.game.enemyManager.boss.isDefeated = true;
              this.game.enemyManager.boss.isTriggered = true;
              this.game.enemyManager.boss.hasAwardedRewards = true;
              this.game.enemyManager.boss.setState('DEAD');
              if (this.game.enemyManager.boss.mesh) {
                this.game.enemyManager.boss.mesh.visible = false;
              }
            }
          }
        }

        // 4b. Reset and spawn stage NPCs
        if (this.game.npcManager) {
          await this.game.npcManager.init(targetIndex);
        }

        // 5. Reset and spawn stage collectibles
        if (this.game.collectibleManager) {
          this.game.collectibleManager.init(targetIndex);
        }

        // 6. Reposition, heal (if restart or death) and ground player character
        if (this.game.player) {
          const shouldEnable = (this.game.gameState === 'PLAYING');
          const spawn = spawnPos || stageConfig.playerSpawn;
          this.game.player.teleport(
            spawn.x,
            spawn.z,
            spawn.rotY,
            shouldEnable,
            isRestart
          );

          if (isRestart || preservedHealth === null || preservedHealth <= 0) {
            this.game.player.heal(100);
          } else {
            this.game.player.health = Math.min(this.game.player.maxHealth, preservedHealth);
            if (typeof preservedStamina === 'number') {
              this.game.player.stamina = Math.min(this.game.player.maxStamina, preservedStamina);
            }
          }

          // Track region discovery
          if (!this.game.player.discoveredLocations.includes(stageConfig.id)) {
            this.game.player.discoveredLocations.push(stageConfig.id);
            if (this.hasInitiallyLoaded && this.game.uiManager && typeof this.game.uiManager.showDiscoveryBanner === 'function') {
              this.game.uiManager.showDiscoveryBanner(stageConfig.name, 'REGION DISCOVERED');
            }
          }
        }

        // 6b. Synchronize mount to stage transition
        if (this.game.mountManager) {
          const spawnPt = spawnPos || stageConfig.playerSpawn;
          this.game.mountManager.setPhysicsWorld(this.game.physicsWorld);
          this.game.mountManager.setEnvironment(this.game.environment);
          this.game.mountManager.onLevelTransition(targetIndex, this.game.player, spawnPt);
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
            if (typeof this.game.uiManager.updatePlayerStamina === 'function') {
              this.game.uiManager.updatePlayerStamina(this.game.player.stamina, this.game.player.maxStamina);
            }
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
