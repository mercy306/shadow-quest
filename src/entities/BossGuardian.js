import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadSharedModel } from '../core/ModelLoader.js';
import { AnimationController } from './AnimationController.js';

export const BossState = {
  DORMANT: 'DORMANT',
  INTRO: 'INTRO',
  IDLE: 'IDLE',
  CHASE: 'CHASE',
  SLAM_WINDUP: 'SLAM_WINDUP',
  SLAM: 'SLAM',
  CHARGE_WINDUP: 'CHARGE_WINDUP',
  CHARGE: 'CHARGE',
  AOE_WINDUP: 'AOE_WINDUP',
  AOE: 'AOE',
  PHASE_TRANSITION: 'PHASE_TRANSITION',
  STUNNED: 'STUNNED',
  RECOVERY: 'RECOVERY',
  DEAD: 'DEAD'
};

export class BossGuardian {
  constructor(scene, physicsWorld = null, config = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;

    this.id = config.id || 'boss-malakor';
    this.name = config.name || 'አርዌ — የጥንቱ ዘንዶ • ARWE THE ANCIENT ZANDO';
    this.isBoss = true;

    // Entity root group
    this.mesh = new THREE.Group();
    this.position = this.mesh.position;
    this.rotation = this.mesh.rotation;

    this.center = config.center ? config.center.clone() : new THREE.Vector3(-38, 0, -66);
    this.position.copy(this.center);

    this.model = null;
    this.animController = null;
    this.isLoaded = false;

    // Physical dimensions (Large & Imposing Colossus scale)
    this.radius = 1.1;
    this.height = 3.2;

    // Combat Stats & Multi-Phase progression
    this.maxHealth = config.maxHealth || 450;
    this.health = this.maxHealth;
    this.damage = config.damage || 22;
    this.phase = 1;
    this.hasTransitionedPhase2 = false;
    this.hasTransitionedPhase3 = false;

    // State machine
    this.state = BossState.DORMANT;
    this.stateTimer = 0;
    this.attackCooldownTimer = 1.5;
    this.isAttacking = false;
    this.isInvulnerable = false;
    this.isStaggered = false;
    this.isEligibleForTakedown = false;

    // Arena integration & Safeguards
    this.arena = null;
    this.isTriggered = false;
    this.isDefeated = false;
    this.hasAwardedRewards = false;

    // Locomotion speeds
    this.chaseSpeed = 4.2;
    this.chargeSpeed = 9.5;
    this.turnSpeed = 6.0;

    // Attack parameters & telemetry
    this.attackRange = 3.6;
    this.chargeDirection = new THREE.Vector3();
    this.chargeDistanceTraveled = 0;
    this.chargeMaxDistance = 13.0;

    // Telegraph visual warning meshes
    this.telegraphGroup = new THREE.Group();
    this.scene.add(this.telegraphGroup);
    this.initTelegraphs();

    // Internal vector scratchpads
    this._moveDir = new THREE.Vector3();
    this._targetQuat = new THREE.Quaternion();
    this._upVec = new THREE.Vector3(0, 1, 0);

    // References to managers
    this.game = null;
    this.uiManager = null;
    this.audioManager = null;
    this.vfxManager = null;
    this.questSystem = null;

    this.scene.add(this.mesh);
  }

  setManagers({ game, uiManager, audioManager, vfxManager, questSystem, arena }) {
    if (game) this.game = game;
    if (uiManager) this.uiManager = uiManager;
    if (audioManager) this.audioManager = audioManager;
    if (vfxManager) this.vfxManager = vfxManager;
    if (questSystem) this.questSystem = questSystem;
    if (arena) this.arena = arena;
  }

  groundToTerrain() {
    if (this.physicsWorld) {
      this.position.y = this.physicsWorld.getGroundHeight(this.position.x, this.position.z, this.position.y);
    }
  }

