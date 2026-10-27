import * as THREE from 'three';
import { MountCreature } from './MountCreature.js';

/**
 * MountManager
 * Manages player mount lifecycle, mounting/dismounting transitions,
 * cross-region persistence, recovery whistle, and riding camera coordination.
 */
export class MountManager {
  constructor(scene, physicsWorld = null, environment = null, audioManager = null, uiManager = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.environment = environment;
    this.audioManager = audioManager;
    this.uiManager = uiManager;

    this.mount = null;
    this.currentLevelIndex = 0;
    this.hasWhistleUnlocked = true;

    // Default mount spawn location in Stage 0 (The Dark Forest) near the trailhead
    this.defaultSpawn = {
      stageIndex: 0,
      x: 8.0,
      y: 0.0,
      z: -12.0,
      rotationY: Math.PI * 0.8
    };

    this.init(0);
  }

  setPhysicsWorld(physicsWorld) {
    this.physicsWorld = physicsWorld;
    if (this.mount) {
      this.mount.physicsWorld = physicsWorld;
    }
  }

  setEnvironment(environment) {
    this.environment = environment;
    if (this.mount) {
      this.mount.environment = environment;
    }
  }

  setManagers({ audioManager, uiManager }) {
    if (audioManager) this.audioManager = audioManager;
    if (uiManager) this.uiManager = uiManager;
  }

  /**
   * Initializes or loads the mount into the world
   */
  init(levelIndex = 0) {
    this.currentLevelIndex = levelIndex;

    // If mount doesn't exist yet, spawn the initial Shadow Steed
    if (!this.mount) {
      this.mount = new MountCreature(this.scene, this.physicsWorld, this.environment, {
        id: 'mount-shadow-steed',
        name: 'Shadow Steed',
        stageIndex: this.defaultSpawn.stageIndex,
        x: this.defaultSpawn.x,
        y: this.defaultSpawn.y,
        z: this.defaultSpawn.z,
        rotationY: this.defaultSpawn.rotationY
      });
    }

    // Update visibility based on current region
    this.updateMountVisibility();
  }

  /**
   * Shows or hides the mount mesh based on which stage the player is currently exploring
   */
  updateMountVisibility() {
    if (!this.mount || !this.mount.mesh) return;

    // If the mount belongs to this stage or is currently being ridden, it is visible in the scene
    const isSameStage = (this.mount.stageIndex === this.currentLevelIndex);
    const shouldBeInScene = isSameStage || this.mount.isMounted;

    if (shouldBeInScene) {
      if (!this.mount.mesh.parent) {
        this.scene.add(this.mount.mesh);
      }
      this.mount.mesh.visible = true;
    } else {
      this.mount.mesh.visible = false;
      if (this.mount.mesh.parent) {
        this.scene.remove(this.mount.mesh);
      }
    }
  }

  /**
   * Called when the game transitions to a new level/region
   */
  onLevelTransition(targetLevelIndex, player, arrivalPos = null) {
    this.currentLevelIndex = targetLevelIndex;

    if (!this.mount) return;

    if (this.mount.isMounted && player) {
      // Mount accompanies rider seamlessly into the new region
      this.mount.stageIndex = targetLevelIndex;
      if (arrivalPos) {
        this.mount.position.set(arrivalPos.x, arrivalPos.y, arrivalPos.z);
        if (arrivalPos.rotationY !== undefined) {
          this.mount.rotation.y = arrivalPos.rotationY;
        }
      }
      // Re-add to active scene if needed
      if (!this.mount.mesh.parent) {
        this.scene.add(this.mount.mesh);
      }
      this.mount.mesh.visible = true;
      this.mount.mount(player, null, true);
    } else {
      this.updateMountVisibility();
    }
  }

  /**
   * Checks if player is within mounting interaction distance
   */
  isNearMount(playerPos, radius = 3.0) {
    if (!this.mount || !this.mount.mesh.visible || this.mount.isMounted || !playerPos) return false;
    const dist = Math.hypot(playerPos.x - this.mount.position.x, playerPos.z - this.mount.position.z);
    return dist <= radius;
  }

  isPlayerMounted() {
    return Boolean(this.mount && this.mount.isMounted);
  }

  getMountName() {
    return this.mount ? this.mount.name : 'Mount';
  }

  canMountPlayer(player) {
    if (!this.mount) return { allowed: false, reason: 'No mount available.' };
    return this.mount.canMount(player);
  }

  mountPlayer(player, cameraManager = null, force = false) {
    if (!this.mount) return false;
    const success = this.mount.mount(player, cameraManager, force);
    if (success) {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification(`🐎 Mounted ${this.mount.name}. [E] to Dismount, hold [Shift] to Gallop!`);
      }
      this.updateMountHUD(true);
    }
    return success;
  }

  dismountPlayer(cameraManager = null) {
    if (!this.mount || !this.mount.isMounted) return false;
    const success = this.mount.dismount(cameraManager);
    if (success) {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification(`Dismounted ${this.mount.name}.`);
      }
      this.updateMountHUD(false);
    }
    return success;
  }

  /**
   * Whistle recovery: summons mount to an obstacle-free point beside player
   */
  whistleMount(player) {
    if (!player || !this.mount) return false;

    // Cannot summon while already riding
    if (this.mount.isMounted) {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification('Already riding your steed!');
      }
      return false;
    }

    // Play whistle audio chime
    if (this.audioManager && typeof this.audioManager.playMountWhistle === 'function') {
      this.audioManager.playMountWhistle();
    }

    // Bring mount to current stage if it was parked in another realm
    this.mount.stageIndex = this.currentLevelIndex;
    if (!this.mount.mesh.parent) {
      this.scene.add(this.mount.mesh);
    }
    this.mount.mesh.visible = true;

    // Recover without spawning through solid obstacles
    const recovered = this.mount.recoverToSafeLocation(player.getPosition(), this.physicsWorld);
    if (recovered) {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification(`🐎 ${this.mount.name} answered your whistle!`);
      }
      return true;
    } else {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification('⚠️ Cannot summon mount here: area is too obstructed.');
      }
      return false;
    }
  }

  updateMountHUD(isMounted) {
    const badge = document.getElementById('mount-stance-badge');
    if (badge) {
      if (isMounted) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }
  }

  /**
   * Main Manager Update Loop
   */
  update(deltaTime, player, cameraManager) {
    if (!this.mount) return;

    if (this.mount.isMounted) {
      // Feed player inputs into the riding controller
      const keys = player ? player.keys : {};
      this.mount.update(deltaTime, keys, cameraManager, this.audioManager);

      // Update riding gait indicator
      const speedLabel = document.getElementById('mount-speed-text');
      if (speedLabel) {
        speedLabel.textContent = this.mount.currentGait.toUpperCase();
      }
    } else {
      this.mount.update(deltaTime, null, null, this.audioManager);
    }
  }

  getSaveState() {
    if (!this.mount) return null;
    return this.mount.getSaveState();
  }

  restoreSaveState(state, player = null, cameraManager = null) {
    if (!state || !this.mount) return;

    this.mount.restoreSaveState(state);
    this.updateMountVisibility();

    if (state.isMounted && player) {
      this.mount.mount(player, cameraManager, true);
      this.updateMountHUD(true);
    }
  }

  dispose() {
    if (this.mount) {
      this.mount.dispose();
      this.mount = null;
    }
  }
}
