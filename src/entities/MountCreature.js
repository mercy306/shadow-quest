import * as THREE from 'three';

/**
 * Gait / Movement states for MountCreature
 */
export const MountGait = {
  IDLE: 'idle',
  WALK: 'walk',
  TROT: 'trot',
  CANTER: 'canter',
  GALLOP: 'gallop',
  REVERSE: 'reverse'
};

/**
 * MountCreature — Usable Warhorse / Shadow Steed riding companion.
 * Integrates with third-person player controller, ground physics, and obstacle collisions.
 */
export class MountCreature {
  constructor(scene, physicsWorld = null, environment = null, config = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.environment = environment;

    this.id = config.id || 'mount-shadow-steed';
    this.name = config.name || 'Shadow Steed';
    this.stageIndex = config.stageIndex !== undefined ? config.stageIndex : 0;

    // Physical dimensions
    this.radius = 0.85; // Horse collision radius
    this.height = 2.1;

    // Mount State
    this.isMounted = false;
    this.rider = null;
    this.speed = 0.0;
    this.targetSpeed = 0.0;

    // Speed capabilities (m/s)
    this.reverseSpeed = -2.8;
    this.walkSpeed = 5.5;
    this.trotSpeed = 8.5;
    this.gallopSpeed = 14.8;
    this.acceleration = 14.0;
    this.deceleration = 18.0;
    this.turnSpeed = 2.8;

    this.currentGait = MountGait.IDLE;
    this.isGalloping = false;

    // Animation & Sound timers
    this.animTimer = 0.0;
    this.hoofTimer = 0.0;
    this.idleTimer = 0.0;

    // Spatial & Scene Hierarchy
    this.mesh = new THREE.Group();
    this.mesh.name = this.id;
    this.position = this.mesh.position;
    this.rotation = this.mesh.rotation;

    // Initial position
    const initX = config.x !== undefined ? config.x : 8.0;
    const initZ = config.z !== undefined ? config.z : -12.0;
    let initY = config.y !== undefined ? config.y : 0;
    if (this.physicsWorld) {
      initY = this.physicsWorld.getGroundHeight(initX, initZ, initY);
    }
    this.position.set(initX, initY, initZ);
    this.rotation.y = config.rotationY !== undefined ? config.rotationY : Math.PI * 0.8;

    // Articulated limbs registry for animations
    this.limbs = {};
    this.buildModel();

    this.scene.add(this.mesh);
  }