  initTelegraphs() {
    // 1. Slam warning circle (red/orange decal)
    const slamOuterGeo = new THREE.RingGeometry(3.1, 3.4, 32);
    const slamInnerGeo = new THREE.CircleGeometry(3.1, 32);

    this.telegraphMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.telegraphFillMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.slamTelegraph = new THREE.Group();
    const slamRing = new THREE.Mesh(slamOuterGeo, this.telegraphMat);
    slamRing.rotation.x = -Math.PI / 2;
    this.slamTelegraphFill = new THREE.Mesh(slamInnerGeo, this.telegraphFillMat);
    this.slamTelegraphFill.rotation.x = -Math.PI / 2;
    this.slamTelegraph.add(slamRing);
    this.slamTelegraph.add(this.slamTelegraphFill);
    this.slamTelegraph.visible = false;
    this.telegraphGroup.add(this.slamTelegraph);

    // 2. Charge warning lane strip (13m x 2.4m)
    const chargeGeo = new THREE.PlaneGeometry(2.4, this.chargeMaxDistance);
    this.chargeTelegraph = new THREE.Mesh(chargeGeo, this.telegraphMat);
    this.chargeTelegraph.rotation.x = -Math.PI / 2;
    this.chargeTelegraph.visible = false;
    this.telegraphGroup.add(this.chargeTelegraph);

    // 3. AoE Shockwave expanding ring (8.5m radius)
    const aoeGeo = new THREE.RingGeometry(8.2, 8.6, 48);
    this.aoeTelegraph = new THREE.Mesh(aoeGeo, this.telegraphMat);
    this.aoeTelegraph.rotation.x = -Math.PI / 2;
    this.aoeTelegraph.visible = false;
    this.telegraphGroup.add(this.aoeTelegraph);
  }

  async init() {
    const modelPath = './models/EnemyGuardian.glb';

    try {
      const gltf = await loadSharedModel(modelPath);
      this.model = gltf.scene;

      // Colossus imposing scale (1.45x)
      this.model.scale.set(1.45, 1.45, 1.45);

      // Traversal for custom Boss verdant moss & dark stone styling
      this.model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: child.name.toLowerCase().includes('head') ? 0x064e3b : 0x0f172a,
              roughness: 0.65,
              metalness: 0.45
            });

