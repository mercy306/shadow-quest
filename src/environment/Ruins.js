import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { CircleCollider, BoxCollider } from '../physics/Colliders.js';

export class Ruins {
  constructor(scene, terrain, physicsWorld = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.physicsWorld = physicsWorld;
    this.origin = new THREE.Vector3(40, 0, -75);
    this.origin.y = this.terrain.getTerrainHeight(this.origin.x, this.origin.z);

    this.group = new THREE.Group();
    this.group.position.copy(this.origin);

    this.isEntranceUnlocked = false;

    this.initMaterials();
    this.buildRuins();
    this.initPhysics();
    this.scene.add(this.group);
  }

  initMaterials() {
    const stoneTex = TextureGenerator.createStoneTexture(512);

    this.stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: false
    });

    this.ancientAltarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.7
    });

    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });

    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });

    this.portalBeamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
  }

  buildRuins() {
    // 1. Foundation Platform (octagonal stone courtyard)
    const platformGeo = new THREE.CylinderGeometry(14, 15, 1.2, 8);
    const platform = new THREE.Mesh(platformGeo, this.stoneMat);
    platform.position.y = 0.6;
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.group.add(platform);

    // 2. Entrance Steps (facing southwest toward the incoming forest path)
    for (let step = 0; step < 4; step++) {
      const stepGeo = new THREE.BoxGeometry(6 - step * 0.4, 0.35, 1.4);
      const stepMesh = new THREE.Mesh(stepGeo, this.stoneMat);
      stepMesh.position.set(-8.5 - step * 1.1, 0.18 + step * 0.28, 9.5 + step * 1.1);
      stepMesh.rotation.y = Math.PI / 4;
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      this.group.add(stepMesh);
    }

    // 3. Ancient Portal / Grand Archway at the platform entrance
    this.buildArchway(new THREE.Vector3(-7, 1.2, 7), Math.PI / 4);

    // 4. Perimeter Pillars & Broken Columns
    const pillarCount = 8;
    const radius = 11;
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      if (angle > 1.8 && angle < 2.6) continue;

      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      const isBroken = i % 2 === 1;
      const pillarH = isBroken ? 2.5 + Math.random() * 2.0 : 7.0;

      this.buildPillar(px, 1.2, pz, pillarH, !isBroken);

      if (isBroken) {
        const fallenDrumGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.8, 12);
        const fallenDrum = new THREE.Mesh(fallenDrumGeo, this.stoneMat);
        fallenDrum.position.set(px * 0.8 + (Math.random() - 0.5) * 2, 1.6, pz * 0.8 + (Math.random() - 0.5) * 2);
        fallenDrum.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        fallenDrum.rotation.y = Math.random() * Math.PI;
        fallenDrum.castShadow = true;
        fallenDrum.receiveShadow = true;
        this.group.add(fallenDrum);
      }
    }

    // 5. Crumbling Wall Segments along northern back perimeter
    this.buildCurvedWallSection(radius, 0, Math.PI * 0.7);

    // 6. Central Altar Dais & Ethereal Focus (Exit Goal)
    const altarBaseGeo = new THREE.CylinderGeometry(2.8, 3.2, 0.8, 6);
    const altarBase = new THREE.Mesh(altarBaseGeo, this.stoneMat);
    altarBase.position.y = 1.6;
    altarBase.castShadow = true;
    altarBase.receiveShadow = true;
    this.group.add(altarBase);

    const altarTopGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.9, 6);
    const altarTop = new THREE.Mesh(altarTopGeo, this.ancientAltarMat);
    altarTop.position.y = 2.45;
    altarTop.castShadow = true;
    this.group.add(altarTop);

    // Floating Ancient Crystal / Core
    const crystalGeo = new THREE.OctahedronGeometry(0.65, 0);
    this.crystal = new THREE.Mesh(crystalGeo, this.crystalMat);
    this.crystal.position.y = 3.8;
    this.crystal.castShadow = true;
    this.group.add(this.crystal);

    // Ambient runic glow
    this.altarLight = new THREE.PointLight(0x38bdf8, 2.0, 16, 1.8);
    this.altarLight.position.y = 4.0;
    this.group.add(this.altarLight);

    // Exit Portal Sky Beam (activates upon unlock)
    const beamGeo = new THREE.CylinderGeometry(1.8, 2.4, 40, 16, 1, true);
    this.portalBeam = new THREE.Mesh(beamGeo, this.portalBeamMat);
    this.portalBeam.position.y = 20;
    this.portalBeam.visible = false;
    this.group.add(this.portalBeam);
  }

  buildPillar(x, y, z, height, hasCapital = true) {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, y, z);

    const shaftGeo = new THREE.CylinderGeometry(0.65, 0.75, height, 12);
    const shaft = new THREE.Mesh(shaftGeo, this.stoneMat);
    shaft.position.y = height / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pGroup.add(shaft);

    const plinthGeo = new THREE.BoxGeometry(1.8, 0.5, 1.8);
    const plinth = new THREE.Mesh(plinthGeo, this.stoneMat);
    plinth.position.y = 0.25;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    pGroup.add(plinth);

    if (hasCapital) {
      const capGeo = new THREE.BoxGeometry(1.9, 0.6, 1.9);
      const cap = new THREE.Mesh(capGeo, this.stoneMat);
      cap.position.y = height + 0.3;
      cap.castShadow = true;
      pGroup.add(cap);
    }

    this.group.add(pGroup);
  }

  buildArchway(position, rotationY) {
    const archGroup = new THREE.Group();
    archGroup.position.copy(position);
    archGroup.rotation.y = rotationY;

    // Columns
    const colLGeo = new THREE.BoxGeometry(1.2, 6.5, 1.2);
    const colL = new THREE.Mesh(colLGeo, this.stoneMat);
    colL.position.set(-2.5, 3.25, 0);
    colL.castShadow = true;
    colL.receiveShadow = true;
    archGroup.add(colL);

    const colR = new THREE.Mesh(colLGeo, this.stoneMat);
    colR.position.set(2.5, 3.25, 0);
    colR.castShadow = true;
    colR.receiveShadow = true;
    archGroup.add(colR);

    // Lintel Header Beam
    const lintelGeo = new THREE.BoxGeometry(6.6, 1.1, 1.6);
    const lintel = new THREE.Mesh(lintelGeo, this.stoneMat);
    lintel.position.set(0, 6.8, 0);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    archGroup.add(lintel);

    // Glowing Runic Forcefield Barrier (Active until quest unlocks entrance)
    const barrierGeo = new THREE.PlaneGeometry(4.8, 6.2);
    this.barrierMesh = new THREE.Mesh(barrierGeo, this.barrierMat);
    this.barrierMesh.position.set(0, 3.3, 0);
    archGroup.add(this.barrierMesh);

    this.group.add(archGroup);
  }

  buildCurvedWallSection(radius, startAngle, endAngle) {
    const wallGeo = new THREE.BoxGeometry(3.5, 3.8, 0.9);
    const segments = 4;
    for (let s = 0; s < segments; s++) {
      const angle = startAngle + (s / segments) * (endAngle - startAngle);
      const wx = Math.cos(angle) * (radius - 0.5);
      const wz = Math.sin(angle) * (radius - 0.5);

      const wall = new THREE.Mesh(wallGeo, this.stoneMat);
      wall.position.set(wx, 2.5, wz);
      wall.rotation.y = -angle + Math.PI / 2;
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);
    }
  }

  initPhysics() {
    if (!this.physicsWorld) return;

    // Walkable Ruins Platform
    this.physicsWorld.addPlatform({
      hasWall: true,
      isPointInside: (x, z) => Math.hypot(x - this.origin.x, z - this.origin.z) <= 14.5,
      getHeight: (x, z) => this.origin.y + 1.2,
      resolveWallCollision: (pos, radius) => {
        const dx = pos.x - this.origin.x;
        const dz = pos.z - this.origin.z;
        const dist = Math.hypot(dx, dz);
        const angle = Math.atan2(dz, dx);
        const isNearEntrance = (angle > 1.8 && angle < 2.7) || (dx < -6 && dz > 6);
        if (!isNearEntrance && dist < 14.5 + radius && dist > 0.01) {
          const factor = (14.5 + radius) / dist;
          pos.x = this.origin.x + dx * factor;
          pos.z = this.origin.z + dz * factor;
        }
      }
    });

    // Walkable Entrance Steps Platform
    this.physicsWorld.addPlatform({
      hasWall: false,
      isPointInside: (x, z) => {
        const rx = x - this.origin.x;
        const rz = z - this.origin.z;
        const u = (rx - rz) * 0.7071;
        const v = (rx + rz) * 0.7071;
        return Math.abs(u) <= 3.2 && v >= -16.5 && v <= -8.0;
      },
      getHeight: (x, z) => {
        const rx = x - this.origin.x;
        const rz = z - this.origin.z;
        const v = (rx + rz) * 0.7071;
        const t = THREE.MathUtils.clamp((v - (-16.0)) / 7.5, 0, 1);
        return this.origin.y + t * 1.2;
      }
    });

    // Central Altar Collider
    this.physicsWorld.addCollider(new CircleCollider(
      this.origin.x,
      this.origin.z,
      3.0,
      this.origin.y + 1.0,
      this.origin.y + 4.5,
      'altar'
    ));

    // Archway Columns
    const archRot = Math.PI / 4;
    const cosA = Math.cos(archRot);
    const sinA = Math.sin(archRot);
    const archCenter = new THREE.Vector3(-7, 1.2, 7);

    const colLWorldX = this.origin.x + archCenter.x - 2.5 * cosA;
    const colLWorldZ = this.origin.z + archCenter.z - 2.5 * sinA;
    this.physicsWorld.addCollider(new CircleCollider(colLWorldX, colLWorldZ, 0.85, this.origin.y + 1.0, this.origin.y + 7.5, 'pillar'));

    const colRWorldX = this.origin.x + archCenter.x + 2.5 * cosA;
    const colRWorldZ = this.origin.z + archCenter.z + 2.5 * sinA;
    this.physicsWorld.addCollider(new CircleCollider(colRWorldX, colRWorldZ, 0.85, this.origin.y + 1.0, this.origin.y + 7.5, 'pillar'));

    // Perimeter Pillars
    const pillarCount = 8;
    const radius = 11;
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      if (angle > 1.8 && angle < 2.6) continue;

      const px = this.origin.x + Math.cos(angle) * radius;
      const pz = this.origin.z + Math.sin(angle) * radius;
      this.physicsWorld.addCollider(new CircleCollider(px, pz, 0.9, this.origin.y + 1.0, this.origin.y + 7.5, 'pillar'));
    }

    // Curved Back Wall Segments
    const segments = 4;
    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * (Math.PI * 0.7);
      const wx = this.origin.x + Math.cos(angle) * (radius - 0.5);
      const wz = this.origin.z + Math.sin(angle) * (radius - 0.5);
      this.physicsWorld.addCollider(new BoxCollider(wx, wz, 1.8, 0.65, -angle + Math.PI / 2, this.origin.y + 1.0, this.origin.y + 5.0, 'wall'));
    }
  }

  unlockEntrance() {
    this.isEntranceUnlocked = true;

    // Dissolve barrier forcefield
    if (this.barrierMesh) {
      let opacity = this.barrierMat.opacity;
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        if (opacity <= 0) {
          clearInterval(fadeInterval);
          this.barrierMesh.visible = false;
        } else {
          this.barrierMat.opacity = opacity;
        }
      }, 30);
    }

    // Activate soaring exit portal beam
    if (this.portalBeam) {
      this.portalBeam.visible = true;
      let beamOp = 0;
      const beamInterval = setInterval(() => {
        beamOp += 0.03;
        if (beamOp >= 0.65) {
          clearInterval(beamInterval);
        }
        this.portalBeamMat.opacity = beamOp;
      }, 30);
    }

    if (this.altarLight) {
      this.altarLight.color.setHex(0x38bdf8);
      this.altarLight.intensity = 5.0;
    }
  }

  update(deltaTime) {
    if (this.crystal) {
      this.crystal.rotation.y += deltaTime * 0.8;
      this.crystal.position.y = 3.8 + Math.sin(Date.now() * 0.002) * 0.12;
    }

    // Gently pulse and swirl portal beam when active
    if (this.portalBeam && this.portalBeam.visible) {
      this.portalBeam.rotation.y += deltaTime * 0.6;
      this.portalBeamMat.opacity = 0.5 + Math.sin(Date.now() * 0.004) * 0.15;
    }

    // Pulse barrier opacity while locked
    if (this.barrierMesh && !this.isEntranceUnlocked) {
      this.barrierMat.opacity = 0.55 + Math.sin(Date.now() * 0.003) * 0.15;
    }
  }
}
