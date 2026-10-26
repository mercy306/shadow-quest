import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationController } from './AnimationController.js';

export const EnemyState = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  DETECT: 'DETECT',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  RETURN: 'RETURN',
  STUNNED: 'STUNNED',
  DEAD: 'DEAD'
};

export class Enemy {
  constructor(scene, physicsWorld, config = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;

    this.id = config.id || Math.random().toString(36).substring(2, 9);
    this.name = config.name || 'Shadow Guardian';

    // Entity root group
    this.mesh = new THREE.Group();
    this.position = this.mesh.position;
    this.rotation = this.mesh.rotation;

    this.model = null;
    this.animController = null;
    this.isLoaded = false;

    // Physical dimensions
    this.radius = 0.55;
    this.height = 2.0;

    // Combat stats
    this.maxHealth = config.health || 100;
    this.health = this.maxHealth;
    this.damage = config.damage || 15;
    this.attackRange = config.attackRange || 2.4;
    this.attackCooldown = config.attackCooldown || 1.6;
    this.attackTimer = 0;
    this.isAttacking = false;
    this.attackDuration = 0.9;
    this.attackElapsedTime = 0;

    // Movement speeds (units/sec)
    this.patrolSpeed = 2.0;
    this.chaseSpeed = 4.6;
    this.returnSpeed = 3.0;
    this.turnSpeed = 10.0;

    // Perception & AI state
    this.state = EnemyState.PATROL;
    this.detectionRadius = config.detectionRadius || 16.0;
    this.escapeRadius = this.detectionRadius * 1.6; // Distance player must reach to drop aggro

    // Patrol parameters & waypoints
    this.patrolCenter = config.patrolCenter
      ? config.patrolCenter.clone()
      : new THREE.Vector3(40, 0, -75);

    this.patrolRadius = config.patrolRadius || 8.0;
    this.waypoints = this.generateWaypoints();
    this.currentWaypointIndex = 0;

    // Timers
    this.idleDuration = 2.2;
    this.idleTimer = 0;
    this.detectDuration = 0.7;
    this.detectTimer = 0;
    this.stunDuration = 0.6;
    this.stunTimer = 0;

    // Initial placement at first waypoint
    const startPos = this.waypoints[0] || this.patrolCenter;
    this.position.copy(startPos);
    this.groundToTerrain();

    // Math helpers to avoid GC allocations
    this._moveDir = new THREE.Vector3();
    this._targetQuat = new THREE.Quaternion();
    this._upVec = new THREE.Vector3(0, 1, 0);

    this.scene.add(this.mesh);
    this.createOverheadHUD();
  }

  generateWaypoints() {
    const pts = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = this.patrolCenter.x + Math.cos(angle) * this.patrolRadius;
      const z = this.patrolCenter.z + Math.sin(angle) * this.patrolRadius;
      let y = 0;
      if (this.physicsWorld) {
        y = this.physicsWorld.getGroundHeight(x, z, this.patrolCenter.y);
      }
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }

  groundToTerrain() {
    if (this.physicsWorld) {
      this.position.y = this.physicsWorld.getGroundHeight(this.position.x, this.position.z, this.position.y);
    }
  }