            // Glowing Runic Eyes & Chest core (Phase 1: Emerald)
            if (child.name.toLowerCase().includes('head')) {
              this.headMaterial = child.material;
              this.headMaterial.emissive = new THREE.Color(0x10b981);
              this.headMaterial.emissiveIntensity = 1.2;
            }
          }
        }
      });

      this.mesh.add(this.model);

      if (gltf.animations && gltf.animations.length > 0) {
        this.animController = new AnimationController(this.model, gltf.animations);
        this.animController.play('Idle', 0.1);
      }

      this.isLoaded = true;
      this.groundToTerrain();

    } catch (err) {
      console.warn('[BossGuardian] GLB load fallback to procedural model:', err);
      // Fallback procedural geometry if GLB fails
      const bodyGeo = new THREE.CylinderGeometry(0.8, 1.0, 2.8, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.6 });
      this.model = new THREE.Mesh(bodyGeo, mat);
      this.model.position.y = 1.4;
      this.mesh.add(this.model);
      this.isLoaded = true;
      this.groundToTerrain();
    }
  }

  triggerEncounter(player) {
    if (this.isTriggered || this.isDefeated) return;
    this.isTriggered = true;

    // Raise arena runic barrier
    if (this.arena && typeof this.arena.activateBarrier === 'function') {
      this.arena.activateBarrier();
    }

    // Display Boss Health Bar
    if (this.uiManager && typeof this.uiManager.showBossHUD === 'function') {
      this.uiManager.showBossHUD(this);
    }

    if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
      this.uiManager.showCollectNotification('⚠️ BOSS ENCOUNTER: አርዌ (ARWE THE ANCIENT ZANDO)!');
    }

    this.setState(BossState.INTRO);
    this.stateTimer = 1.8;
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateTimer = 0;
    this.isStaggered = (newState === BossState.STUNNED);

    // Hide telegraphs on state change unless active attack
    if (newState !== BossState.SLAM_WINDUP) this.slamTelegraph.visible = false;
    if (newState !== BossState.CHARGE_WINDUP) this.chargeTelegraph.visible = false;
    if (newState !== BossState.AOE_WINDUP) this.aoeTelegraph.visible = false;

    if (!this.animController) return;

    switch (newState) {
      case BossState.DORMANT:
      case BossState.IDLE:
      case BossState.RECOVERY:
        this.animController.play('Idle', 0.25);
        break;
      case BossState.INTRO:
      case BossState.PHASE_TRANSITION:
        this.animController.play('No', 0.2); // Roar / Stagger headshake
        break;
      case BossState.CHASE:
        this.animController.play(this.phase === 3 ? 'Running' : 'Walking', 0.2);
        break;
      case BossState.SLAM_WINDUP:
        this.animController.play('Standing', 0.2);
        break;
      case BossState.SLAM:
        this.animController.play('Punch', 0.1);
        break;
      case BossState.CHARGE_WINDUP:
        this.animController.play('Standing', 0.15);
        break;
      case BossState.CHARGE:
        this.animController.play('Running', 0.1);
        break;
      case BossState.AOE_WINDUP:
        this.animController.play('Jump', 0.2);
        break;
      case BossState.AOE:
        this.animController.play('Punch', 0.1);
        break;
      case BossState.STUNNED:
        this.animController.play('No', 0.15);
        break;
      case BossState.DEAD:
        this.animController.play('Death', 0.2);
        break;
    }

    if (this.uiManager && typeof this.uiManager.updateBossHUD === 'function') {
      this.uiManager.updateBossHUD(this);
    }
  }

  update(deltaTime, playerOrPosition) {
    if (!this.isLoaded) return;
    if (this.animController) this.animController.update(deltaTime);

    const playerPos = playerOrPosition && playerOrPosition.isVector3
      ? playerOrPosition
      : (playerOrPosition?.position || (playerOrPosition?.getPosition && playerOrPosition.getPosition()));

    if (!playerPos) return;

    const distToPlayer = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
    this.groundToTerrain();

    // 1. Check encounter trigger zone (approaching arena within 13.5m)
    if (this.state === BossState.DORMANT) {
      if (distToPlayer <= 13.5 && !this.isDefeated) {
        this.triggerEncounter(playerOrPosition);
      }
      return;
    }

    if (this.state === BossState.DEAD) {
      return; // Do nothing after death
    }

    this.stateTimer += deltaTime;
    this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - deltaTime);

    // Update Arena Barrier containment
    if (this.arena && typeof this.arena.update === 'function') {
      this.arena.update(deltaTime, playerPos);
    }

    // 2. Phase Threshold Check
    this.checkPhaseTransitions();

    // 3. State Machine Execution
    switch (this.state) {
      case BossState.INTRO:
        this.rotateTowards(playerPos.x, playerPos.z, deltaTime);
        if (this.stateTimer >= 1.8) {
          this.setState(BossState.CHASE);
        }
        break;

      case BossState.PHASE_TRANSITION:
        this.isInvulnerable = true;
        if (this.stateTimer >= 2.0) {
          this.isInvulnerable = false;
          this.setState(BossState.CHASE);
        }
        break;

      case BossState.IDLE:
      case BossState.RECOVERY:
        this.rotateTowards(playerPos.x, playerPos.z, deltaTime * 2.0);
        const recoveryDuration = this.phase === 3 ? 1.0 : (this.phase === 2 ? 1.25 : 1.45);
        if (this.stateTimer >= recoveryDuration) {
          this.setState(BossState.CHASE);
        }
        break;

      case BossState.CHASE:
        this.updateChase(deltaTime, playerPos, distToPlayer);
        break;

      case BossState.SLAM_WINDUP:
        this.updateSlamWindup(deltaTime, playerPos);
        break;

      case BossState.SLAM:
        this.executeSlam(playerPos);
        break;

      case BossState.CHARGE_WINDUP:
        this.updateChargeWindup(deltaTime);
        break;

      case BossState.CHARGE:
        this.updateCharge(deltaTime, playerPos);
        break;

      case BossState.AOE_WINDUP:
        this.updateAoeWindup(deltaTime, playerPos);
        break;

      case BossState.AOE:
        this.executeAoeShockwave(playerPos);
        break;

      case BossState.STUNNED:
        this.isStaggered = true;
        if (this.stateTimer >= 1.5) {
          this.isStaggered = false;
          this.setState(BossState.CHASE);
        }
        break;
    }

    // Update Boss Health Bar HUD
    if (this.uiManager && typeof this.uiManager.updateBossHUD === 'function') {
      this.uiManager.updateBossHUD(this);
    }
  }

  checkPhaseTransitions() {
    if (this.state === BossState.DEAD || this.state === BossState.PHASE_TRANSITION) return;

    const hpPct = this.health / this.maxHealth;

    // Phase 2 transition at 65% HP
    if (hpPct <= 0.65 && !this.hasTransitionedPhase2) {
      this.hasTransitionedPhase2 = true;
      this.phase = 2;
      this.chaseSpeed = 4.8;

      if (this.headMaterial) {
        this.headMaterial.emissive.setHex(0xf59e0b); // Amber glow
      }

      if (this.vfxManager) {
        this.vfxManager.spawnImpactSparks(this.position, 60, 0xf59e0b);
      }

      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification('🔥 PHASE 2: PRIMAL WRATH — Colossus Empowers!');
      }

      this.setState(BossState.PHASE_TRANSITION);
      return;
    }

    // Phase 3 transition at 30% HP
    if (hpPct <= 0.30 && !this.hasTransitionedPhase3) {
      this.hasTransitionedPhase3 = true;
      this.phase = 3;
      this.chaseSpeed = 5.4;

      if (this.headMaterial) {
        this.headMaterial.emissive.setHex(0xef4444); // Crimson / Corrupted glow
      }

      if (this.vfxManager) {
        this.vfxManager.spawnImpactSparks(this.position, 80, 0xef4444);
      }

      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification('⚡ PHASE 3: CORRUPTED OVERDRIVE — Frenzied Attacks!');
      }

      this.setState(BossState.PHASE_TRANSITION);
    }
  }

  updateChase(deltaTime, playerPos, distToPlayer) {
    this.rotateTowards(playerPos.x, playerPos.z, deltaTime);
    this.moveTowards(playerPos.x, playerPos.z, this.chaseSpeed, deltaTime);

    // Pick attack when cooldown expires
    if (this.attackCooldownTimer <= 0) {
      // Phase 2 & 3: Chance to initiate Earth Shatter AoE or Charge
      if (this.phase >= 2 && Math.random() < (this.phase === 3 ? 0.45 : 0.35)) {
        this.initiateAoeWindup();
        return;
      }

      // Charge attack if at medium range (6m - 12m)
      if (distToPlayer >= 5.5 && distToPlayer <= 14.0) {
        this.initiateChargeWindup(playerPos);
        return;
      }

      // Melee Ground Slam if within attack range
      if (distToPlayer <= this.attackRange) {
        this.initiateSlamWindup(playerPos);
      }
    }
  }

  // --- ATTACK 1: Colossus Slam (Melee AoE) ---
  initiateSlamWindup(playerPos) {
    this.setState(BossState.SLAM_WINDUP);
    this.isAttacking = true;

    // Position circular telegraph on ground in front
    const fwd = this.getForwardVector();
    this.slamTelegraph.position.set(
      this.position.x + fwd.x * 2.2,
      this.position.y + 0.08,
      this.position.z + fwd.z * 2.2
    );
    this.slamTelegraph.visible = true;
    this.slamTelegraphFill.scale.set(0.01, 0.01, 0.01);
  }

  updateSlamWindup(deltaTime, playerPos) {
    const windupDuration = this.phase === 3 ? 0.65 : (this.phase === 2 ? 0.75 : 0.85);
    const progress = Math.min(1.0, this.stateTimer / windupDuration);

    // Telegraph expands to fill circle
    this.slamTelegraphFill.scale.set(progress, progress, progress);

    if (this.stateTimer >= windupDuration) {
      this.slamTelegraph.visible = false;
      this.executeSlam(playerPos);
    }
  }

  executeSlam(playerPos) {
    this.isAttacking = false;
    const slamPos = this.slamTelegraph.position;
    const hitDist = Math.hypot(playerPos.x - slamPos.x, playerPos.z - slamPos.z);

    // Camera shake & ground impact VFX
    if (this.vfxManager) {
      this.vfxManager.spawnImpactSparks(slamPos, 40, this.phase === 3 ? 0xef4444 : 0x10b981);
    }
    if (this.audioManager && typeof this.audioManager.playSwordHit === 'function') {
      this.audioManager.playSwordHit();
    }

    // Hit check (3.5m radius from slam center)
    if (hitDist <= 3.5 && this.game && this.game.player) {
      const p = this.game.player;
      if (!p.isInvulnerable) { // Dodge roll i-frames avoid damage!
        const slamDmg = this.damage + (this.phase * 3);
        p.takeDamage(slamDmg);
      }
    }

    // Set cooldown and enter recovery vulnerability window
    this.attackCooldownTimer = this.phase === 3 ? 1.0 : (this.phase === 2 ? 1.3 : 1.6);
    this.setState(BossState.RECOVERY);
  }

  // --- ATTACK 2: Rushing Charge (Linear) ---
  initiateChargeWindup(playerPos) {
    this.setState(BossState.CHARGE_WINDUP);
    this.isAttacking = true;

    // Lock charge direction toward player
    this.chargeDirection.set(playerPos.x - this.position.x, 0, playerPos.z - this.position.z).normalize();
    this.chargeDistanceTraveled = 0;

    // Position rectangular warning lane
    const angle = Math.atan2(this.chargeDirection.x, this.chargeDirection.z);
    this.chargeTelegraph.rotation.z = -angle;
    this.chargeTelegraph.position.set(
      this.position.x + this.chargeDirection.x * (this.chargeMaxDistance / 2),
      this.position.y + 0.08,
      this.position.z + this.chargeDirection.z * (this.chargeMaxDistance / 2)
    );
    this.chargeTelegraph.visible = true;
  }

  updateChargeWindup(deltaTime) {
    const windupDuration = this.phase === 3 ? 0.7 : (this.phase === 2 ? 0.8 : 0.95);
    if (this.stateTimer >= windupDuration) {
      this.chargeTelegraph.visible = false;
      this.setState(BossState.CHARGE);
    }
  }

  updateCharge(deltaTime, playerPos) {
    const step = this.chargeSpeed * deltaTime;
    this.position.x += this.chargeDirection.x * step;
    this.position.z += this.chargeDirection.z * step;
    this.chargeDistanceTraveled += step;

    this.groundToTerrain();

    // Check hit against player along the charge lane
    const distToPlayer = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
    if (distToPlayer <= this.radius + 0.8 && this.game && this.game.player) {
      const p = this.game.player;
      if (!p.isInvulnerable) { // Dodge roll evades charge cleanly
        p.takeDamage(this.damage + 6);
      }
    }

    // Check if reached max charge distance or collided with arena perimeter
    const distFromCenter = Math.hypot(this.position.x - this.center.x, this.position.z - this.center.z);
    const hitWall = distFromCenter >= 14.2;

    if (this.chargeDistanceTraveled >= this.chargeMaxDistance || hitWall) {
      // Wall impact: Colossus staggers for 1.5s (Counterattack opportunity!)
      if (this.vfxManager) {
        this.vfxManager.spawnImpactSparks(this.position, 50, 0xfacc15);
      }
      this.attackCooldownTimer = 1.4;
      this.setState(BossState.STUNNED);
    }
  }

  // --- ATTACK 3: Earth Shatter / Shockwave Ring (AoE) ---
  initiateAoeWindup() {
    this.setState(BossState.AOE_WINDUP);
    this.isAttacking = true;

    this.aoeTelegraph.position.set(this.position.x, this.position.y + 0.08, this.position.z);
    this.aoeTelegraph.visible = true;
  }

  updateAoeWindup(deltaTime, playerPos) {
    const windupDuration = this.phase === 3 ? 0.8 : 1.0;
    if (this.stateTimer >= windupDuration) {
      this.aoeTelegraph.visible = false;
      this.executeAoeShockwave(playerPos);
    }
  }

  executeAoeShockwave(playerPos) {
    this.isAttacking = false;
    const distToPlayer = playerPos ? Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z) : 999;

    // Massive impact shockwave
    if (this.vfxManager) {
      this.vfxManager.spawnImpactSparks(this.position, 65, 0x10b981);
    }

    // Damage check: Player within 8.5m takes damage UNLESS jumping or dodge rolling
    if (distToPlayer <= 8.5 && this.game && this.game.player) {
      const p = this.game.player;
      const isPlayerJumping = !p.isGrounded && p.position.y > this.position.y + 0.6;
      if (!p.isInvulnerable && !isPlayerJumping) {
        p.takeDamage(this.damage + 4);
      }
    }

    this.attackCooldownTimer = this.phase === 3 ? 1.2 : 1.6;
    this.setState(BossState.RECOVERY);
  }

  takeDamage(amount) {
    if (this.state === BossState.DEAD || this.isInvulnerable) return;

    // Bonus damage if staggered / recovering from charge
    const multiplier = (this.state === BossState.STUNNED || this.isStaggered) ? 1.35 : 1.0;
    const finalDamage = Math.round(amount * multiplier);

    this.health = Math.max(0, this.health - finalDamage);

    // Visual feedback
    if (this.vfxManager) {
      this.vfxManager.flashEnemyHit(this);
    }

    // Stagger check from heavy damage
    if (finalDamage >= 90 && this.state !== BossState.CHARGE && this.state !== BossState.SLAM) {
      this.setState(BossState.STUNNED);
    }

    if (this.health <= 0) {
      this.handleDefeat();
    } else {
      this.checkPhaseTransitions();
    }
  }

  handleDefeat() {
    if (this.isDefeated) return;
    this.isDefeated = true;
    this.health = 0;

    // 1. Immediately cancel all attacks and hide all telegraphs
    this.isAttacking = false;
    this.slamTelegraph.visible = false;
    this.chargeTelegraph.visible = false;
    this.aoeTelegraph.visible = false;

    // 2. Play death collapse
    this.setState(BossState.DEAD);

    // 3. Dissolve arena runic barrier
    if (this.arena && typeof this.arena.deactivateBarrier === 'function') {
      this.arena.deactivateBarrier();
    }

    // 4. Award unique boss rewards (Prevent duplicate payout)
    if (!this.hasAwardedRewards && this.game && this.game.player) {
      this.hasAwardedRewards = true;
      const player = this.game.player;

      // Award +400 XP
      if (typeof player.addXP === 'function') {
        player.addXP(400);
      }

      // Award +250 Gold
      player.gold = (player.gold || 0) + 250;

      // Award Rare Equipment & Quest Key Item
      if (player.inventorySystem) {
        player.inventorySystem.addItem('verdant_colossus_aegis', 1);
        player.inventorySystem.addItem('sanctuary_keystone', 1);
      }

      // Add to Quest System completed list
      if (this.questSystem) {
        this.questSystem.completedQuestIds.add('boss-malakor');
        if (this.questSystem.currentQuest) {
          this.questSystem.currentQuest.score = (this.questSystem.currentQuest.score || 0) + 1500;
        }
      }

      // Victory fanfare notification
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification('🏆 VICTORY: አርዌ (ARWE) BANISHED! +400 XP, +250 ብር, Axumite Keystone!');
      }

      // Auto-save defeat state
      if (this.game.saveManager && this.game.gameState === 'PLAYING') {
        this.game.saveManager.saveGame(this.game, 'quicksave');
      }
    }

    // Fade out Boss HUD after 3.5 seconds
    setTimeout(() => {
      if (this.uiManager && typeof this.uiManager.hideBossHUD === 'function') {
        this.uiManager.hideBossHUD();
      }
    }, 3500);
  }

  moveTowards(targetX, targetZ, speed, deltaTime) {
    this._moveDir.set(targetX - this.position.x, 0, targetZ - this.position.z);
    if (this._moveDir.lengthSq() < 0.001) return;

    this._moveDir.normalize();
    const moveDist = speed * deltaTime;
    this.position.x += this._moveDir.x * moveDist;
    this.position.z += this._moveDir.z * moveDist;

    if (this.physicsWorld) {
      this.physicsWorld.resolveCollisions(this.position, this.radius, this.height);
      this.groundToTerrain();
    }
  }

  rotateTowards(targetX, targetZ, deltaTime) {
    const dx = targetX - this.position.x;
    const dz = targetZ - this.position.z;
    if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) return;

    const targetAngle = Math.atan2(dx, dz);
    this._targetQuat.setFromAxisAngle(this._upVec, targetAngle);

    if (this.model) {
      const lerpFactor = 1.0 - Math.exp(-this.turnSpeed * deltaTime);
      this.model.quaternion.slerp(this._targetQuat, lerpFactor);
    }
  }

  getForwardVector() {
    if (this.model) {
      const v = new THREE.Vector3(0, 0, 1);
      v.applyQuaternion(this.model.quaternion);
      v.y = 0;
      return v.normalize();
    }
    return new THREE.Vector3(0, 0, 1);
  }

  getPosition() {
    return this.position;
  }

  isAlive() {
    return !this.isDefeated && this.state !== BossState.DEAD;
  }

  getState() {
    return this.state;
  }

  dispose() {
    if (this.telegraphGroup) {
      this.scene.remove(this.telegraphGroup);
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
  }
}
