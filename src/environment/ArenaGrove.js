import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { CircleCollider } from '../physics/Colliders.js';

export class ArenaGrove {
  constructor(scene, terrain, physicsWorld = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.physicsWorld = physicsWorld;

    this.center = new THREE.Vector3(-38, 0, -66);
    if (this.terrain && typeof this.terrain.getTerrainHeight === 'function') {
      this.center.y = this.terrain.getTerrainHeight(this.center.x, this.center.z);
    }

    this.radius = 16.0;
    this.barrierActive = false;
    this.barrierMesh = null;
    this.group = new THREE.Group();
    this.group.position.copy(this.center);

    this.colliders = [];
    this.time = 0;

    this.initMaterials();
    this.buildArena();
    this.initPhysics();
    this.scene.add(this.group);
  }

  initMaterials() {
    const stoneTex = TextureGenerator.createStoneTexture(512);

    this.daisMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.8,
      metalness: 0.2,
      color: 0x1e293b
    });

    this.monolithMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.7,
      metalness: 0.3,
      color: 0x0f172a
    });

    this.runeRingsMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.barrierMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  buildArena() {
    // 1. Central stone circular dais
    const daisGeo = new THREE.CylinderGeometry(this.radius, this.radius + 1.2, 0.6, 32);
    const dais = new THREE.Mesh(daisGeo, this.daisMat);
    dais.position.y = 0.3;
    dais.receiveShadow = true;
    this.group.add(dais);

    // 2. Glowing inner runic circle ring decal
    const runeRingGeo = new THREE.RingGeometry(8.0, 8.4, 48);
    const runeRing = new THREE.Mesh(runeRingGeo, this.runeRingsMat);
    runeRing.rotation.x = -Math.PI / 2;
    runeRing.position.y = 0.62;
    this.group.add(runeRing);

    const outerRingGeo = new THREE.RingGeometry(13.8, 14.3, 48);
    const outerRing = new THREE.Mesh(outerRingGeo, this.runeRingsMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.62;
    this.group.add(outerRing);

    // 3. Perimeter Monolithic Stone Pillars
    const pillarCount = 6;
    const pillarRadius = 15.0;
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const px = Math.cos(angle) * pillarRadius;
      const pz = Math.sin(angle) * pillarRadius;

      const height = 4.2 + (i % 2) * 1.2;
      const pGeo = new THREE.BoxGeometry(1.6, height, 1.4);
      const pillar = new THREE.Mesh(pGeo, this.monolithMat);
      pillar.position.set(px, height / 2 + 0.3, pz);
      pillar.rotation.y = angle;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);

      // Monolith glowing rune inscription
      const runePlaqueGeo = new THREE.PlaneGeometry(0.8, 2.0);
      const runePlaque = new THREE.Mesh(runePlaqueGeo, this.runeRingsMat);
      runePlaque.position.set(px * 0.94, height * 0.45, pz * 0.94);
      runePlaque.rotation.y = angle + Math.PI;
      this.group.add(runePlaque);
    }

    // 4. Ethereal Runic Perimeter Barrier (Ignites during encounter)
    const barrierGeo = new THREE.CylinderGeometry(this.radius - 0.2, this.radius - 0.2, 7.0, 48, 1, true);
    this.barrierMesh = new THREE.Mesh(barrierGeo, this.barrierMat);
    this.barrierMesh.position.y = 3.8;
    this.barrierMesh.visible = false;
    this.group.add(this.barrierMesh);
  }

  initPhysics() {
    if (!this.physicsWorld) return;

    // Register colliders for each monolithic pillar
    const pillarCount = 6;
    const pillarRadius = 15.0;
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const worldX = this.center.x + Math.cos(angle) * pillarRadius;
      const worldZ = this.center.z + Math.sin(angle) * pillarRadius;

      const col = new CircleCollider(worldX, worldZ, 1.2, this.center.y, this.center.y + 6.0, 'ruin_pillar');
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  activateBarrier() {
    this.barrierActive = true;
    if (this.barrierMesh) {
      this.barrierMesh.visible = true;
    }
  }

  deactivateBarrier() {
    this.barrierActive = false;
    if (this.barrierMesh) {
      this.barrierMesh.visible = false;
    }
  }

  update(deltaTime, playerPosition = null) {
    this.time += deltaTime;

    // Pulse barrier glow if active
    if (this.barrierActive && this.barrierMesh) {
      const pulse = 0.4 + Math.sin(this.time * 3.5) * 0.15;
      this.barrierMat.opacity = pulse;
    }

    // Containment barrier physics resolution (keeps player inside arena during boss fight)
    if (this.barrierActive && playerPosition) {
      const dx = playerPosition.x - this.center.x;
      const dz = playerPosition.z - this.center.z;
      const dist = Math.hypot(dx, dz);
      const maxInnerRadius = this.radius - 1.2;

      if (dist > maxInnerRadius) {
        const factor = maxInnerRadius / dist;
        playerPosition.x = this.center.x + dx * factor;
        playerPosition.z = this.center.z + dz * factor;
      }
    }
  }

  dispose() {
    if (this.physicsWorld && this.colliders.length > 0) {
      this.colliders.forEach(col => this.physicsWorld.removeCollider(col));
      this.colliders = [];
    }
    if (this.group) {
      this.scene.remove(this.group);
    }
  }
}
