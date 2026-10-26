import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationController } from './AnimationController.js';
import { Sword } from './Sword.js';
import { InventorySystem } from '../systems/InventorySystem.js';

export class Player {
  constructor(scene, environment = null, physicsWorld = null) {
    this.scene = scene;
    this.environment = environment;
    this.physicsWorld = physicsWorld;

    // Entity root group
    this.mesh = new THREE.Group();
    this.position = this.mesh.position;
    this.rotation = this.mesh.rotation;

    this.model = null;
    this.animController = null;
    this.sword = null;
    this.isLoaded = false;
    this.isFallback = false;

    // Collision dimensions (cylinder capsule)
    this.radius = 0.45;
    this.height = 1.8;

    // Configurable base movement parameters (in units/sec)
    this.baseWalkSpeed = 4.0;
    this.baseRunSpeed = 7.5;
    this.baseSprintSpeed = 10.5;
    this.rotationSpeed = 14.0;

    this.walkSpeed = this.baseWalkSpeed;
    this.runSpeed = this.baseRunSpeed;
    this.sprintSpeed = this.baseSprintSpeed;

    // Temporary consumable buffs
    this.speedBuffMultiplier = 1.0;
    this.speedBuffTimer = 0;

    // Movement mode: Run by default on WASD!
    this.isRunMode = true;
    this.isSprinting = false;
    this.footstepTimer = 0;
    this.lastWPressTime = 0;
    this.isDoubleTapSprint = false;

    // Base Character Stats
    this.baseMaxHealth = 100;
    this.baseDamage = 25;
    this.baseDefense = 0;

    // Effective Combat Stats (Base + Equipment bonuses)
    this.maxHealth = 100;
    this.health = 100;
    this.damage = 40;
    this.defense = 0;

    // Progression & Skills
    this.level = 1;
    this.xp = 0;
    this.unlockedSkills = ['sword_slash', 'fast_sprint', 'ground_roll'];
    this.discoveredLocations = ['dark-forest'];

    // Complete Inventory & Equipment System
    this.inventorySystem = new InventorySystem();
    this.inventory = [];
    this.onInteractCallback = null;
    this.recalculateStats();

    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.isEnabled = true;
    this.audioManager = null;
    this.vfxManager = null;
    this.uiManager = null;
    this.onDamageCallbacks = [];
    this.onDeathCallbacks = [];

    this.isAttacking = false;
    this.hasDealtDamageThisSwing = false;
    this.attackDuration = 0.35;
    this.attackTimer = 0;
    this.attackCooldown = 0.45;
    this.attackCooldownTimer = 0;

    // Physics & vertical jump parameters
    this.verticalVelocity = 0;
    this.gravity = -22.0;
    this.jumpForce = 8.2;
    this.isGrounded = true;

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      run: false
    };

    // Math helpers to prevent garbage collection spikes in render loop
    this._moveDir = new THREE.Vector3();
    this._targetQuat = new THREE.Quaternion();
    this._upVec = new THREE.Vector3(0, 1, 0);

    // Initial forest spawn coordinates
    this.spawnX = 0;
    this.spawnZ = 2;
    this.groundToTerrain(this.spawnX, this.spawnZ);