  async init() {
    const loader = new GLTFLoader();
    const modelPath = '/models/EnemyGuardian.glb';

    try {
      const gltf = await loader.loadAsync(modelPath);
      this.model = gltf.scene;

      // Imposing guardian scale
      this.model.scale.set(0.75, 0.75, 0.75);

      // Traversal for shadows and dark ancient golem material styling
      this.model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Shadow Golem dark obsidian / weathered stone materials
          if (child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: child.name.toLowerCase().includes('head') ? 0x0f172a : 0x1e293b,
              roughness: 0.65,
              metalness: 0.45
            });

            // Glowing red runic eyes on head
            if (child.name.toLowerCase().includes('head')) {
              child.material.emissive = new THREE.Color(0xef4444);
              child.material.emissiveIntensity = 0.8;
            }
          }
        }
      });

      this.mesh.add(this.model);

      // Animation Controller setup
      if (gltf.animations && gltf.animations.length > 0) {
        this.animController = new AnimationController(this.model, gltf.animations);
        this.animController.play('Walking', 0.1);
      }

      this.isLoaded = true;
      this.groundToTerrain();

    } catch (err) {
      console.error(`Failed to load Enemy model (${this.name}):`, err);
      this.initFallback();
    }
  }

  initFallback() {
    console.warn(`[Enemy] Initializing fallback proxy for ${this.name}`);
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.0, 8), mat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1.0
    });
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), eyeMat);
    eye.position.set(0, 1.6, 0.45);
    group.add(eye);

    this.mesh.add(group);
    this.isLoaded = true;
    this.groundToTerrain();
  }

  createOverheadHUD() {
    // 3D Canvas sprite for overhead health & state badge
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = 256;
    this.hudCanvas.height = 64;
    this.hudCtx = this.hudCanvas.getContext('2d');

    this.hudTexture = new THREE.CanvasTexture(this.hudCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.hudTexture,
      transparent: true,
      depthTest: false
    });

    this.hudSprite = new THREE.Sprite(spriteMat);
    this.hudSprite.position.set(0, 2.6, 0);
    this.hudSprite.scale.set(2.4, 0.6, 1.0);
    this.mesh.add(this.hudSprite);

    this.updateHUD();
  }

  updateHUD() {
    if (!this.hudCtx) return;
    const ctx = this.hudCtx;
    ctx.clearRect(0, 0, 256, 64);

    // Background pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(8, 6, 240, 52, 10);
    ctx.fill();

    // Name & State text
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = this.state === EnemyState.CHASE || this.state === EnemyState.ATTACK ? '#f87171' : '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name} [${this.state}]`, 128, 26);

    // Health bar container
    const barX = 24;
    const barY = 34;
    const barW = 208;
    const barH = 12;

    ctx.fillStyle = '#334155';
    ctx.fillRect(barX, barY, barW, barH);

    // Health fill
    const pct = Math.max(0, Math.min(1, this.health / this.maxHealth));
    ctx.fillStyle = pct > 0.5 ? '#22c55e' : (pct > 0.25 ? '#eab308' : '#ef4444');
    ctx.fillRect(barX, barY, barW * pct, barH);

    this.hudTexture.needsUpdate = true;
  }

  /**
   * Main Enemy AI State Machine & Physics Loop
   */
  update(deltaTime, playerPosition) {
    if (!this.isLoaded) return;

    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTime;
    }

    // Distance to player
    const distToPlayer = playerPosition
      ? Math.hypot(playerPosition.x - this.position.x, playerPosition.z - this.position.z)
      : Infinity;

    // State Machine
    switch (this.state) {
      case EnemyState.DEAD:
        this.updateDead(deltaTime);
        break;

      case EnemyState.STUNNED:
        this.updateStunned(deltaTime, playerPosition);
        break;

      case EnemyState.ATTACK:
        this.updateAttack(deltaTime, playerPosition, distToPlayer);
        break;

      case EnemyState.CHASE:
        this.updateChase(deltaTime, playerPosition, distToPlayer);
        break;

      case EnemyState.DETECT:
        this.updateDetect(deltaTime, playerPosition, distToPlayer);
        break;

      case EnemyState.RETURN:
        this.updateReturn(deltaTime, playerPosition, distToPlayer);
        break;

      case EnemyState.PATROL:
        this.updatePatrol(deltaTime, distToPlayer);
        break;

      case EnemyState.IDLE:
        this.updateIdle(deltaTime, distToPlayer);
        break;
    }

    // Advance skeletal animation
    if (this.animController) {
      this.animController.update(deltaTime);
    }
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.updateHUD();

    if (!this.animController) return;

    switch (newState) {
      case EnemyState.IDLE:
        this.animController.play('Idle', 0.3);
        break;
      case EnemyState.PATROL:
      case EnemyState.RETURN:
        this.animController.play('Walking', 0.25);
        break;
      case EnemyState.DETECT:
        this.animController.play('Standing', 0.2);
        break;
      case EnemyState.CHASE:
        this.animController.play('Running', 0.2);
        break;
      case EnemyState.ATTACK:
        this.animController.play('Punch', 0.15);
        break;
      case EnemyState.STUNNED:
        this.animController.play('No', 0.15);
        break;
      case EnemyState.DEAD:
        this.animController.play('Death', 0.2);
        break;
    }
  }

  updateIdle(deltaTime, distToPlayer) {
    // Check player detection
    if (distToPlayer <= this.detectionRadius) {
      this.setState(EnemyState.DETECT);
      this.detectTimer = 0;
      return;
    }

    this.idleTimer += deltaTime;
    if (this.idleTimer >= this.idleDuration) {
      this.idleTimer = 0;
      this.setState(EnemyState.PATROL);
    }
  }

  updatePatrol(deltaTime, distToPlayer) {
    // Check player detection
    if (distToPlayer <= this.detectionRadius) {
      this.setState(EnemyState.DETECT);
      this.detectTimer = 0;
      return;
    }

    const targetWaypoint = this.waypoints[this.currentWaypointIndex];
    if (!targetWaypoint) return;

    const distToWaypoint = Math.hypot(targetWaypoint.x - this.position.x, targetWaypoint.z - this.position.z);

    if (distToWaypoint < 0.8) {
      // Arrived at waypoint: pause in idle before proceeding to next
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      this.setState(EnemyState.IDLE);
      return;
    }

    this.moveTowards(targetWaypoint.x, targetWaypoint.z, this.patrolSpeed, deltaTime);
  }

  updateDetect(deltaTime, playerPosition, distToPlayer) {
    // Face the detected player
    if (playerPosition) {
      this.rotateTowards(playerPosition.x, playerPosition.z, deltaTime * 2);
    }

    this.detectTimer += deltaTime;
    if (this.detectTimer >= this.detectDuration) {
      this.setState(EnemyState.CHASE);
    }
  }

  updateChase(deltaTime, playerPosition, distToPlayer) {
    if (!playerPosition) return;

    // Player escaped detection envelope -> return to patrol
    if (distToPlayer > this.escapeRadius) {
      this.setState(EnemyState.RETURN);
      return;
    }

    // Within strike range -> prepare or execute attack
    if (distToPlayer <= this.attackRange) {
      if (this.attackTimer <= 0) {
        this.setState(EnemyState.ATTACK);
        this.isAttacking = true;
        this.attackElapsedTime = 0;
        return;
      } else {
        // In cooldown: face player in alert combat stance
        this.rotateTowards(playerPosition.x, playerPosition.z, deltaTime);
        if (this.animController && this.animController.getCurrentClip() !== 'Idle') {
          this.animController.play('Idle', 0.2);
        }
        return;
      }
    }

    // Pursue player with obstacle avoidance
    this.moveTowards(playerPosition.x, playerPosition.z, this.chaseSpeed, deltaTime);
  }

  updateAttack(deltaTime, playerPosition, distToPlayer) {
    if (playerPosition) {
      this.rotateTowards(playerPosition.x, playerPosition.z, deltaTime);
    }

    this.attackElapsedTime += deltaTime;

    // When attack animation completes
    if (this.attackElapsedTime >= this.attackDuration) {
      this.isAttacking = false;
      this.attackTimer = this.attackCooldown;

      if (distToPlayer > this.escapeRadius) {
        this.setState(EnemyState.RETURN);
      } else {
        this.setState(EnemyState.CHASE);
      }
    }
  }

  updateReturn(deltaTime, playerPosition, distToPlayer) {
    // If player approaches again while returning, re-engage
    if (distToPlayer <= this.detectionRadius) {
      this.setState(EnemyState.CHASE);
      return;
    }

    const homeWaypoint = this.waypoints[0] || this.patrolCenter;
    const distToHome = Math.hypot(homeWaypoint.x - this.position.x, homeWaypoint.z - this.position.z);

    if (distToHome < 1.2) {
      this.setState(EnemyState.PATROL);
      return;
    }

    this.moveTowards(homeWaypoint.x, homeWaypoint.z, this.returnSpeed, deltaTime);
  }

  updateStunned(deltaTime, playerPosition) {
    this.stunTimer += deltaTime;
    if (this.stunTimer >= this.stunDuration) {
      this.stunTimer = 0;
      this.setState(EnemyState.CHASE);
    }
  }

  updateDead(deltaTime) {
    // Dead entity remains disabled on ground
  }

  moveTowards(targetX, targetZ, speed, deltaTime) {
    this._moveDir.set(targetX - this.position.x, 0, targetZ - this.position.z);
    if (this._moveDir.lengthSq() < 0.001) return;

    this._moveDir.normalize();

    const moveDist = speed * deltaTime;
    this.position.x += this._moveDir.x * moveDist;
    this.position.z += this._moveDir.z * moveDist;

    // Obstacle collision resolution: slide around trees, rocks, ruins walls
    if (this.physicsWorld) {
      this.physicsWorld.resolveCollisions(this.position, this.radius, this.height);
      this.position.y = this.physicsWorld.getGroundHeight(this.position.x, this.position.z, this.position.y);
    }

    this.rotateTowards(targetX, targetZ, deltaTime);
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

  takeDamage(amount) {
    if (this.state === EnemyState.DEAD) return;

    this.health = Math.max(0, this.health - amount);
    this.updateHUD();

    if (this.health <= 0) {
      this.setState(EnemyState.DEAD);
    } else {
      this.stunTimer = 0;
      this.setState(EnemyState.STUNNED);
    }
  }

  isAlive() {
    return this.state !== EnemyState.DEAD;
  }

  get isDead() {
    return this.state === EnemyState.DEAD;
  }

  getState() {
    return this.state;
  }
}
