import { Quest, SideQuest } from './Quest.js';

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

    this.sideQuests = new Map();
    this.completedQuestIds = new Set();
    this.initSideQuests();

    this.onQuestCompletedCallbacks = [];
    this.game = null;

    // Auto-wire collectible manager if provided
    if (this.collectibleManager && typeof this.collectibleManager.onCollect === 'function') {
      this.collectibleManager.onCollect((item) => {
        if (item && item.type === 'item') {
          this.onItemCollected(item);
        } else {
          this.onCrystalCollected(item);
        }
      });
    }
  }

  initSideQuests() {
    this.sideQuests.clear();

    // 1. Retrieving a lost item
    this.sideQuests.set('side-hermit-satchel', new SideQuest({
      id: 'side-hermit-satchel',
      title: "The Hermit's Lost Satchel",
      description: "Sylas the Hermit dropped his medicine satchel near the overgrown ruins to the north-west. Retrieve it for him.",
      giverId: 'npc-sylas',
      giverName: 'Sylas',
      type: 'retrieval',
      targetId: 'hermit_satchel',
      objectiveText: "Recover Sylas's Lost Satchel",
      target: 1,
      rewards: { gold: 100, xp: 100, itemId: 'healing_potion', itemQty: 2 }
    }));

    // 2. Defeating a dangerous creature
    this.sideQuests.set('side-bane-grimfang', new SideQuest({
      id: 'side-bane-grimfang',
      title: 'Bane of Grimfang',
      description: 'Elder Kaelen has marked a dangerous corrupted shadow stalker named Grimfang roaming the western hollow. Slay the beast.',
      giverId: 'npc-kaelen',
      giverName: 'Elder Kaelen',
      type: 'kill',
      targetId: 'grimfang-alpha',
      objectiveText: 'Defeat Grimfang in the western hollow',
      target: 1,
      rewards: { gold: 150, xp: 150, itemId: 'shadow_cleaver', itemQty: 1 }
    }));

    // 3. Discovering a hidden location
    this.sideQuests.set('side-sunken-grotto', new SideQuest({
      id: 'side-sunken-grotto',
      title: 'The Sunken Grotto',
      description: 'Discover the ancient Sunken Grotto Shrine hidden beyond the western ridge.',
      giverId: 'npc-kaelen',
      giverName: 'Elder Kaelen',
      type: 'discovery',
      targetId: 'sunken-grotto',
      discoveryZone: { x: -30.0, z: -35.0, radius: 6.0 },
      objectiveText: 'Discover the Sunken Grotto Shrine',
      target: 1,
      rewards: { gold: 100, xp: 100, itemId: 'stamina_potion', itemQty: 1 }
    }));
  }

  setGame(game) {
    this.game = game;
  }

  getSideQuest(id) {
    return this.sideQuests.get(id);
  }

  getAllSideQuests() {
    return Array.from(this.sideQuests.values());
  }

  getActiveSideQuests() {
    return Array.from(this.sideQuests.values()).filter(q => q.status === 'ACTIVE' || q.status === 'READY_TO_TURN_IN');
  }

  acceptSideQuest(id) {
    const quest = this.sideQuests.get(id);
    if (!quest) return false;
    if (quest.status === 'AVAILABLE') {
      quest.status = 'ACTIVE';
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification(`📜 Side Quest Accepted: ${quest.title}`);
      }
      this.updateSideQuestHUD();
      return true;
    }
    return false;
  }

  completeSideQuest(id, player = null) {
    const quest = this.sideQuests.get(id);
    if (!quest) return false;
    if (quest.status === 'COMPLETED' || this.completedQuestIds.has(id)) {
      console.warn(`[QuestSystem] Quest '${id}' is already completed. One-time rewards cannot be re-awarded.`);
      return false;
    }
    if (quest.status !== 'READY_TO_TURN_IN') return false;

    quest.complete();
    this.completedQuestIds.add(id);

    // Distribute rewards
    if (player) {
      if (quest.rewards.gold && player.inventorySystem) {
        player.inventorySystem.addGold(quest.rewards.gold);
      }
      if (quest.rewards.xp) {
        if (typeof player.addXP === 'function') {
          player.addXP(quest.rewards.xp);
        } else {
          player.xp = (player.xp || 0) + quest.rewards.xp;
        }
      }
      if (quest.rewards.itemId && player.inventorySystem) {
        const item = player.inventorySystem.createItem(quest.rewards.itemId);
        if (item) {
          player.inventorySystem.addItem(item, quest.rewards.itemQty || 1);
        }
      }
    }

    if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
      this.uiManager.showCollectNotification(`🏆 Quest Completed: ${quest.title}! (+${quest.rewards.gold} Gold, +${quest.rewards.xp} XP)`);
    }

    if (this.audioManager && typeof this.audioManager.playVictoryFanfare === 'function') {
      this.audioManager.playVictoryFanfare();
    }

    this.updateSideQuestHUD();
    if (this.game && typeof this.game.autoSave === 'function') {
      this.game.autoSave(`Quest: ${quest.title}`);
    }
    return true;
  }

  abandonSideQuest(id, player = null) {
    const quest = this.sideQuests.get(id);
    if (!quest) return { success: false, reason: 'QUEST_NOT_FOUND' };
    if (quest.status === 'COMPLETED' || this.completedQuestIds.has(id)) {
      return { success: false, reason: 'CANNOT_ABANDON_COMPLETED', message: 'Completed quests cannot be abandoned.' };
    }
    if (quest.status === 'AVAILABLE') {
      return { success: false, reason: 'NOT_ACTIVE', message: 'Quest has not been accepted.' };
    }

    // Reset progress and return to AVAILABLE
    quest.abandon();

    // If retrieval quest, clear the retrieved item from player backpack
    if (player && player.inventorySystem && quest.type === 'retrieval' && quest.targetId) {
      const slotIdx = player.inventorySystem.slots.findIndex(s => s && s.item.id === quest.targetId);
      if (slotIdx >= 0) {
        player.inventorySystem.slots[slotIdx] = null;
        player.inventorySystem.notifyChange();
      }
    }

    if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
      this.uiManager.showCollectNotification(`⚠️ Abandoned Quest: ${quest.title}`);
    }
    this.updateSideQuestHUD();
    return { success: true, quest };
  }

  updateSideQuestHUD() {
    if (this.uiManager && typeof this.uiManager.updateSideQuestsHUD === 'function') {
      this.uiManager.updateSideQuestsHUD(this.getActiveSideQuests());
    }
  }

  setManagers({ collectibleManager, uiManager, environment, audioManager }) {
    if (collectibleManager) {
      this.collectibleManager = collectibleManager;
      if (typeof this.collectibleManager.onCollect === 'function') {
        this.collectibleManager.onCollect((item) => {
          if (item && item.type === 'item') {
            this.onItemCollected(item);
          } else {
            this.onCrystalCollected(item);
          }
        });
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

      // 4. Autosave checkpoint
      if (this.game && typeof this.game.autoSave === 'function') {
        this.game.autoSave('Ruins Portal Unlocked');
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

    // Check side quests with kill objectives (e.g. Grimfang)
    if (enemy) {
      for (const sideQuest of this.sideQuests.values()) {
        if (sideQuest.status === 'ACTIVE' && sideQuest.type === 'kill') {
          if (sideQuest.targetId === enemy.id || (enemy.name && enemy.name.toLowerCase().includes('grimfang'))) {
            sideQuest.updateProgress(1);
            if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
              this.uiManager.showCollectNotification(`⚔️ Side Quest Updated: ${sideQuest.title} (Target Defeated!)`);
            }
            this.updateSideQuestHUD();
          }
        }
      }
    }
  }

  onCrystalCollected(crystal) {
    if (this.currentQuest) {
      this.currentQuest.onCrystalCollected(crystal);
    }
    if (this.game && this.game.player && typeof this.game.player.addXP === 'function') {
      this.game.player.addXP(25);
    }
  }

  onItemCollected(item) {
    if (!item) return;
    for (const sideQuest of this.sideQuests.values()) {
      if (sideQuest.status === 'ACTIVE' && sideQuest.type === 'retrieval') {
        if (sideQuest.targetId === item.id) {
          sideQuest.updateProgress(1);
          if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
            this.uiManager.showCollectNotification(`🎒 Side Quest Updated: ${sideQuest.title} (Item Recovered!)`);
          }
          this.updateSideQuestHUD();
        }
      }
    }
  }

  update(deltaTime, playerPosition) {
    if (!this.currentQuest) return;

    // 1. Check discovery side quests
    if (playerPosition) {
      for (const sideQuest of this.sideQuests.values()) {
        if (sideQuest.status === 'ACTIVE' && sideQuest.type === 'discovery' && sideQuest.discoveryZone) {
          const zone = sideQuest.discoveryZone;
          const dist = Math.hypot(playerPosition.x - zone.x, playerPosition.z - zone.z);
          if (dist <= zone.radius) {
            sideQuest.updateProgress(1);
            if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
              this.uiManager.showCollectNotification(`🏛️ DISCOVERY: Sunken Grotto Shrine Discovered!`);
            }
            this.updateSideQuestHUD();
          }
        }
      }
    }

    // 2. Check main mission exit trigger zone if entrance is unlocked
    if (!this.currentQuest.isCompleted && this.currentQuest.isEntranceUnlocked && playerPosition) {
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

  getQuestSaveState() {
    const baseState = this.currentQuest ? this.currentQuest.getState() : {
      id: `stage-${this.currentLevelIndex}`,
      enemiesDefeated: 0,
      crystalsCollected: 0,
      isEntranceUnlocked: false,
      isCompleted: false,
      score: 0
    };

    return {
      ...baseState,
      sideQuests: Array.from(this.sideQuests.values()).map(q => q.getState()),
      completedQuestIds: Array.from(this.completedQuestIds)
    };
  }

  restoreQuestSaveState(state) {
    if (!state) return;

    if (this.currentQuest) {
      this.currentQuest.restoreState(state);
      this.isEntranceUnlocked = this.currentQuest.isEntranceUnlocked;

      if (this.isEntranceUnlocked) {
        if (this.currentLevelIndex === 0) {
          if (this.environment?.ruins && typeof this.environment.ruins.unlockEntrance === 'function') {
            this.environment.ruins.unlockEntrance();
          }
        } else {
          if (this.environment?.ruinsStage && typeof this.environment.ruinsStage.unlockSanctum === 'function') {
            this.environment.ruinsStage.unlockSanctum();
          }
        }
      }

      if (this.uiManager && typeof this.uiManager.updateQuestHUD === 'function') {
        this.uiManager.updateQuestHUD(this.currentQuest);
      }
    }

    // Restore completed quest IDs
    if (Array.isArray(state.completedQuestIds)) {
      this.completedQuestIds = new Set(state.completedQuestIds);
    } else {
      this.completedQuestIds = new Set();
    }

    // Restore side quests
    if (Array.isArray(state.sideQuests)) {
      state.sideQuests.forEach(savedSq => {
        const sq = this.sideQuests.get(savedSq.id);
        if (sq) {
          sq.restoreState(savedSq);
          if (sq.status === 'COMPLETED') {
            this.completedQuestIds.add(sq.id);
          }
        }
      });
      this.updateSideQuestHUD();
    }
  }
}