    this.scene.add(this.mesh);
    this.setupInput();
  }

  onInteract(callback) {
    this.onInteractCallback = callback;
  }

  get gold() {
    return this.inventorySystem ? this.inventorySystem.getGold() : 150;
  }

  set gold(val) {
    if (this.inventorySystem) {
      this.inventorySystem.gold = Math.max(0, Math.floor(val || 0));
    }
  }

  setPhysicsWorld(physicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  async init() {
    const loader = new GLTFLoader();
    const modelPath = '/models/Soldier.glb';

    try {
      const gltf = await loader.loadAsync(modelPath);
      this.model = gltf.scene;

      this.model.scale.set(1.0, 1.0, 1.0);
      this.model.rotation.y = Math.PI;

      let rightHandBone = null;

      this.model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material.roughness = Math.max(0.3, child.material.roughness || 0.5);
          }
        }

        if (child.isBone) {
          const boneName = child.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (boneName.includes('righthand') || boneName.includes('handr')) {
            rightHandBone = child;
          }
        }
      });

      this.mesh.add(this.model);

      // Attach adventurer sword to character's hand bone
      this.sword = new Sword();
      if (rightHandBone) {
        this.sword.attachToHand(rightHandBone);
      } else {
        console.warn('Right hand bone not detected; attaching sword to model root.');
        this.sword.mesh.position.set(0.4, 1.0, 0);
        this.model.add(this.sword.mesh);
      }

      // Initialize Animation Controller
      if (gltf.animations && gltf.animations.length > 0) {
        this.animController = new AnimationController(this.model, gltf.animations);
        this.animController.play('Idle', 0.1);
      }

      this.isLoaded = true;
      this.groundToTerrain(this.position.x, this.position.z);

    } catch (err) {
      console.error('Failed to load humanoid character GLB:', err);
      this.initFallback();
    }
  }

  initFallback() {
    this.isFallback = true;
    console.warn('[Player] Initializing clearly identified fallback proxy.');

    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4
    });

    const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.0, 8, 16), mat);
    capsule.position.y = 1.0;
    capsule.castShadow = true;
    group.add(capsule);

    this.mesh.add(group);
    this.isLoaded = true;
  }

  groundToTerrain(x = this.position.x, z = this.position.z) {
    let groundY = 0;
    if (this.physicsWorld) {
      groundY = this.physicsWorld.getGroundHeight(x, z, this.position.y);
    } else if (this.environment && typeof this.environment.getTerrainHeight === 'function') {
      groundY = this.environment.getTerrainHeight(x, z);
    }

    this.position.set(x, groundY, z);
    this.verticalVelocity = 0;
    this.isGrounded = true;
  }

  /**
   * Teleports and resets player position and state cleanly (used for level spawning & resets)
   */
  teleport(x, z, rotY = 0, isEnabled = true) {
    this.groundToTerrain(x, z);
    this.mesh.rotation.y = rotY;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldownTimer = 0;
    this.hasDealtDamageThisSwing = false;
    this.health = this.maxHealth;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.isEnabled = isEnabled;
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
    this.keys.run = false;

    if (this.animController) {
      this.animController.play('Idle', 0.1);
    }
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp': {
          const now = performance.now();
          if (now - this.lastWPressTime < 320) {
            this.isDoubleTapSprint = true;
          }
          this.lastWPressTime = now;
          this.keys.forward = true;
          break;
        }
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          this.keys.jump = true;
          this.handleJump();
          e.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.shift = true;
          this.keys.run = true;
          break;
        case 'CapsLock':
        case 'KeyC':
          this.isRunMode = !this.isRunMode;
          if (this.uiManager && typeof this.uiManager.updateMovementStance === 'function') {
            this.uiManager.updateMovementStance(this.isRunMode ? 'run' : 'walk');
          }
          break;
        case 'KeyF':
          this.triggerAttack();
          break;
        case 'KeyE':
          if (this.onInteractCallback && this.onInteractCallback()) {
            // Handled NPC or world interaction cleanly without combat swing
            break;
          }
          this.triggerAttack();
          break;

        case 'Digit1':
          if (this.animController) this.animController.play('Idle', 0.25);
          break;
        case 'Digit2':
          if (this.animController) this.animController.play('Walk', 0.25);
          break;
        case 'Digit3':
          if (this.animController) this.animController.play('Run', 0.25);
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          this.isDoubleTapSprint = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.shift = false;
          this.keys.run = false;
          break;
      }
    });

    // Left click attacks when pointer locked
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && document.pointerLockElement) {
        this.triggerAttack();
      }
    });
  }

  setAudioManager(audioManager) {
    this.audioManager = audioManager;
  }

  setVFXManager(vfxManager) {
    this.vfxManager = vfxManager;
  }

  setUIManager(uiManager) {
    this.uiManager = uiManager;
  }

  onDamage(callback) {
    if (typeof callback === 'function') {
      this.onDamageCallbacks.push(callback);
    }
  }

  onDeath(callback) {
    if (typeof callback === 'function') {
      this.onDeathCallbacks.push(callback);
    }
  }

  recalculateStats() {
    if (!this.inventorySystem) return;

    const bonuses = this.inventorySystem.getEquipmentBonuses();

    this.maxHealth = this.baseMaxHealth + bonuses.maxHealth;
    this.damage = this.baseDamage + bonuses.damage;
    this.defense = this.baseDefense + bonuses.defense;

    const buffMultiplier = this.speedBuffTimer > 0 ? this.speedBuffMultiplier : 1.0;
    const equipSpeed = 1.0 + bonuses.speedBonus;
    this.walkSpeed = this.baseWalkSpeed * buffMultiplier * equipSpeed;
    this.runSpeed = this.baseRunSpeed * buffMultiplier * equipSpeed;
    this.sprintSpeed = this.baseSprintSpeed * buffMultiplier * equipSpeed;

    this.health = Math.min(this.maxHealth, this.health);

    if (this.uiManager && typeof this.uiManager.updatePlayerHealth === 'function') {
      this.uiManager.updatePlayerHealth(this.health, this.maxHealth);
    }
  }

  applySpeedBuff(multiplier = 1.25, duration = 15) {
    this.speedBuffMultiplier = multiplier;
    this.speedBuffTimer = duration;
    this.recalculateStats();
  }

  getCharacterStats() {
    return {
      level: this.level,
      xp: this.xp,
      health: this.health,
      maxHealth: this.maxHealth,
      baseMaxHealth: this.baseMaxHealth,
      damage: this.damage,
      baseDamage: this.baseDamage,
      defense: this.defense,
      baseDefense: this.baseDefense,
      walkSpeed: this.walkSpeed,
      runSpeed: this.runSpeed,
      sprintSpeed: this.sprintSpeed,
      equipment: this.inventorySystem.equipment
    };
  }

  takeDamage(amount) {
    if (!this.isEnabled || this.isInvulnerable || this.health <= 0) return;

    // Defense mitigates incoming physical damage smoothly
    const reduction = this.defense > 0 ? this.defense / (this.defense + 50) : 0;
    const finalDamage = Math.max(1, Math.round(amount * (1 - reduction)));

    this.health = Math.max(0, this.health - finalDamage);
    this.isInvulnerable = true;
    this.invulnerableTimer = 0.5;

    if (this.audioManager && typeof this.audioManager.playPlayerDamage === 'function') {
      this.audioManager.playPlayerDamage();
    }

    this.onDamageCallbacks.forEach(cb => cb(finalDamage, this.health, this.maxHealth));

    if (this.health <= 0) {
      if (this.animController) {
        // Play death / collapse animation or fallback
        const clips = this.animController.getAvailableClips();
        if (clips.includes('Death') || clips.includes('death')) {
          this.animController.play('Death', 0.2);
        }
      }
      this.onDeathCallbacks.forEach(cb => cb());
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.onDamageCallbacks.forEach(cb => cb(0, this.health, this.maxHealth));
  }

  triggerAttack(audioManager = this.audioManager) {
    if (!this.isEnabled || this.health <= 0 || this.isAttacking || this.attackCooldownTimer > 0) return;

    this.isAttacking = true;
    this.hasDealtDamageThisSwing = false;
    this.attackTimer = 0;
    this.attackCooldownTimer = this.attackCooldown;

    const am = audioManager || this.audioManager;
    if (am && typeof am.playSwordSlash === 'function') {
      am.playSwordSlash();
    }
  }

  handleJump() {
    if (!this.isEnabled || this.health <= 0) return;

    if (this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;

      if (this.audioManager && typeof this.audioManager.playJump === 'function') {
        this.audioManager.playJump();
      }

      if (this.animController) {
        const available = this.animController.getAvailableClips();
        if (available.includes('Jump') || available.includes('jump')) {
          this.animController.play('Jump', 0.15);
        }
      }
    }
  }

  update(deltaTime, cameraManager = null) {
    if (!this.isLoaded) return;

    if (!this.isEnabled) {
      if (this.animController) {
        if (this.health <= 0) {
          // Stay dead
        } else if (this.animController.getCurrentClip() !== 'Idle') {
          this.animController.play('Idle', 0.2);
        }
        this.animController.update(deltaTime);
      }
      return;
    }

    // Cooldown management
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= deltaTime;
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Consumable speed buff timer
    if (this.speedBuffTimer > 0) {
      this.speedBuffTimer -= deltaTime;
      if (this.speedBuffTimer <= 0) {
        this.speedBuffTimer = 0;
        this.speedBuffMultiplier = 1.0;
        this.recalculateStats();
      }
    }

    // Sword attack swing animation
    if (this.isAttacking) {
      this.attackTimer += deltaTime;
      const progress = this.attackTimer / this.attackDuration;

      if (this.sword) {
        // Dynamic horizontal slash arc
        const swingAngle = Math.sin(progress * Math.PI) * 1.8;
        this.sword.mesh.rotation.set(
          Math.PI / 2 + Math.sin(progress * Math.PI) * 0.4,
          swingAngle,
          -Math.PI / 2 + swingAngle * 0.5
        );
      }

      if (this.attackTimer >= this.attackDuration) {
        this.isAttacking = false;
        if (this.sword) {
          this.sword.mesh.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
        }
      }
    }

    // 1. Calculate camera-relative movement direction
    this._moveDir.set(0, 0, 0);

    const camForward = cameraManager ? cameraManager.getHorizontalForward() : new THREE.Vector3(0, 0, -1);
    const camRight = cameraManager ? cameraManager.getHorizontalRight() : new THREE.Vector3(1, 0, 0);

    if (this.keys.forward) this._moveDir.add(camForward);
    if (this.keys.backward) this._moveDir.sub(camForward);
    if (this.keys.right) this._moveDir.add(camRight);
    if (this.keys.left) this._moveDir.sub(camRight);

    const isMoving = this._moveDir.lengthSq() > 0.001;

    let moveState = 'idle';
    let currentSpeed = 0;
    let targetClip = 'Idle';
    let animScale = 1.0;
    let stepInterval = 0.36;

    if (isMoving) {
      this._moveDir.normalize();

      const isShiftHeld = this.keys.shift || this.keys.run;
      const isDoubleTap = this.isDoubleTapSprint;

      if (this.isRunMode) {
        moveState = (isShiftHeld || isDoubleTap) ? 'sprint' : 'run';
      } else {
        moveState = isShiftHeld ? 'run' : 'walk';
      }

      this.isSprinting = (moveState === 'sprint');

      if (moveState === 'sprint') {
        currentSpeed = this.sprintSpeed; // 10.5 m/s
        targetClip = 'Run';
        animScale = 1.35;
        stepInterval = 0.26;
      } else if (moveState === 'run') {
        currentSpeed = this.runSpeed; // 7.5 m/s
        targetClip = 'Run';
        animScale = 1.05;
        stepInterval = 0.35;
      } else {
        currentSpeed = this.walkSpeed; // 4.0 m/s
        targetClip = 'Walk';
        animScale = 1.0;
        stepInterval = 0.52;
      }

      const moveDistance = currentSpeed * deltaTime;
      const subSteps = (moveState === 'sprint') ? 3 : 2;
      const stepDist = moveDistance / subSteps;

      for (let s = 0; s < subSteps; s++) {
        this.position.x += this._moveDir.x * stepDist;
        this.position.z += this._moveDir.z * stepDist;

        if (this.physicsWorld) {
          this.physicsWorld.resolveCollisions(this.position, this.radius, this.height);
        }
      }

      if (this.model) {
        const targetAngle = Math.atan2(this._moveDir.x, this._moveDir.z);
        this._targetQuat.setFromAxisAngle(this._upVec, targetAngle);
        const lerpFactor = 1.0 - Math.exp(-this.rotationSpeed * deltaTime);
        this.model.quaternion.slerp(this._targetQuat, lerpFactor);
      }

      // Footstep cadence audio & ground dust
      if (this.isGrounded) {
        this.footstepTimer += deltaTime;
        if (this.footstepTimer >= stepInterval) {
          this.footstepTimer = 0;
          if (this.audioManager && typeof this.audioManager.playFootstep === 'function') {
            this.audioManager.playFootstep(moveState !== 'walk', moveState === 'sprint');
          }
          if (this.vfxManager && typeof this.vfxManager.spawnFootstepDust === 'function') {
            this.vfxManager.spawnFootstepDust(this.position, moveState === 'sprint');
          }
        }
      }

      if (this.uiManager && typeof this.uiManager.updateMovementStance === 'function') {
        this.uiManager.updateMovementStance(moveState);
      }
    } else {
      this.isSprinting = false;
      this.footstepTimer = 0;
      targetClip = 'Idle';
      animScale = 1.0;

      if (this.physicsWorld) {
        this.physicsWorld.resolveCollisions(this.position, this.radius, this.height);
      }

      if (this.uiManager && typeof this.uiManager.updateMovementStance === 'function') {
        this.uiManager.updateMovementStance(this.isRunMode ? 'run' : 'walk');
      }
    }

    // 2. Vertical Physics: Ground Detection, Gravity & Jumping
    const groundY = this.physicsWorld
      ? this.physicsWorld.getGroundHeight(this.position.x, this.position.z, this.position.y)
      : (this.environment ? this.environment.getTerrainHeight(this.position.x, this.position.z) : 0);

    if (!this.isGrounded) {
      this.verticalVelocity += this.gravity * deltaTime;
      this.position.y += this.verticalVelocity * deltaTime;

      if (this.position.y <= groundY) {
        this.position.y = groundY;
        this.verticalVelocity = 0;
        const wasAir = !this.isGrounded;
        this.isGrounded = true;

        if (wasAir && this.audioManager && typeof this.audioManager.playLand === 'function') {
          this.audioManager.playLand();
        }
      }
    } else {
      if (this.position.y > groundY + 0.25) {
        this.isGrounded = false;
        this.verticalVelocity = 0;
      } else {
        this.position.y = groundY;
      }
    }

    // 3. Animation State Selection & Blending
    if (this.animController) {
      if (this.isGrounded) {
        if (this.animController.getCurrentClip() !== targetClip) {
          this.animController.play(targetClip, targetClip === 'Idle' ? 0.25 : 0.18);
        }
        this.animController.setTimeScale(animScale);
      }
      this.animController.update(deltaTime);
    }
  }

  getForwardVector() {
    if (this.model) {
      const v = new THREE.Vector3(0, 0, -1);
      v.applyQuaternion(this.model.quaternion);
      v.y = 0;
      return v.normalize();
    }
    return new THREE.Vector3(0, 0, -1);
  }

  getPosition() {
    return this.position;
  }

  getSwordTipPosition(targetVec = new THREE.Vector3()) {
    if (this.sword) {
      return this.sword.getTipWorldPosition(targetVec);
    }
    return targetVec.copy(this.position).add(new THREE.Vector3(0.5, 1.2, 0.5));
  }

  getSwordBasePosition(targetVec = new THREE.Vector3()) {
    if (this.sword) {
      return this.sword.getBaseWorldPosition(targetVec);
    }
    return targetVec.copy(this.position).add(new THREE.Vector3(0.3, 0.8, 0.3));
  }

  getAvailableAnimations() {
    return this.animController ? this.animController.getAvailableClips() : [];
  }

  /**
   * Captures the full player state for persistent storage
   */
  getSaveState() {
    return {
      position: {
        x: Number(this.position.x.toFixed(3)),
        y: Number(this.position.y.toFixed(3)),
        z: Number(this.position.z.toFixed(3))
      },
      rotationY: Number(this.rotation.y.toFixed(3)),
      health: Math.max(1, Math.min(this.maxHealth, Math.ceil(this.health))),
      maxHealth: this.maxHealth,
      baseMaxHealth: this.baseMaxHealth,
      damage: this.damage,
      baseDamage: this.baseDamage,
      defense: this.defense,
      baseDefense: this.baseDefense,
      isRunMode: this.isRunMode,
      level: this.level,
      xp: this.xp,
      gold: this.gold,
      inventory: this.inventorySystem.getSaveState(),
      legacyInventory: Array.isArray(this.inventory) ? [...this.inventory] : [],
      equipment: { ...this.inventorySystem.equipment },
      unlockedSkills: [...this.unlockedSkills],
      discoveredLocations: [...this.discoveredLocations]
    };
  }

  /**
   * Restores player state from persistent storage
   */
  restoreSaveState(state) {
    if (!state) return;

    if (state.position && typeof state.position.x === 'number') {
      this.mesh.position.set(state.position.x, state.position.y, state.position.z);
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    if (typeof state.rotationY === 'number') {
      this.mesh.rotation.y = state.rotationY;
    }

    if (typeof state.baseMaxHealth === 'number') {
      this.baseMaxHealth = state.baseMaxHealth;
    }

    if (typeof state.baseDamage === 'number') {
      this.baseDamage = state.baseDamage;
    }

    if (typeof state.baseDefense === 'number') {
      this.baseDefense = state.baseDefense;
    }

    if (typeof state.level === 'number') this.level = state.level;
    if (typeof state.xp === 'number') this.xp = state.xp;
    if (typeof state.gold === 'number') this.gold = state.gold;
    if (Array.isArray(state.unlockedSkills)) this.unlockedSkills = state.unlockedSkills;
    if (Array.isArray(state.discoveredLocations)) this.discoveredLocations = state.discoveredLocations;

    // Restore inventory and equipment
    if (state.inventory) {
      this.inventorySystem.restoreSaveState(state.inventory, this);
    } else if (Array.isArray(state.inventory)) {
      this.inventorySystem.restoreSaveState({ slots: state.inventory, equipment: state.equipment }, this);
    }

    if (Array.isArray(state.legacyInventory)) {
      this.inventory = [...state.legacyInventory];
    } else if (Array.isArray(state.inventory)) {
      this.inventory = [...state.inventory];
    } else {
      this.inventory = this.inventorySystem.slots.filter(Boolean);
    }

    // Recompute stats from base + restored equipment
    this.recalculateStats();

    if (typeof state.health === 'number') {
      this.health = Math.max(1, Math.min(this.maxHealth, state.health));
      if (this.uiManager && typeof this.uiManager.updatePlayerHealth === 'function') {
        this.uiManager.updatePlayerHealth(this.health, this.maxHealth);
      }
    }

    if (typeof state.isRunMode === 'boolean') {
      this.isRunMode = state.isRunMode;
      if (this.uiManager && typeof this.uiManager.updateMovementStance === 'function') {
        this.uiManager.updateMovementStance(this.isRunMode ? 'run' : 'walk');
      }
    }

    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.isAttacking = false;
  }
}