  /**
   * Constructs the articulated 3D warhorse model hierarchy
   */
  buildModel() {
    // Materials
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b18, // Rich dark ebony / obsidian coat
      roughness: 0.65,
      metalness: 0.2
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d, // Weathered dark saddle leather
      roughness: 0.55,
      metalness: 0.15
    });
    const blanketMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f, // Imperial navy saddle blanket with gold trim
      roughness: 0.85,
      metalness: 0.1
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished brass stirrups & buckles
      roughness: 0.35,
      metalness: 0.85
    });
    const maneMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Flowing midnight dark mane & tail
      roughness: 0.9,
      metalness: 0.05
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Arcane celestial glow
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5
    });
    const hoofMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Iron-shod dark hooves
      roughness: 0.45,
      metalness: 0.65
    });

    // 1. Torso & Barrel (Muscular horse ribcage and flank)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.15, 0);
    this.mesh.add(torsoGroup);
    this.limbs.torso = torsoGroup;

    // Main barrel
    const barrelGeom = new THREE.CylinderGeometry(0.48, 0.52, 1.45, 12);
    barrelGeom.rotateX(Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeom, coatMat);
    barrelMesh.castShadow = true;
    barrelMesh.receiveShadow = true;
    torsoGroup.add(barrelMesh);

    // Muscular Chest
    const chestGeom = new THREE.SphereGeometry(0.5, 12, 10);
    chestGeom.scale(0.9, 1.05, 1.0);
    const chestMesh = new THREE.Mesh(chestGeom, coatMat);
    chestMesh.position.set(0, 0.06, 0.72);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    torsoGroup.add(chestMesh);

    // Powerful Haunches (Rear Rump)
    const rumpGeom = new THREE.SphereGeometry(0.52, 12, 10);
    rumpGeom.scale(0.95, 1.05, 1.0);
    const rumpMesh = new THREE.Mesh(rumpGeom, coatMat);
    rumpMesh.position.set(0, 0.05, -0.68);
    rumpMesh.castShadow = true;
    rumpMesh.receiveShadow = true;
    torsoGroup.add(rumpMesh);

    // 2. Saddle & Tack
    // Saddle blanket with traditional Ethiopian Tibeb embroidered borders
    const blanketGeom = new THREE.BoxGeometry(0.85, 0.04, 0.88);
    const blanketMesh = new THREE.Mesh(blanketGeom, blanketMat);
    blanketMesh.position.set(0, 0.44, 0.02);
    blanketMesh.castShadow = true;
    torsoGroup.add(blanketMesh);

    // Tibeb tricolor embroidery trim (green, gold, red) along both flanks
    const tibebColors = [0x15803d, 0xeab308, 0xb91c1c];
    [-0.43, 0.43].forEach(xSide => {
      tibebColors.forEach((col, idx) => {
        const stripeMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 });
        const stripeGeom = new THREE.BoxGeometry(0.015, 0.02, 0.86);
        const stripe = new THREE.Mesh(stripeGeom, stripeMat);
        stripe.position.set(xSide, 0.42 - idx * 0.025, 0.02);
        torsoGroup.add(stripe);
      });
    });

    // Leather saddle seat with pommel and cantle
    const saddleGroup = new THREE.Group();
    saddleGroup.position.set(0, 0.47, 0.02);
    torsoGroup.add(saddleGroup);
    this.limbs.saddle = saddleGroup;

    const seatGeom = new THREE.BoxGeometry(0.68, 0.08, 0.62);
    const seatMesh = new THREE.Mesh(seatGeom, leatherMat);
    seatMesh.castShadow = true;
    saddleGroup.add(seatMesh);

    // Pommel (front rise)
    const pommelGeom = new THREE.BoxGeometry(0.42, 0.16, 0.1);
    const pommelMesh = new THREE.Mesh(pommelGeom, leatherMat);
    pommelMesh.position.set(0, 0.08, 0.28);
    saddleGroup.add(pommelMesh);

    // Cantle (rear rise)
    const cantleGeom = new THREE.BoxGeometry(0.46, 0.18, 0.1);
    const cantleMesh = new THREE.Mesh(cantleGeom, leatherMat);
    cantleMesh.position.set(0, 0.09, -0.28);
    saddleGroup.add(cantleMesh);

    // Stirrups (Left and Right)
    [-0.42, 0.42].forEach((xSide) => {
      const strapGeom = new THREE.BoxGeometry(0.03, 0.52, 0.05);
      const strap = new THREE.Mesh(strapGeom, leatherMat);
      strap.position.set(xSide, -0.24, 0.04);
      saddleGroup.add(strap);

      const stirrupGeom = new THREE.TorusGeometry(0.08, 0.02, 6, 12);
      const stirrup = new THREE.Mesh(stirrupGeom, metalMat);
      stirrup.position.set(xSide, -0.5, 0.04);
      saddleGroup.add(stirrup);
    });

    // 3. Neck & Head
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 0.28, 0.75);
    torsoGroup.add(neckGroup);
    this.limbs.neck = neckGroup;

    // Muscular Arched Neck
    const neckGeom = new THREE.CylinderGeometry(0.24, 0.36, 0.85, 10);
    neckGeom.rotateX(-0.48);
    const neckMesh = new THREE.Mesh(neckGeom, coatMat);
    neckMesh.position.set(0, 0.32, 0.22);
    neckMesh.castShadow = true;
    neckGroup.add(neckMesh);

    // Mane along neck crest
    const maneGeom = new THREE.BoxGeometry(0.12, 0.82, 0.35);
    maneGeom.rotateX(-0.48);
    const maneMesh = new THREE.Mesh(maneGeom, maneMat);
    maneMesh.position.set(0, 0.38, 0.16);
    neckGroup.add(maneMesh);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.65, 0.46);
    neckGroup.add(headGroup);
    this.limbs.head = headGroup;

    // Skull & Forehead
    const skullGeom = new THREE.BoxGeometry(0.32, 0.35, 0.45);
    skullGeom.rotateX(0.22);
    const skullMesh = new THREE.Mesh(skullGeom, coatMat);
    skullMesh.castShadow = true;
    headGroup.add(skullMesh);

    // Tapered Muzzle & Nostrils
    const muzzleGeom = new THREE.BoxGeometry(0.24, 0.22, 0.42);
    const muzzleMesh = new THREE.Mesh(muzzleGeom, coatMat);
    muzzleMesh.position.set(0, -0.16, 0.32);
    muzzleMesh.castShadow = true;
    headGroup.add(muzzleMesh);

    // Bridle & Reins
    const bridleBandGeom = new THREE.BoxGeometry(0.26, 0.04, 0.26);
    const bridleBand = new THREE.Mesh(bridleBandGeom, leatherMat);
    bridleBand.position.set(0, -0.1, 0.28);
    headGroup.add(bridleBand);

    // Reins running from head bit back to saddle
    [-0.14, 0.14].forEach((xSide) => {
      const reinGeom = new THREE.CylinderGeometry(0.015, 0.015, 1.25, 6);
      reinGeom.rotateX(Math.PI / 2.7);
      const reinMesh = new THREE.Mesh(reinGeom, leatherMat);
      reinMesh.position.set(xSide, -0.22, -0.5);
      headGroup.add(reinMesh);
    });

    // Glowing Arcane Eyes
    [-0.17, 0.17].forEach((xSide) => {
      const eyeGeom = new THREE.SphereGeometry(0.05, 8, 8);
      const eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
      eyeMesh.position.set(xSide, 0.05, 0.16);
      headGroup.add(eyeMesh);
    });

    // Pointed Alert Ears
    [-0.11, 0.11].forEach((xSide) => {
      const earGeom = new THREE.ConeGeometry(0.06, 0.22, 5);
      earGeom.rotateX(-0.25);
      const earMesh = new THREE.Mesh(earGeom, coatMat);
      earMesh.position.set(xSide, 0.24, -0.05);
      earMesh.castShadow = true;
      headGroup.add(earMesh);
    });

    // Authentic Simien Walia Horns & Axumite Headwear
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x2b221a,
      roughness: 0.7,
      metalness: 0.25
    });
    [-0.08, 0.08].forEach((xSide) => {
      const hornGroup = new THREE.Group();
      hornGroup.position.set(xSide, 0.26, 0.02);
      // Swept-back arch characteristic of Simien Walia Ibex
      const segments = 6;
      for (let s = 0; s < segments; s++) {
        const segR = 0.05 * (1 - (s / segments) * 0.7);
        const segLen = 0.16;
        const segGeom = new THREE.CylinderGeometry(segR * 0.82, segR, segLen, 8);
        const segMesh = new THREE.Mesh(segGeom, hornMat);
        segMesh.position.set(0, s * 0.11, -Math.pow(s * 0.14, 1.45));
        segMesh.rotation.x = -0.32 - s * 0.22;
        segMesh.rotation.z = (xSide > 0 ? 1 : -1) * 0.12;
        segMesh.castShadow = true;
        hornGroup.add(segMesh);

        // Ribbed ridges on the horn front edge
        if (s > 0) {
          const ridgeGeom = new THREE.TorusGeometry(segR * 0.95, 0.012, 4, 8);
          const ridge = new THREE.Mesh(ridgeGeom, metalMat);
          ridge.position.copy(segMesh.position);
          ridge.rotation.copy(segMesh.rotation);
          hornGroup.add(ridge);
        }
      }
      headGroup.add(hornGroup);
    });

    // Traditional Ethiopian forehead brass medallion (Meskel / Rosette)
    const medalGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 8);
    medalGeom.rotateX(Math.PI / 2);
    const medallion = new THREE.Mesh(medalGeom, metalMat);
    medallion.position.set(0, 0.08, 0.35);
    headGroup.add(medallion);

    // 4. Flowing Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.22, -0.78);
    torsoGroup.add(tailGroup);
    this.limbs.tail = tailGroup;

    const tailGeom = new THREE.CylinderGeometry(0.08, 0.18, 0.95, 8);
    tailGeom.rotateX(0.32);
    const tailMesh = new THREE.Mesh(tailGeom, maneMat);
    tailMesh.position.set(0, -0.36, -0.18);
    tailMesh.castShadow = true;
    tailGroup.add(tailMesh);

    // 5. Four Articulated Legs (Shoulder/Haunch, Knee/Hock, Cannon, Hoof)
    const createLeg = (isFront, isRight) => {
      const legRoot = new THREE.Group();
      const xOffset = isRight ? 0.32 : -0.32;
      const zOffset = isFront ? 0.52 : -0.52;
      legRoot.position.set(xOffset, -0.15, zOffset);
      torsoGroup.add(legRoot);

      // Upper Leg (Thigh / Shoulder)
      const upperGeom = new THREE.CylinderGeometry(0.16, 0.12, 0.55, 8);
      const upperMesh = new THREE.Mesh(upperGeom, coatMat);
      upperMesh.position.set(0, -0.24, 0);
      upperMesh.castShadow = true;
      legRoot.add(upperMesh);

      // Knee / Hock Joint
      const jointGroup = new THREE.Group();
      jointGroup.position.set(0, -0.52, 0);
      legRoot.add(jointGroup);

      // Lower Leg (Shin / Cannon bone)
      const lowerGeom = new THREE.CylinderGeometry(0.11, 0.085, 0.52, 8);
      const lowerMesh = new THREE.Mesh(lowerGeom, coatMat);
      lowerMesh.position.set(0, -0.22, 0);
      lowerMesh.castShadow = true;
      jointGroup.add(lowerMesh);

      // Hoof
      const hoofGeom = new THREE.CylinderGeometry(0.085, 0.12, 0.14, 8);
      const hoofMesh = new THREE.Mesh(hoofGeom, hoofMat);
      hoofMesh.position.set(0, -0.46, 0.02);
      hoofMesh.castShadow = true;
      jointGroup.add(hoofMesh);

      return { root: legRoot, joint: jointGroup };
    };

    this.limbs.legFL = createLeg(true, false);
    this.limbs.legFR = createLeg(true, true);
    this.limbs.legBL = createLeg(false, false);
    this.limbs.legBR = createLeg(false, true);
  }

  /**
   * World coordinates of the mount's saddle seat (where the player sits)
   */
  getSaddlePosition() {
    // Saddle center is at y = 1.38, z = 0.0 relative to mount root
    const offset = new THREE.Vector3(0, 1.38, 0.02);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    return this.position.clone().add(offset);
  }

  /**
   * Validates whether player can mount (distance, health, state, line-of-sight)
   */
  canMount(player, maxDist = 3.8) {
    if (!player) return { allowed: false, reason: 'Player not found.' };

    if (player.health <= 0) {
      return { allowed: false, reason: 'Cannot mount while defeated.' };
    }

    if (player.isRolling) {
      return { allowed: false, reason: 'Cannot mount while dodge rolling.' };
    }

    if (player.isAttacking || player.isHeavyAttacking) {
      return { allowed: false, reason: 'Cannot mount in the middle of an attack.' };
    }

    const dist = Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z);
    if (dist > maxDist) {
      return { allowed: false, reason: 'Mount is too far away.' };
    }

    // Line of sight check (cannot mount through walls or solid boulders)
    if (this.physicsWorld && typeof this.physicsWorld.hasLineOfSight === 'function') {
      const eyePos = new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z);
      const mountCenter = new THREE.Vector3(this.position.x, this.position.y + 1.2, this.position.z);
      const hasLOS = this.physicsWorld.hasLineOfSight(eyePos, mountCenter);
      if (!hasLOS) {
        return { allowed: false, reason: 'Line of sight to mount is blocked by an obstacle.' };
      }
    }

    return { allowed: true };
  }

  /**
   * Mounts the player onto the steed
   */
  mount(player, cameraManager = null, force = false) {
    if (!force) {
      const check = this.canMount(player);
      if (!check.allowed) {
        return false;
      }
    }

    this.isMounted = true;
    this.rider = player;

    // Attach player to mount
    player.isRiding = true;
    player.currentMount = this;

    // Position rider directly on saddle
    const saddlePos = this.getSaddlePosition();
    player.position.copy(saddlePos);
    if (player.model) player.model.rotation.y = this.rotation.y;
    player.mesh.rotation.y = this.rotation.y;

    // Play seated/idle posture
    if (player.animController) {
      player.animController.play('Idle', 0.2);
    }

    // Adjust camera to riding mode (elevated view, pulled back)
    if (cameraManager && typeof cameraManager.setRidingMode === 'function') {
      cameraManager.setRidingMode(true);
    }

    return true;
  }

  /**
   * Dismounts the rider onto safe, clear adjacent terrain
   */
  dismount(cameraManager = null) {
    if (!this.rider) {
      this.isMounted = false;
      return true;
    }

    const player = this.rider;

    // Find safe, obstacle-free placement for dismounted player
    const safePos = this.findSafeDismountSpot();

    player.isRiding = false;
    player.currentMount = null;
    this.isMounted = false;
    this.rider = null;
    this.speed = 0;
    this.targetSpeed = 0;

    // Place player at safe spot
    player.position.copy(safePos);
    if (this.physicsWorld) {
      this.physicsWorld.resolveCollisions(player.position, player.radius, player.height);
      player.position.y = this.physicsWorld.getGroundHeight(player.position.x, player.position.z, player.position.y);
    }

    // Restore standard camera
    if (cameraManager && typeof cameraManager.setRidingMode === 'function') {
      cameraManager.setRidingMode(false);
    }

    return true;
  }

  /**
   * Finds an obstacle-free, grounded dismount location beside the horse
   */
  findSafeDismountSpot() {
    const testOffsets = [
      new THREE.Vector3(-1.75, 0, 0), // Left side
      new THREE.Vector3(1.75, 0, 0),  // Right side
      new THREE.Vector3(0, 0, 2.0),   // Rear
      new THREE.Vector3(0, 0, -2.0)   // Front
    ];

    for (const offset of testOffsets) {
      const candidate = offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y).add(this.position);

      let groundY = this.position.y;
      if (this.physicsWorld) {
        groundY = this.physicsWorld.getGroundHeight(candidate.x, candidate.z, groundY);
      }
      candidate.y = groundY;

      // Check collision clearance against nearby obstacles
      if (this.physicsWorld && typeof this.physicsWorld.getNearbyColliders === 'function') {
        const colliders = this.physicsWorld.getNearbyColliders(candidate.x, candidate.z, 1.0);
        let blocked = false;
        for (const col of colliders) {
          if (col.test(candidate.x, candidate.y + 0.9, candidate.z, 0.45, 1.8)) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          return candidate;
        }
      } else {
        return candidate;
      }
    }

    // Fallback: slightly offset left
    const fallback = new THREE.Vector3(-1.5, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y).add(this.position);
    return fallback;
  }

  /**
   * Safely recovers the mount near the player when whistled/called,
   * without teleporting through or inside solid obstacles.
   */
  recoverToSafeLocation(playerPos, physicsWorld = this.physicsWorld) {
    if (!playerPos) return false;

    // Search 8 radial directions around player at 2.4m radius (close enough to mount immediately)
    const count = 8;
    const testRadius = 2.4;
    let bestSpot = null;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const cx = playerPos.x + Math.sin(angle) * testRadius;
      const cz = playerPos.z + Math.cos(angle) * testRadius;
      let cy = playerPos.y;

      if (physicsWorld) {
        cy = physicsWorld.getGroundHeight(cx, cz, cy);
      }

      // Check that spot is free of solid colliders
      let isClear = true;
      if (physicsWorld && typeof physicsWorld.getNearbyColliders === 'function') {
        const colliders = physicsWorld.getNearbyColliders(cx, cz, this.radius + 0.3);
        for (const col of colliders) {
          if (col.test(cx, cy + 1.0, cz, this.radius, this.height)) {
            isClear = false;
            break;
          }
        }
      }

      // Check line of sight from player to candidate spot
      if (isClear && physicsWorld && typeof physicsWorld.hasLineOfSight === 'function') {
        const playerEye = new THREE.Vector3(playerPos.x, playerPos.y + 1.6, playerPos.z);
        const spotEye = new THREE.Vector3(cx, cy + 1.2, cz);
        isClear = physicsWorld.hasLineOfSight(playerEye, spotEye);
      }

      if (isClear) {
        bestSpot = new THREE.Vector3(cx, cy, cz);
        break;
      }
    }

    if (bestSpot) {
      this.position.copy(bestSpot);
      // Face towards player
      const dirX = playerPos.x - this.position.x;
      const dirZ = playerPos.z - this.position.z;
      this.rotation.y = Math.atan2(dirX, dirZ);
      this.speed = 0;
      this.targetSpeed = 0;
      return true;
    }

    return false;
  }

  /**
   * Main Riding & Physics Update Loop
   */
  update(deltaTime, playerInputKeys = null, cameraManager = null, audioManager = null) {
    if (this.isMounted && this.rider) {
      this.updateRiding(deltaTime, playerInputKeys, cameraManager, audioManager);
    } else {
      this.updateIdle(deltaTime);
    }
  }

  /**
   * Riding physics & locomotion control
   */
  updateRiding(deltaTime, keys, cameraManager, audioManager) {
    const pKeys = keys || (this.rider ? this.rider.keys : {});

    // 1. Steering & Angular Rotation
    let turnInput = 0;
    if (pKeys.left) turnInput += 1;
    if (pKeys.right) turnInput -= 1;

    if (turnInput !== 0) {
      this.rotation.y += turnInput * this.turnSpeed * deltaTime;
    }

    // 2. Speed Throttle & Acceleration
    let desiredSpeed = 0;
    const isShiftHeld = pKeys.shift || pKeys.run;

    if (pKeys.forward) {
      if (isShiftHeld) {
        desiredSpeed = this.gallopSpeed;
        this.currentGait = MountGait.GALLOP;
        this.isGalloping = true;
      } else {
        desiredSpeed = this.trotSpeed;
        this.currentGait = MountGait.TROT;
        this.isGalloping = false;
      }
    } else if (pKeys.backward) {
      desiredSpeed = this.reverseSpeed;
      this.currentGait = MountGait.REVERSE;
      this.isGalloping = false;
    } else {
      desiredSpeed = 0;
      this.currentGait = MountGait.IDLE;
      this.isGalloping = false;
    }

    this.targetSpeed = desiredSpeed;

    // Smooth acceleration / deceleration
    const accRate = Math.abs(desiredSpeed) > Math.abs(this.speed) ? this.acceleration : this.deceleration;
    this.speed = THREE.MathUtils.lerp(this.speed, this.targetSpeed, Math.min(1.0, deltaTime * accRate));

    if (Math.abs(this.speed) < 0.05 && this.targetSpeed === 0) {
      this.speed = 0;
    }

    // 3. Movement Step & Collision Resolution
    if (this.speed !== 0) {
      const forwardX = Math.sin(this.rotation.y);
      const forwardZ = Math.cos(this.rotation.y);

      this.position.x += forwardX * this.speed * deltaTime;
      this.position.z += forwardZ * this.speed * deltaTime;

      // Resolve obstacle collisions with smooth surface sliding
      if (this.physicsWorld) {
        this.physicsWorld.resolveCollisions(this.position, this.radius, this.height);
      }

      // 4. Hoofbeat Rhythmic Audio
      this.hoofTimer -= deltaTime;
      if (this.hoofTimer <= 0) {
        const speedRatio = Math.abs(this.speed) / this.gallopSpeed;
        this.hoofTimer = this.isGalloping ? 0.22 : (this.speed < 0 ? 0.55 : 0.38);

        if (audioManager && typeof audioManager.playHoofbeat === 'function') {
          audioManager.playHoofbeat(0.18 + speedRatio * 0.16);
        }
      }
    }

    // 5. Ground Height Clamping
    if (this.physicsWorld) {
      this.position.y = this.physicsWorld.getGroundHeight(this.position.x, this.position.z, this.position.y);
    } else if (this.environment) {
      this.position.y = this.environment.getTerrainHeight(this.position.x, this.position.z);
    }

    // 6. Synchronize Rider to Mount Saddle
    if (this.rider) {
      const saddlePos = this.getSaddlePosition();
      this.rider.position.copy(saddlePos);
      this.rider.mesh.rotation.y = this.rotation.y;
      if (this.rider.model) this.rider.model.rotation.y = this.rotation.y;

      // Lock rider foot locomotion and play seated animation
      if (this.rider.animController) {
        if (this.rider.animController.getCurrentClip() !== 'Idle') {
          this.rider.animController.play('Idle', 0.2);
        }
        this.rider.animController.update(deltaTime);
      }
    }

    // 7. Update Gait Animations
    this.animateGait(deltaTime);
  }

  /**
   * Idle breathing & ground resting
   */
  updateIdle(deltaTime) {
    this.idleTimer += deltaTime;
    this.currentGait = MountGait.IDLE;
    this.isGalloping = false;
    this.speed = 0;

    // Ground clamping while unmounted
    if (this.physicsWorld) {
      this.position.y = this.physicsWorld.getGroundHeight(this.position.x, this.position.z, this.position.y);
    }

    // Gentle idle breathing sway and tail swish
    if (this.limbs.torso) {
      const breath = Math.sin(this.idleTimer * 1.8) * 0.015;
      this.limbs.torso.scale.set(1.0 + breath, 1.0 + breath * 0.8, 1.0);
    }
    if (this.limbs.tail) {
      this.limbs.tail.rotation.z = Math.sin(this.idleTimer * 1.5) * 0.18;
    }
    if (this.limbs.head) {
      this.limbs.head.rotation.x = Math.sin(this.idleTimer * 1.2) * 0.06;
    }

    // Reset legs to neutral resting position
    const resetLeg = (leg) => {
      if (!leg) return;
      leg.root.rotation.x = THREE.MathUtils.lerp(leg.root.rotation.x, 0, deltaTime * 6);
      leg.joint.rotation.x = THREE.MathUtils.lerp(leg.joint.rotation.x, 0, deltaTime * 6);
    };
    resetLeg(this.limbs.legFL);
    resetLeg(this.limbs.legFR);
    resetLeg(this.limbs.legBL);
    resetLeg(this.limbs.legBR);
  }

  /**
   * Procedural trot, canter, and gallop articulated leg kinematics
   */
  animateGait(deltaTime) {
    if (this.speed === 0) {
      this.updateIdle(deltaTime);
      return;
    }

    const gaitSpeed = Math.abs(this.speed);
    const animFreq = this.isGalloping ? 14.0 : 9.5;
    this.animTimer += deltaTime * animFreq;

    const t = this.animTimer;
    const strideAmp = this.isGalloping ? 0.75 : 0.48;

    // Diagonal-pair trotting / galloping articulation
    // Leg FL & BR swing together; FR & BL swing in opposition
    if (this.limbs.legFL) {
      this.limbs.legFL.root.rotation.x = Math.sin(t) * strideAmp;
      this.limbs.legFL.joint.rotation.x = Math.max(0, -Math.sin(t + 0.3) * strideAmp * 1.2);
    }
    if (this.limbs.legBR) {
      this.limbs.legBR.root.rotation.x = Math.sin(t + 0.25) * strideAmp;
      this.limbs.legBR.joint.rotation.x = Math.max(0, -Math.sin(t + 0.55) * strideAmp * 1.2);
    }
    if (this.limbs.legFR) {
      this.limbs.legFR.root.rotation.x = Math.sin(t + Math.PI) * strideAmp;
      this.limbs.legFR.joint.rotation.x = Math.max(0, -Math.sin(t + Math.PI + 0.3) * strideAmp * 1.2);
    }
    if (this.limbs.legBL) {
      this.limbs.legBL.root.rotation.x = Math.sin(t + Math.PI + 0.25) * strideAmp;
      this.limbs.legBL.joint.rotation.x = Math.max(0, -Math.sin(t + Math.PI + 0.55) * strideAmp * 1.2);
    }

    // Dynamic torso suspension bobbing
    if (this.limbs.torso) {
      const bobbing = Math.abs(Math.sin(t)) * (this.isGalloping ? 0.08 : 0.045);
      this.limbs.torso.position.y = 1.15 + bobbing;
      this.limbs.torso.rotation.x = (this.speed > 0 ? 0.04 : -0.04);
    }

    // Neck and tail extension during gallop
    if (this.limbs.neck) {
      this.limbs.neck.rotation.x = Math.sin(t * 0.5) * 0.08 + (this.isGalloping ? 0.12 : 0);
    }
    if (this.limbs.tail) {
      this.limbs.tail.rotation.x = this.isGalloping ? 0.45 : 0.25;
      this.limbs.tail.rotation.z = Math.sin(t) * 0.2;
    }
  }

  /**
   * Captures serializable mount state for game saves
   */
  getSaveState() {
    return {
      id: this.id,
      name: this.name,
      stageIndex: this.stageIndex,
      isMounted: this.isMounted,
      position: {
        x: Math.round(this.position.x * 100) / 100,
        y: Math.round(this.position.y * 100) / 100,
        z: Math.round(this.position.z * 100) / 100
      },
      rotationY: Math.round(this.rotation.y * 1000) / 1000
    };
  }

  /**
   * Restores mount state from saved data
   */
  restoreSaveState(state) {
    if (!state) return;
    if (typeof state.stageIndex === 'number') this.stageIndex = state.stageIndex;
    if (state.position) {
      this.position.set(state.position.x, state.position.y, state.position.z);
    }
    if (typeof state.rotationY === 'number') {
      this.rotation.y = state.rotationY;
    }
  }

  dispose() {
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      }
    });
  }
}
