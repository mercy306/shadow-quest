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
import { MountManager } from '../entities/MountManager.js';
import { PhotoModeManager } from '../systems/PhotoModeManager.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { loadSharedModel } from './ModelLoader.js';
import { PostProcessor } from './PostProcessor.js';
import { CinematicIntro } from './CinematicIntro.js';

export const GameState = {
  MAIN_MENU: 'MAIN_MENU',
  CINEMATIC_INTRO: 'CINEMATIC_INTRO',
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
    this.isSkillsOpen = false;
    this.isWorldMapOpen = false;
    this.npcManager = null;
    this.dialogueManager = null;
    this.merchantManager = null;
    this.mountManager = null;
    this.photoModeManager = null;
    this.cinematicIntro = null;
    this.networkManager = new NetworkManager(this);
    this.isCoopMode = false;
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
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.95;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;

      if (!this.container) {
        throw new Error('Game container element #game-container not found.');
      }
      this.container.appendChild(this.renderer.domElement);
      this.initStep = 'renderer';

      this.uiManager.setLoadingProgress(35, 'Building environment and physics world...');

      // 3. Physics World & Environment
      this.physicsWorld = new PhysicsWorld();
      this.environment = new Environment(this.scene, this.physicsWorld, this.renderer);
      this.initStep = 'environment';

      this.uiManager.setLoadingProgress(55, 'Initializing camera and controls...');

      // 4. Camera Manager with Pointer Lock
      this.cameraManager = new CameraManager();
      this.postProcessor = new PostProcessor(this.renderer, this.scene, this.cameraManager.getCamera());
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

      // 7. Parallel Preload of 3D Models
      this.uiManager.setLoadingProgress(65, 'Loading 3D world assets in parallel...');
      await Promise.allSettled([
        loadSharedModel('./models/Soldier.glb'),
        loadSharedModel('./models/EnemyGuardian.glb')
      ]);

      // 8. Player with Physics World & Audio
      this.uiManager.setLoadingProgress(80, 'Loading adventurer character...');
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
      this.questSystem.setGame(this);

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

      // 11c. Mount & Riding System
      this.mountManager = new MountManager(
        this.scene,
        this.physicsWorld,
        this.environment,
        this.audioManager,
        this.uiManager
      );
      this.combatSystem.setMountManager(this.mountManager);

      // Wire Player interaction key [E] to Mount, NPC dialogue and Region Passages
      this.player.onInteract(() => {
        // 1. Mount / Dismount
        if (this.mountManager) {
          if (this.mountManager.isPlayerMounted()) {
            this.mountManager.dismountPlayer(this.cameraManager);
            return true;
          }
          if (this.mountManager.isNearMount(this.player.getPosition(), 3.2)) {
            const check = this.mountManager.canMountPlayer(this.player);
            if (check.allowed) {
              this.mountManager.mountPlayer(this.player, this.cameraManager);
              return true;
            }
          }
        }

        // 2. NPC dialogue
        const npc = this.npcManager ? this.npcManager.getActiveInteractable() : null;
        if (npc) {
          this.openDialogue(npc);
          return true;
        }

        // 3. Region Passages
        if (this.levelManager && this.player) {
          const passage = this.levelManager.getNearbyPassage(this.player.getPosition());
          if (passage) {
            this.levelManager.transitionToPassage(passage);
            return true;
          }
        }
        return false;
      });

      // 12. Level Manager (manages stages, level switching, resets, score)
      this.uiManager.setLoadingProgress(92, 'Initializing level management system...');
      this.levelManager = new LevelManager(this);
      await this.levelManager.init();
      this.initStep = 'levelManager';
      this.combatSystem.setLevelManager(this.levelManager);

      // 12b. Setup World Map UI & Discovery Tracker
      this.uiManager.setupWorldMap(this);

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
        weatherManager: this.environment?.weatherManager,
        onSetGraphics: (preset) => this.setGraphicsQuality(preset)
      });

      // Wire Dynamic Weather Manager
      if (this.environment && this.environment.weatherManager) {
        this.environment.weatherManager.setManagers({
          audioManager: this.audioManager,
          uiManager: this.uiManager
        });
        if (this.enemyManager) {
          this.enemyManager.setWeatherManager(this.environment.weatherManager);
        }
      }

      // Complete Inventory & Equipment UI Setup
      this.uiManager.setupInventory({
        player: this.player,
        collectibleManager: this.collectibleManager,
        onToggleInventory: (open) => this.toggleInventory(open)
      });

      // Complete Skill Tree UI Setup
      this.uiManager.setupSkillTree({
        player: this.player,
        onToggleSkills: (open) => this.toggleSkills(open)
      });
      this.player.onToggleSkillsCallback = () => this.toggleSkills();

      // Apply initial saved settings
      this.saveManager.applySettings(this, this.saveManager.loadSettings());

      // Check if quicksave exists and update Continue button
      await this.refreshContinueButton();

      // 13b. Dedicated Photo Mode System
      this.photoModeManager = new PhotoModeManager(this);

      // 13c. Two-Player Co-Op Multiplayer System
      this.combatSystem.setNetworkManager(this.networkManager);
      this.collectibleManager.setNetworkManager(this.networkManager);
      this.uiManager.setupCoopModal(this.networkManager, this);

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

  startGame(playIntro = true) {
    if (playIntro && this.levelManager && this.levelManager.currentLevelIndex === 0) {
      this.playCinematicIntro();
      return;
    }
    this.launchDirectGameplay();
  }

  playCinematicIntro() {
    this.gameState = GameState.CINEMATIC_INTRO;
    this.isPaused = false;
    if (this.player) {
      this.player.isEnabled = false;
      this.player.teleport(0, -32.0, Math.PI, false, false);
      this.player.groundToTerrain(0, -32.0);
    }
    if (this.cameraManager) {
      this.cameraManager.setLockEnabled(false);
      this.cameraManager.exitPointerLock();
    }
    this.uiManager.hideMainMenu();

    if (this.audioManager) {
      this.audioManager.initAudioContext();
      this.audioManager.playAmbience(this.levelManager.currentLevelIndex);
    }

    if (this.cinematicIntro) {
      this.cinematicIntro.dispose();
    }

    this.cinematicIntro = new CinematicIntro(this.cameraManager.getCamera(), () => {
      this.cinematicIntro = null;
      this.launchDirectGameplay();
    });
    this.cinematicIntro.start();
  }

  launchDirectGameplay() {
    this.gameState = GameState.PLAYING;
    this.isPaused = false;
    if (this.player) {
      this.player.isEnabled = true;
      if (this.levelManager && this.levelManager.currentLevelIndex === 0 && this.player.getPosition().z < -40) {
        this.player.teleport(0, -32.0, Math.PI, true, false);
        this.player.groundToTerrain(0, -32.0);
      }
    }
    if (this.cameraManager) {
      this.cameraManager.setLockEnabled(true);
      if (this.player) {
        this.cameraManager.snapToTarget(this.player);
      }
      this.cameraManager.requestPointerLock();
    }
    this.uiManager.hideMainMenu();

    // Start audio on user gesture
    if (this.audioManager) {
      this.audioManager.initAudioContext();
      this.audioManager.playAmbience(this.levelManager.currentLevelIndex);
    }

    this.clock.getDelta();
  }

  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      // Inventory toggle with 'I' or 'Tab'
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        if (this.gameState === GameState.PLAYING || this.isInventoryOpen) {
          this.toggleInventory();
        }
      } else if (e.code === 'KeyK') {
        // Skill Tree toggle with 'K'
        e.preventDefault();
        if (this.gameState === GameState.PLAYING || this.isSkillsOpen) {
          this.toggleSkills();
        }
      } else if (e.code === 'KeyM') {
        // World Map toggle with 'M'
        e.preventDefault();
        if (this.gameState === GameState.PLAYING || this.isWorldMapOpen) {
          this.toggleWorldMap();
        }
      } else if (e.code === 'KeyP') {
        // Photo Mode toggle with 'P'
        e.preventDefault();
        this.togglePhotoMode();
      } else if (e.code === 'KeyH') {
        // Whistle for Mount / Recovery with 'H'
        if (this.gameState === GameState.PLAYING && this.mountManager && this.player) {
          this.mountManager.whistleMount(this.player);
        }
      } else if (e.code === 'Escape') {
        if (this.photoModeManager && this.photoModeManager.isActive) {
          this.photoModeManager.exit();
        } else if (this.dialogueManager && this.dialogueManager.isDialogueActive()) {
          this.closeDialogue();
        } else if (this.merchantManager && this.merchantManager.isShopOpen()) {
          this.closeShop();
        } else if (this.isWorldMapOpen) {
          this.toggleWorldMap(false);
        } else if (this.isSkillsOpen) {
          this.toggleSkills(false);
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

  toggleSkills(forceState = null) {
    if (this.gameState === GameState.MAIN_MENU || this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      return;
    }

    const shouldOpen = (forceState !== null) ? forceState : !this.isSkillsOpen;
    if (shouldOpen === this.isSkillsOpen) return;

    this.isSkillsOpen = shouldOpen;

    if (shouldOpen) {
      if (this.isInventoryOpen) this.toggleInventory(false);
      if (this.isWorldMapOpen) this.toggleWorldMap(false);
      this.player.isEnabled = false;
      this.cameraManager.setLockEnabled(false);
      this.cameraManager.exitPointerLock();
      this.uiManager.openSkillTree();
    } else {
      this.uiManager.closeSkillTree();
      if (this.gameState === GameState.PLAYING && !this.isPaused && !this.isInventoryOpen && !this.isWorldMapOpen) {
        this.player.isEnabled = true;
        this.cameraManager.setLockEnabled(true);
        this.clock.getDelta();
        this.cameraManager.requestPointerLock();
      }
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
      if (this.isSkillsOpen) this.toggleSkills(false);
      if (this.isWorldMapOpen) this.toggleWorldMap(false);
      // Pause single-player inputs and unlock mouse for inventory
      this.player.isEnabled = false;
      this.cameraManager.setLockEnabled(false);
      this.cameraManager.exitPointerLock();
      this.uiManager.openInventory();
    } else {
      this.uiManager.closeInventory();
      if (this.gameState === GameState.PLAYING && !this.isPaused && !this.isSkillsOpen && !this.isWorldMapOpen) {
        this.player.isEnabled = true;
        this.cameraManager.setLockEnabled(true);
        this.clock.getDelta();
        this.cameraManager.requestPointerLock();
      }
    }
  }

  toggleWorldMap(forceState = null) {
    if (this.gameState === GameState.MAIN_MENU || this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      return;
    }

    const shouldOpen = (forceState !== null) ? forceState : !this.isWorldMapOpen;
    if (shouldOpen === this.isWorldMapOpen) return;

    this.isWorldMapOpen = shouldOpen;

    if (shouldOpen) {
      if (this.isSkillsOpen) this.toggleSkills(false);
      if (this.isInventoryOpen) this.toggleInventory(false);
      this.player.isEnabled = false;
      this.cameraManager.setLockEnabled(false);
      this.cameraManager.exitPointerLock();
      this.uiManager.openWorldMap(this);
    } else {
      this.uiManager.closeWorldMap();
      if (this.gameState === GameState.PLAYING && !this.isPaused && !this.isSkillsOpen && !this.isInventoryOpen) {
        this.player.isEnabled = true;
        this.cameraManager.setLockEnabled(true);
        this.clock.getDelta();
        this.cameraManager.requestPointerLock();
      }
    }
  }

  togglePhotoMode() {
    if (this.gameState === GameState.MAIN_MENU || this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      return;
    }

    if (this.isPaused) {
      this.resumeGame();
    }
    if (this.isSkillsOpen) this.toggleSkills(false);
    if (this.isInventoryOpen) this.toggleInventory(false);
    if (this.isWorldMapOpen) this.toggleWorldMap(false);
    if (this.dialogueManager && this.dialogueManager.isDialogueActive()) this.closeDialogue();
    if (this.merchantManager && this.merchantManager.isShopOpen()) this.closeShop();

    if (this.photoModeManager) {
      this.photoModeManager.toggle();
    }
  }

  togglePause() {
    if (this.gameState === GameState.MAIN_MENU || this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      return;
    }

    if (this.photoModeManager && this.photoModeManager.isActive) {
      this.photoModeManager.exit();
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
        () => this.loadSavedGame(),
        () => this.togglePhotoMode()
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
      const hasAny = await this.saveManager.hasAnySave();
      let metaText = '';
      if (hasAny) {
        const latestSlot = await this.saveManager.getLatestSaveSlot();
        const meta = await this.saveManager.getSaveMetadata(latestSlot);
        if (meta) {
          metaText = `${meta.stageName || 'Stage'} • ${meta.score || 0} PTS`;
        }
      }
      this.uiManager.setContinueButtonEnabled(hasAny, metaText);
      return hasAny;
    } catch (e) {
      this.uiManager.setContinueButtonEnabled(false);
      return false;
    }
  }

  async startNewGame(force = false) {
    this.isCoopMode = false;
    if (this.networkManager && this.networkManager.isInRoom()) {
      this.networkManager.leaveRoom();
    }
    if (!force && this.saveManager && await this.saveManager.hasAnySave()) {
      if (this.uiManager && typeof this.uiManager.showConfirmation === 'function') {
        const confirmed = await this.uiManager.showConfirmation(
          'START A NEW JOURNEY?',
          'An existing saved adventure was discovered. Embarking on a new game will reset active progress to Stage 1. Are you sure you wish to proceed?',
          'EMBARK ON NEW QUEST',
          true
        );
        if (!confirmed) return;
      }
    }

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
    this.isCoopMode = false;
    if (this.networkManager && this.networkManager.isInRoom()) {
      this.networkManager.leaveRoom();
    }
    const slotToLoad = await this.saveManager.getLatestSaveSlot();
    const hasSave = await this.saveManager.hasSave(slotToLoad);
    if (!hasSave) {
      console.warn('[Game] No save file found, starting new adventure.');
      this.startNewGame(true);
      return;
    }

    const result = await this.saveManager.loadGame(this, slotToLoad);
    if (result.success) {
      this.resumeFromMenuOrEnd();
      // Start audio
      if (this.audioManager) {
        this.audioManager.initAudioContext();
        this.audioManager.playAmbience(this.levelManager.currentLevelIndex);
      }
    } else {
      console.error('[Game] Error loading save, falling back to new adventure:', result.reason);
      this.startNewGame(true);
    }
  }

  async startCoopGame(roomCode, isHost = true) {
    this.isCoopMode = true;
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
      // Stagger spawn positions so Host and Guest don't overlap
      const spawnX = isHost ? 0.0 : 2.5;
      const spawnZ = 2.0;
      this.player.position.set(spawnX, 0.8, spawnZ);
      this.player.groundToTerrain(spawnX, spawnZ);
    }
    if (this.questSystem) {
      this.questSystem.initSideQuests();
      this.questSystem.updateSideQuestHUD();
    }
    this.startGame();
    if (this.networkManager) {
      this.networkManager.updateHUDStatus();
    }
  }

  leaveCoopGame() {
    this.isCoopMode = false;
    if (this.networkManager) {
      this.networkManager.leaveRoom();
      this.networkManager.updateHUDStatus();
    }
    if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
      this.uiManager.showCollectNotification('Returned to Single Player Mode.');
    }
  }

  async saveCurrentGame(slot = QUICK_SAVE_SLOT, options = {}) {
    if (this.isCoopMode) {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification('Personal save data is isolated from transient Co-Op session.');
      }
      return { success: false, reason: 'Saving disabled during co-op session' };
    }
    return await this.saveManager.saveGame(this, slot, options);
  }

  async loadSavedGame(slot = QUICK_SAVE_SLOT) {
    const result = await this.saveManager.loadGame(this, slot);
    if (result.success) {
      this.resumeGame();
    }
    return result;
  }

  async autoSave(reason = 'Checkpoint reached') {
    if (this.isCoopMode) return;
    if (!this.saveManager) return;
    const canSaveRes = this.saveManager.canSave(this);
    if (!canSaveRes.allowed) {
      return;
    }

    try {
      const res = await this.saveManager.saveGame(this, 'autosave', { autosaveReason: reason });
      if (res && res.success) {
        await this.refreshContinueButton();
      }
    } catch (e) {
      console.warn('[Game] Non-fatal autosave issue:', e);
    }
  }

  setGraphicsQuality(preset) {
    this.currentGraphicsPreset = preset;
    if (this.environment && this.environment.weatherManager) {
      this.environment.weatherManager.setGraphicsQuality(preset);
    }
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

    if (this.postProcessor) {
      this.postProcessor.setSize(width, height);
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
    const deltaTime = Math.min(rawDelta, 0.05);

    this.update(deltaTime);
    this.render();
  };

  update(deltaTime) {
    // 0. Dedicated Photo Mode: free camera exploration while gameplay simulation is safely frozen
    if (this.photoModeManager && this.photoModeManager.isActive) {
      this.photoModeManager.update(deltaTime);
      return;
    }

    // 0b. Cinematic CGI Intro
    if (this.gameState === GameState.CINEMATIC_INTRO) {
      if (this.cinematicIntro) {
        this.cinematicIntro.update(deltaTime);
      }
      if (this.environment) {
        this.environment.update(deltaTime);
      }
      if (this.vfxManager) {
        this.vfxManager.update(deltaTime);
      }
      return;
    }

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

    // 2. Paused, Inventory, Skills, Map, Dialogue, Shop, Game Over, or Victory: hold static entity states, keep ambient world breathing
    const isModalOpen = this.isInventoryOpen ||
      this.isSkillsOpen ||
      this.isWorldMapOpen ||
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
    let activeNPC = null;
    if (this.npcManager && this.player) {
      this.npcManager.update(deltaTime, this.player.getPosition());
      activeNPC = this.npcManager.getActiveInteractable();
      if (activeNPC) {
        this.uiManager.showInteractionPrompt(`[E] Talk to ${activeNPC.name}`);
      }
    }

    // Passages and Landmark Discovery tracking
    if (this.levelManager && this.player) {
      const pPos = this.player.getPosition();
      const nearbyPassage = this.levelManager.getNearbyPassage(pPos);
      if (!activeNPC && nearbyPassage) {
        this.uiManager.showInteractionPrompt(nearbyPassage.prompt || `[E] Enter ${nearbyPassage.name}`);
      }

      const landmark = this.levelManager.getNearbyLandmark(pPos);
      if (landmark && !this.player.discoveredLocations.includes(landmark.id)) {
        this.player.discoveredLocations.push(landmark.id);
        if (typeof this.player.addXP === 'function') {
          this.player.addXP(landmark.xpReward || 30);
        }
        if (this.uiManager && typeof this.uiManager.showDiscoveryBanner === 'function') {
          this.uiManager.showDiscoveryBanner(landmark.name, 'LANDMARK DISCOVERED');
        }
      }
    }

    // Mount & Riding Update
    if (this.mountManager) {
      this.mountManager.update(deltaTime, this.player, this.cameraManager);
      if (this.mountManager.isPlayerMounted()) {
        this.uiManager.showInteractionPrompt('[E] Dismount • [W/A/S/D] Steer • [Shift] Gallop');
      } else if (this.mountManager.isNearMount(this.player?.getPosition(), 3.2)) {
        const check = this.mountManager.canMountPlayer(this.player);
        if (check.allowed && !activeNPC) {
          this.uiManager.showInteractionPrompt(`[E] Mount ${this.mountManager.getMountName()}`);
        }
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
      this.environment.update(deltaTime, this.player ? this.player.getPosition() : null);
    }

    // Enemy AI & Hostile Guardians
    if (this.enemyManager && this.player) {
      this.enemyManager.update(deltaTime, this.player, true);
    }

    // Stealth status & awareness HUD update
    if (this.uiManager && this.player && this.enemyManager) {
      this.uiManager.updateStealthIndicator(this.player, this.enemyManager.getEnemies());
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

    // Co-Op Network Manager & Remote Partner interpolation
    if (this.networkManager) {
      this.networkManager.update(deltaTime);

      // Check stage exit portal step-in for co-op
      if (this.isCoopMode && this.player && this.questSystem && this.questSystem.exitLocation) {
        const quest = this.questSystem.getCurrentQuest();
        if (quest && quest.isEntranceUnlocked) {
          const pos = this.player.getPosition();
          const dist = Math.hypot(pos.x - this.questSystem.exitLocation.x, pos.z - this.questSystem.exitLocation.z);
          if (dist <= 3.2) {
            this.networkManager.sendPortalEnterIntent();
          }
        }
      }
    }
  }

  render() {
    if (this.renderer && this.scene && this.cameraManager) {
      const cam = this.cameraManager.getCamera();
      if (this.postProcessor) {
        this.postProcessor.render(cam);
      } else {
        this.renderer.render(this.scene, cam);
      }
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
    if (this.cinematicIntro) {
      this.cinematicIntro.dispose();
      this.cinematicIntro = null;
    }
    if (this.postProcessor) {
      this.postProcessor.dispose();
      this.postProcessor = null;
    }
    if (this.audioManager) {
      this.audioManager.stopAmbience();
    }
  }
}
