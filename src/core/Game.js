import * as THREE from 'three';
import { Environment } from '../environment/Environment.js';
import { CameraManager } from './CameraManager.js';
import { Player } from '../entities/Player.js';
import { EnemyManager } from '../entities/EnemyManager.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { AudioManager } from '../audio/AudioManager.js';
import { UIManager } from '../ui/UIManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { CollectibleManager } from '../systems/CollectibleManager.js';
import { LevelManager } from './LevelManager.js';
import { VFXManager } from '../vfx/VFXManager.js';
import { SaveManager, QUICK_SAVE_SLOT } from '../systems/SaveManager.js';
import { NPCManager } from '../systems/NPCManager.js';
import { DialogueManager } from '../systems/DialogueManager.js';
import { MerchantManager } from '../systems/MerchantManager.js';

export const GameState = {
  MAIN_MENU: 'MAIN_MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

export class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.uiManager = new UIManager();
    this.saveManager = new SaveManager();
    this.clock = new THREE.Clock();
    this.isRunning = false;
    this.isPaused = false;
    this.isInventoryOpen = false;
    this.npcManager = null;
    this.dialogueManager = null;
    this.merchantManager = null;
    this.gameState = GameState.MAIN_MENU;
    this.currentGraphicsPreset = 'high';
  }

  async init() {
    try {
      this.initStep = 'start';
      this.uiManager.setLoadingProgress(15, 'Checking WebGL capabilities...');

      // 1. Scene setup
      this.scene = new THREE.Scene();
      this.initStep = 'scene';

      // 2. Renderer setup with realistic modern post-processing/lighting defaults
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;

      if (!this.container) {
        throw new Error('Game container element #game-container not found.');
      }
      this.container.appendChild(this.renderer.domElement);
      this.initStep = 'renderer';

      this.uiManager.setLoadingProgress(35, 'Building environment and physics world...');

      // 3. Physics World & Environment
      this.physicsWorld = new PhysicsWorld();
      this.environment = new Environment(this.scene, this.physicsWorld);
      this.initStep = 'environment';

      this.uiManager.setLoadingProgress(55, 'Initializing camera and controls...');

      // 4. Camera Manager with Pointer Lock
      this.cameraManager = new CameraManager();
      this.cameraManager.setupPointerLock(this.renderer.domElement);
      this.cameraManager.setLockEnabled(false); // Initially disabled on main menu
      this.cameraManager.onLockChange((isLocked) => {
        this.uiManager.updatePointerLockHint(isLocked);
      });

      // 5. Audio Manager
      this.audioManager = new AudioManager(this.cameraManager.getCamera());
      this.audioManager.init();

      // 6. Visual Effects Manager (Particles, Trails, Flashes)
      this.vfxManager = new VFXManager(this.scene);
      this.initStep = 'vfx';

      // 7. Player with Physics World & Audio
      this.uiManager.setLoadingProgress(70, 'Loading adventurer character & animations...');
      this.player = new Player(this.scene, this.environment, this.physicsWorld);
      this.player.setAudioManager(this.audioManager);
      this.player.setVFXManager(this.vfxManager);
      this.player.setUIManager(this.uiManager);
      await this.player.init();
      this.player.isEnabled = false; // Disabled while in main menu
      this.player.onDeath(() => this.onGameOver());
      this.initStep = 'player';

      this.uiManager.setLoadingProgress(85, 'Loading gameplay subsystems...');

      // 8. Enemy Manager & Hostile Guardians
      this.uiManager.setLoadingProgress(80, 'Summoning forest ruins guardians...');
      this.enemyManager = new EnemyManager(this.scene, this.physicsWorld);

      // 9. Collectible System & Magical Crystals
      this.collectibleManager = new CollectibleManager(this.scene, this.physicsWorld);

      // 10. Quest System (wired to collectibles, UI, ruins, audio)
      this.questSystem = new QuestSystem(
        this.collectibleManager,
        this.uiManager,
        this.environment,
        this.audioManager
      );

      // 11. Combat System (wired to player, enemies, questSystem, audio, UI, VFX)
      this.combatSystem = new CombatSystem(
        this.player,
        this.enemyManager,
        this.questSystem,
        this.audioManager,
        this.uiManager,
        this.vfxManager
      );
      this.combatSystem.init();
      this.initStep = 'combat';

      // 11b. NPC, Dialogue & Merchant Subsystems
      this.npcManager = new NPCManager(this.scene, this.physicsWorld, this.uiManager);
      this.merchantManager = new MerchantManager(this.uiManager, this.audioManager);
      this.dialogueManager = new DialogueManager(this.uiManager, this.questSystem, this.merchantManager, this.audioManager);
      this.dialogueManager.player = this.player;
      this.merchantManager.player = this.player;

      this.uiManager.setupDialogue(this.dialogueManager);
      this.uiManager.setupMerchant(this.merchantManager);
      this.combatSystem.setNPCManager(this.npcManager);

      // Wire Player interaction key [E] to NPC dialogue
      this.player.onInteract(() => {
        const npc = this.npcManager ? this.npcManager.getActiveInteractable() : null;
        if (npc) {
          this.openDialogue(npc);
          return true;
        }
        return false;
      });

      // 12. Level Manager (manages stages, level switching, resets, score)
      this.uiManager.setLoadingProgress(92, 'Initializing level management system...');
      this.levelManager = new LevelManager(this);
      await this.levelManager.init();
      this.initStep = 'levelManager';

      // Auto-save on collectible pickups
      if (this.collectibleManager) {
        this.collectibleManager.onCollect(() => {
          if (this.gameState === GameState.PLAYING && !this.levelManager.isTransitioning) {
            this.saveManager.saveGame(this, QUICK_SAVE_SLOT);
          }
        });
      }

      // 13. UI Configuration (Main Menu, Settings, & Persistent Saves)
      this.uiManager.setupMainMenu({
        onPlay: () => this.startNewGame(),
        onContinue: () => this.continueSavedGame(),
        onOpenSettings: () => {}
      });

      this.uiManager.setupSettings({
        audioManager: this.audioManager,
        cameraManager: this.cameraManager,
        saveManager: this.saveManager,
        onSetGraphics: (preset) => this.setGraphicsQuality(preset)
      });

      // Complete Inventory & Equipment UI Setup
      this.uiManager.setupInventory({
        player: this.player,
        onToggleInventory: (open) => this.toggleInventory(open)
      });

      // Apply initial saved settings
      this.saveManager.applySettings(this, this.saveManager.loadSettings());

      // Check if quicksave exists and update Continue button
      await this.refreshContinueButton();

      // 14. Pause & window resize listeners
      this.setupInputListeners();
      this.setupResizeHandler();

      this.uiManager.setLoadingProgress(100, 'World ready!');

      // Start game loop and show Main Menu
      this.uiManager.showMainMenu();
      this.start();
      this.uiManager.hideLoadingScreen(400);
      this.initStep = 'complete';

    } catch (error) {
      console.error('Fatal initialization error in Shadow Quest:', error);
      this.uiManager.showError(`Failed to initialize game engine: ${error.message}`);
      throw error;
    }
  }

  startGame() {
    this.gameState = GameState.PLAYING;
    this.isPaused = false;
    this.player.isEnabled = true;
    this.cameraManager.setLockEnabled(true);
    this.uiManager.hideMainMenu();

    // Start audio on user gesture
    if (this.audioManager) {
      this.audioManager.initAudioContext();
      this.audioManager.playAmbience(this.levelManager.currentLevelIndex);
    }

    this.clock.getDelta();
    if (this.cameraManager && this.player) {
      this.cameraManager.snapToTarget(this.player);
      this.cameraManager.requestPointerLock();
    }
  }

  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      // Inventory toggle with 'I' or 'Tab'
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        if (this.gameState === GameState.PLAYING || this.isInventoryOpen) {
          this.toggleInventory();
        }
      } else if (e.code === 'Escape') {
        if (this.dialogueManager && this.dialogueManager.isDialogueActive()) {
          this.closeDialogue();
        } else if (this.merchantManager && this.merchantManager.isShopOpen()) {
          this.closeShop();
        } else if (this.isInventoryOpen) {
          this.toggleInventory(false);
        } else {
          this.togglePause();
        }
      }
    });
  }

  openDialogue(npc) {
    if (!npc) return;
    this.player.isEnabled = false;
    this.cameraManager.setLockEnabled(false);
    this.cameraManager.exitPointerLock();
    this.dialogueManager.startDialogue(npc, this.player);
  }

  closeDialogue() {
    this.dialogueManager.closeDialogue();
    if (!this.merchantManager.isShopOpen() && this.gameState === GameState.PLAYING && !this.isPaused && !this.isInventoryOpen) {
      this.player.isEnabled = true;
      this.cameraManager.setLockEnabled(true);
      this.cameraManager.requestPointerLock();
    }
  }

  openShop(npc) {
    if (!npc) return;
    this.player.isEnabled = false;
    this.cameraManager.setLockEnabled(false);
    this.cameraManager.exitPointerLock();
    this.merchantManager.openShop(npc, this.player);
  }

  closeShop() {
    this.merchantManager.closeShop();
    if (!this.dialogueManager.isDialogueActive() && this.gameState === GameState.PLAYING && !this.isPaused && !this.isInventoryOpen) {
      this.player.isEnabled = true;
      this.cameraManager.setLockEnabled(true);
      this.cameraManager.requestPointerLock();
    }
  }

  toggleInventory(forceState = null) {
    if (this.gameState === GameState.MAIN_MENU || this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      return;
    }

    const shouldOpen = (forceState !== null) ? forceState : !this.isInventoryOpen;
    if (shouldOpen === this.isInventoryOpen) return;

    this.isInventoryOpen = shouldOpen;

    if (shouldOpen) {
      // Pause single-player inputs and unlock mouse for inventory
      this.player.isEnabled = false;
      this.cameraManager.setLockEnabled(false);
      this.cameraManager.exitPointerLock();
      this.uiManager.openInventory();
    } else {
      this.uiManager.closeInventory();
      if (this.gameState === GameState.PLAYING && !this.isPaused) {
        this.player.isEnabled = true;
        this.cameraManager.setLockEnabled(true);
        this.clock.getDelta();
        this.cameraManager.requestPointerLock();
      }
    }
  }

  togglePause() {
    if (this.gameState === GameState.MAIN_MENU || this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      return;
    }

    if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED;
      this.isPaused = true;
      this.player.isEnabled = false;
      this.cameraManager.setLockEnabled(false);
      this.cameraManager.exitPointerLock();

      this.uiManager.setPaused(
        true,
        () => this.resumeGame(),
        () => this.restartLevel(),
        () => {},
        () => this.returnToMainMenu(),
        () => this.saveCurrentGame(),
        () => this.loadSavedGame()
      );
    } else if (this.gameState === GameState.PAUSED) {
      this.resumeGame();
    }
  }

  resumeGame() {
    if (this.gameState !== GameState.PAUSED) return;
    this.gameState = GameState.PLAYING;
    this.isPaused = false;
    this.player.isEnabled = true;
    this.cameraManager.setLockEnabled(true);
    this.uiManager.setPaused(false);
    this.clock.getDelta();
    this.cameraManager.requestPointerLock();
  }

  async restartLevel() {
    this.uiManager.hidePause();
    this.uiManager.hideGameOver();
    await this.levelManager.restartCurrentLevel();
    this.resumeFromMenuOrEnd();
  }

  resumeFromMenuOrEnd() {
    this.gameState = GameState.PLAYING;
    this.isPaused = false;
    this.player.isEnabled = true;
    this.cameraManager.setLockEnabled(true);
    this.uiManager.hideMainMenu();
    this.uiManager.hidePause();
    this.uiManager.hideGameOver();
    this.uiManager.hideVictoryScreen();
    this.clock.getDelta();
    this.cameraManager.requestPointerLock();
  }

  onGameOver() {
    if (this.gameState === GameState.GAME_OVER) return;
    this.gameState = GameState.GAME_OVER;
    this.player.isEnabled = false;
    this.cameraManager.setLockEnabled(false);
    this.cameraManager.exitPointerLock();

    this.uiManager.showGameOver({
      onRetry: () => this.restartLevel(),
      onMainMenu: () => this.returnToMainMenu()
    });
  }

  onVictory() {
    this.gameState = GameState.VICTORY;
    this.player.isEnabled = false;
    this.cameraManager.setLockEnabled(false);
    this.cameraManager.exitPointerLock();
  }

  async returnToMainMenu() {
    this.gameState = GameState.MAIN_MENU;
    this.isPaused = false;
    this.isInventoryOpen = false;
    if (this.dialogueManager) this.dialogueManager.closeDialogue();
    if (this.merchantManager) this.merchantManager.closeShop();
    this.player.isEnabled = false;
    this.cameraManager.setLockEnabled(false);
    this.cameraManager.exitPointerLock();

    this.uiManager.hidePause();
    this.uiManager.closeInventory();
    this.uiManager.closeDialogueModal();
    this.uiManager.closeMerchantModal();
    this.uiManager.hideGameOver();
    this.uiManager.hideVictoryScreen();
    this.uiManager.showMainMenu();

    await this.refreshContinueButton();

    // Reload stage 0 in menu mode
    await this.levelManager.loadLevel(0);
    this.player.isEnabled = false;
  }

  async refreshContinueButton() {
    try {
      const hasSave = await this.saveManager.hasSave(QUICK_SAVE_SLOT);
      let metaText = '';
      if (hasSave) {
        const meta = await this.saveManager.getSaveMetadata(QUICK_SAVE_SLOT);
        if (meta) {
          metaText = `${meta.stageName || 'Stage'} • ${meta.score || 0} PTS`;
        }
      }
      this.uiManager.setContinueButtonEnabled(hasSave, metaText);
      return hasSave;
    } catch (e) {
      this.uiManager.setContinueButtonEnabled(false);
      return false;
    }
  }

  async startNewGame() {
    this.levelManager.stageScores = [0, 0];
    this.levelManager.cumulativeScore = 0;
    if (this.levelManager.currentLevelIndex !== 0) {
      await this.levelManager.loadLevel(0, true);
    }
    if (this.player) {
      this.player.level = 1;
      this.player.xp = 0;
      this.player.gold = 150;
      this.player.unlockedSkills = ['sword_slash', 'fast_sprint', 'ground_roll'];
      this.player.discoveredLocations = ['dark-forest'];
      if (this.player.inventorySystem) {
        this.player.inventorySystem.slots = new Array(this.player.inventorySystem.capacity).fill(null);
        this.player.inventorySystem.gold = 150;
        this.player.inventorySystem.initDefaultLoadout();
        this.player.inventory = this.player.inventorySystem.slots.filter(Boolean);
      }
      this.player.recalculateStats();
      this.player.health = this.player.maxHealth;
    }
    if (this.questSystem) {
      this.questSystem.initSideQuests();
      this.questSystem.updateSideQuestHUD();
    }
    if (this.uiManager) {
      this.uiManager.updateGold(150);
    }
    this.startGame();
  }

  async continueSavedGame() {
    const hasSave = await this.saveManager.hasSave(QUICK_SAVE_SLOT);
    if (!hasSave) {
      console.warn('[Game] No save file found, starting new adventure.');
      this.startNewGame();
      return;
    }

    const result = await this.saveManager.loadGame(this, QUICK_SAVE_SLOT);
    if (result.success) {
      this.resumeFromMenuOrEnd();
      // Start audio
      if (this.audioManager) {
        this.audioManager.initAudioContext();
        this.audioManager.playAmbience(this.levelManager.currentLevelIndex);
      }
    } else {
      console.error('[Game] Error loading save, falling back to new adventure:', result.reason);
      this.startNewGame();
    }
  }

  async saveCurrentGame() {
    return await this.saveManager.saveGame(this, QUICK_SAVE_SLOT);
  }

  async loadSavedGame() {
    const result = await this.saveManager.loadGame(this, QUICK_SAVE_SLOT);
    if (result.success) {
      this.resumeGame();
    }
    return result;
  }

  setGraphicsQuality(preset) {
    this.currentGraphicsPreset = preset;
    if (!this.renderer) return;

    switch (preset) {
      case 'high':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
      case 'medium':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        break;
      case 'low':
        this.renderer.setPixelRatio(1.0);
        this.renderer.shadowMap.enabled = false;
        break;
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => this.onResize(), false);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (this.cameraManager) {
      this.cameraManager.onResize(width, height);
    }

    if (this.renderer) {
      this.renderer.setSize(width, height);
      const ratio = this.currentGraphicsPreset === 'low' ? 1.0 : (this.currentGraphicsPreset === 'medium' ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2));
      this.renderer.setPixelRatio(ratio);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  loop = () => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.loop);

    const rawDelta = this.clock.getDelta();
    const deltaTime = Math.min(rawDelta, 0.1);

    this.update(deltaTime);
    this.render();
  };

  update(deltaTime) {
    // 1. Main menu mode: cinematic camera orbit & ambient world animation
    if (this.gameState === GameState.MAIN_MENU) {
      if (this.cameraManager) {
        this.cameraManager.updateMenuOrbit(deltaTime, new THREE.Vector3(0, 1.5, 0));
      }
      if (this.environment) {
        this.environment.update(deltaTime);
      }
      if (this.enemyManager) {
        this.enemyManager.update(deltaTime, null, false);
      }
      if (this.collectibleManager) {
        this.collectibleManager.update(deltaTime, null, this.audioManager, this.uiManager, this.vfxManager);
      }
      if (this.vfxManager) {
        this.vfxManager.update(deltaTime);
      }
      return;
    }

    // 2. Paused, Inventory, Dialogue, Shop, Game Over, or Victory: hold static entity states, keep ambient world breathing
    const isModalOpen = this.isInventoryOpen ||
      (this.dialogueManager && this.dialogueManager.isDialogueActive()) ||
      (this.merchantManager && this.merchantManager.isShopOpen());

    if (this.gameState === GameState.PAUSED || isModalOpen || this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      if (this.environment) {
        this.environment.update(deltaTime);
      }
      if (this.vfxManager) {
        this.vfxManager.update(deltaTime);
      }
      return;
    }

    // 3. Active Playing state: full interactive simulation
    // NPCs update & interaction tracking
    if (this.npcManager && this.player) {
      this.npcManager.update(deltaTime, this.player.getPosition());
      const activeNPC = this.npcManager.getActiveInteractable();
      if (activeNPC) {
        this.uiManager.showInteractionPrompt(`[E] Talk to ${activeNPC.name}`);
      }
    }

    // Player movement & actions
    if (this.player) {
      this.player.update(deltaTime, this.cameraManager);
    }

    // Camera follow & collision avoidance
    if (this.cameraManager && this.player) {
      this.cameraManager.update(this.player, deltaTime, this.environment, this.physicsWorld);
    }

    // Environment dynamics
    if (this.environment) {
      this.environment.update(deltaTime);
    }

    // Enemy AI & Hostile Guardians
    if (this.enemyManager && this.player) {
      this.enemyManager.update(deltaTime, this.player.getPosition(), true);
    }

    // Collectibles update & pickup detection
    if (this.collectibleManager && this.player) {
      this.collectibleManager.update(deltaTime, this.player.getPosition(), this.audioManager, this.uiManager, this.vfxManager, this.player);
    }

    // Combat & Quest logic
    if (this.combatSystem) {
      this.combatSystem.update(deltaTime);
    }
    if (this.questSystem && this.player) {
      this.questSystem.update(deltaTime, this.player.getPosition());
    }

    // Visual Effects (particles, sparks, trails)
    if (this.vfxManager) {
      this.vfxManager.update(deltaTime);
    }
  }

  render() {
    if (this.renderer && this.scene && this.cameraManager) {
      this.renderer.render(this.scene, this.cameraManager.getCamera());
    }
  }

  dispose() {
    this.isRunning = false;
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.vfxManager) {
      this.vfxManager.dispose();
    }
    if (this.audioManager) {
      this.audioManager.stopAmbience();
    }
  }
}
