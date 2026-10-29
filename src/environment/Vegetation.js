import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { CircleCollider, BoxCollider } from '../physics/Colliders.js';

export class Vegetation {
  constructor(scene, terrain, physicsWorld = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.physicsWorld = physicsWorld;

    // Seeded PRNG for deterministic placement
    this.seed = 123456;
    this.coverZones = [];

    this.initMaterials();
    this.initTrees();
    this.initGiantLobelias();
    this.initRocks();
    this.initFallenLogs();
    this.initBushes();
    this.initGrass();
    this.initAtmosphericMotes();
  }

  random() {
    // Fast Mulberry32 seeded generator
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  initMaterials() {
    this.barkTex = TextureGenerator.createBarkTexture(512);
    this.barkMat = new THREE.MeshStandardMaterial({
      map: this.barkTex,
      roughness: 0.9,
      metalness: 0.05
    });

    this.foliageMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.7,
      metalness: 0.05,
      flatShading: true
    });

    this.bushMat = new THREE.MeshStandardMaterial({
      color: 0x3d7031,
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true
    });

    const stoneTex = TextureGenerator.createStoneTexture(512);
    this.rockMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.88,
      metalness: 0.12,
      flatShading: true
    });

    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f,
      roughness: 0.8,
      metalness: 0.02,
      side: THREE.DoubleSide
    });
  }

  /**
   * Instanced Trees with physical cylinder colliders.
   */
  initTrees() {
    const treeCount = 140;

    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.7, 7.5, 8);
    trunkGeo.translate(0, 3.75, 0);

    // Wide flat-topped umbrella acacia (ግራር) canopy geometry
    const c1 = new THREE.CylinderGeometry(4.2, 1.6, 1.4, 9);
    c1.translate(0, 5.2, 0);

    const dummyTrunk = new THREE.InstancedMesh(trunkGeo, this.barkMat, treeCount);
    const dummyCanopy = new THREE.InstancedMesh(c1, this.foliageMat, treeCount * 3);

    dummyTrunk.castShadow = true;
    dummyTrunk.receiveShadow = true;
    dummyCanopy.castShadow = true;
    dummyCanopy.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const canopyDummy = new THREE.Object3D();
    let placedTrees = 0;
    let canopyIndex = 0;

    const dummyColor = new THREE.Color();
    const foliageColors = [0x2d5a27, 0x3d6e32, 0x224a1f, 0x4a7c36];

    for (let i = 0; i < treeCount * 4 && placedTrees < treeCount; i++) {
      const radius = 12 + Math.sqrt(this.random()) * 95;
      const angle = this.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pathDist = this.terrain.getPathDistance(x, z);
      const ruinsDist = Math.hypot(x - 40, z - (-75));
      const spawnDist = Math.hypot(x, z);

      if (pathDist < 4.8 || ruinsDist < 20 || spawnDist < 8) {
        continue;
      }

      const y = this.terrain.getTerrainHeight(x, z);
      const scale = 0.75 + this.random() * 0.6;
      const rotY = this.random() * Math.PI * 2;
      const tiltX = (this.random() - 0.5) * 0.08;
      const tiltZ = (this.random() - 0.5) * 0.08;

      dummy.position.set(x, y - 0.2, z);
      dummy.rotation.set(tiltX, rotY, tiltZ);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      dummyTrunk.setMatrixAt(placedTrees, dummy.matrix);

      // Register physics collider for tree trunk
      if (this.physicsWorld) {
        this.physicsWorld.addCollider(new CircleCollider(
          x,
          z,
          0.62 * scale,
          y - 0.5,
          y + 9.0,
          'tree'
        ));
      }

      // Flat-spreading tiered umbrella acacia canopies
      const tiers = [
        { yOffset: 5.2 * scale, scaleR: 4.4 * scale, scaleH: 1.3 * scale },
        { yOffset: 6.4 * scale, scaleR: 5.2 * scale, scaleH: 1.2 * scale },
        { yOffset: 7.3 * scale, scaleR: 3.6 * scale, scaleH: 1.1 * scale }
      ];

      const cBase = foliageColors[placedTrees % foliageColors.length];
      dummyColor.setHex(cBase);

      for (let t = 0; t < 3; t++) {
        const tier = tiers[t];
        canopyDummy.position.set(x, y + tier.yOffset, z);
        canopyDummy.rotation.set(tiltX, rotY + t * 0.5, tiltZ);
        canopyDummy.scale.set(tier.scaleR / 4.2, tier.scaleH / 1.4, tier.scaleR / 4.2);
        canopyDummy.updateMatrix();
        dummyCanopy.setMatrixAt(canopyIndex, canopyDummy.matrix);
        dummyCanopy.setColorAt(canopyIndex, dummyColor);
        canopyIndex++;
      }

      placedTrees++;
    }

    dummyTrunk.instanceMatrix.needsUpdate = true;
    dummyCanopy.instanceMatrix.needsUpdate = true;
    if (dummyCanopy.instanceColor) dummyCanopy.instanceColor.needsUpdate = true;

    this.scene.add(dummyTrunk);
    this.scene.add(dummyCanopy);
  }

  /**
   * Instanced Giant Lobelias (ጂብራ • Lobelia rhynchopetalum)
   * The iconic Afro-alpine giant plant endemic to the Simien Mountains of Ethiopia.
   */
  initGiantLobelias() {
    const lobeliaCount = 65;

    // Stem stalk
    const stalkGeo = new THREE.CylinderGeometry(0.24, 0.38, 3.8, 7);
    stalkGeo.translate(0, 1.9, 0);

    // Giant rosette leaves & central flowering tower
    const rosetteGeo = new THREE.ConeGeometry(1.8, 1.2, 7);
    rosetteGeo.rotateX(Math.PI);
    rosetteGeo.translate(0, 1.8, 0);

    // Spire top
    const spireGeo = new THREE.ConeGeometry(0.45, 2.6, 7);
    spireGeo.translate(0, 4.4, 0);

    const lobeliaMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c3f,
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true
    });

    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af, // Silver woolly alpine flowering spire
      roughness: 0.9,
      metalness: 0.05
    });

    const stalkMesh = new THREE.InstancedMesh(stalkGeo, this.barkMat, lobeliaCount);
    const rosetteMesh = new THREE.InstancedMesh(rosetteGeo, lobeliaMat, lobeliaCount);
    const spireMesh = new THREE.InstancedMesh(spireGeo, spireMat, lobeliaCount);

    stalkMesh.castShadow = true;
    rosetteMesh.castShadow = true;
    spireMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < lobeliaCount * 4 && placed < lobeliaCount; i++) {
      const radius = 10 + Math.sqrt(this.random()) * 85;
      const angle = this.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pathDist = this.terrain.getPathDistance(x, z);
      const ruinsDist = Math.hypot(x - 40, z - (-75));
      if (pathDist < 3.5 || ruinsDist < 16) continue;

      const y = this.terrain.getTerrainHeight(x, z);
      const scale = 0.8 + this.random() * 0.45;
      const rotY = this.random() * Math.PI * 2;

      dummy.position.set(x, y - 0.1, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      stalkMesh.setMatrixAt(placed, dummy.matrix);
      rosetteMesh.setMatrixAt(placed, dummy.matrix);
      spireMesh.setMatrixAt(placed, dummy.matrix);

      if (this.physicsWorld) {
        this.physicsWorld.addCollider(new CircleCollider(
          x,
          z,
          0.45 * scale,
          y - 0.5,
          y + 4.5,
          'lobelia'
        ));
      }

      placed++;
    }

    stalkMesh.instanceMatrix.needsUpdate = true;
    rosetteMesh.instanceMatrix.needsUpdate = true;
    spireMesh.instanceMatrix.needsUpdate = true;

    this.scene.add(stalkMesh);
    this.scene.add(rosetteMesh);
    this.scene.add(spireMesh);
    if (dummyCanopy.instanceColor) dummyCanopy.instanceColor.needsUpdate = true;

    this.scene.add(dummyTrunk);
    this.scene.add(dummyCanopy);
  }

  /**
   * Instanced Rocks & Boulders with physical collision shapes.
   */
  initRocks() {
    const rockCount = 75;
    const rockGeo = new THREE.DodecahedronGeometry(1.4, 1);

    const pos = rockGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const noise = 1.0 + (Math.sin(vx * 3) + Math.cos(vz * 3)) * 0.12;
      pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    rockGeo.computeVertexNormals();

    const rockMesh = new THREE.InstancedMesh(rockGeo, this.rockMat, rockCount);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < rockCount * 4 && placed < rockCount; i++) {
      const radius = 8 + Math.sqrt(this.random()) * 90;
      const angle = this.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pathDist = this.terrain.getPathDistance(x, z);
      const ruinsDist = Math.hypot(x - 40, z - (-75));

      const nearPathEdge = pathDist >= 2.6 && pathDist <= 6.0;
      const inWilds = pathDist > 7.0 && ruinsDist > 16;

      if (!nearPathEdge && !inWilds) continue;

      const y = this.terrain.getTerrainHeight(x, z);
      const scaleX = 0.6 + this.random() * 1.4;
      const scaleY = 0.5 + this.random() * 1.1;
      const scaleZ = 0.6 + this.random() * 1.4;

      dummy.position.set(x, y + scaleY * 0.4, z);
      dummy.rotation.set(this.random() * Math.PI, this.random() * Math.PI, this.random() * Math.PI);
      dummy.scale.set(scaleX, scaleY, scaleZ);
      dummy.updateMatrix();
      rockMesh.setMatrixAt(placed, dummy.matrix);

      // Register physical rock collider
      if (this.physicsWorld) {
        const effRadius = Math.max(scaleX, scaleZ) * 1.25;
        this.physicsWorld.addCollider(new CircleCollider(
          x,
          z,
          effRadius,
          y - 0.5,
          y + scaleY * 1.8,
          'rock'
        ));
      }

      placed++;
    }

    rockMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(rockMesh);
  }

  /**
   * Fallen logs with physical OBB box colliders.
   */
  initFallenLogs() {
    const logGroup = new THREE.Group();
    const logGeo = new THREE.CylinderGeometry(0.4, 0.5, 6.0, 7);
    logGeo.rotateZ(Math.PI / 2);

    const logPositions = [
      { x: -5, z: -12, rotY: 0.6 },
      { x: 12, z: -28, rotY: -0.4 },
      { x: 22, z: -48, rotY: 0.9 },
      { x: -18, z: 8, rotY: 1.4 },
      { x: 32, z: -64, rotY: -0.8 }
    ];

    logPositions.forEach(p => {
      const log = new THREE.Mesh(logGeo, this.barkMat);
      const y = this.terrain.getTerrainHeight(p.x, p.z);
      log.position.set(p.x, y + 0.35, p.z);
      log.rotation.y = p.rotY;
      log.rotation.x = 0.05;
      log.castShadow = true;
      log.receiveShadow = true;
      logGroup.add(log);

      if (this.physicsWorld) {
        this.physicsWorld.addCollider(new BoxCollider(
          p.x,
          p.z,
          0.65,
          3.1,
          p.rotY,
          y - 0.5,
          y + 1.2,
          'log'
        ));
      }
    });

    this.scene.add(logGroup);
  }

  /**
   * Wild bushes and shrubs.
   */
  initBushes() {
    const bushCount = 80;
    const bushGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const bushMesh = new THREE.InstancedMesh(bushGeo, this.bushMat, bushCount);
    bushMesh.castShadow = true;
    bushMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < bushCount * 4 && placed < bushCount; i++) {
      const radius = 6 + Math.sqrt(this.random()) * 85;
      const angle = this.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pathDist = this.terrain.getPathDistance(x, z);
      const ruinsDist = Math.hypot(x - 40, z - (-75));

      if (pathDist < 2.4 || ruinsDist < 16) continue;

      const y = this.terrain.getTerrainHeight(x, z);
      const s = 0.7 + this.random() * 0.7;

      dummy.position.set(x, y + s * 0.5, z);
      dummy.rotation.set(0, this.random() * Math.PI * 2, 0);
      dummy.scale.set(s * 1.3, s * 0.8, s * 1.2);
      dummy.updateMatrix();
      bushMesh.setMatrixAt(placed, dummy.matrix);
      this.coverZones.push({ x, z, radius: s * 1.5 });
      placed++;
    }

    bushMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(bushMesh);
  }

  /**
   * Checks whether coordinates (x, z) are within concealment range of tall bushes or foliage.
   */
  isNearCover(x, z, checkRadius = 1.8) {
    for (let i = 0; i < this.coverZones.length; i++) {
      const zone = this.coverZones[i];
      const dx = x - zone.x;
      const dz = z - zone.z;
      const maxDist = zone.radius + checkRadius;
      if (dx * dx + dz * dz <= maxDist * maxDist) {
        return true;
      }
    }
    return false;
  }

  /**
   * Wild grass tufts along path borders.
   */
  initGrass() {
    const grassCount = 350;

    const bladeGeo = new THREE.PlaneGeometry(0.7, 0.9);
    bladeGeo.translate(0, 0.45, 0);

    const g1 = bladeGeo.clone();

    this.grassMesh = new THREE.InstancedMesh(g1, this.grassMat, grassCount);
    this.grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < grassCount * 4 && placed < grassCount; i++) {
      const radius = 3 + Math.sqrt(this.random()) * 75;
      const angle = this.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pathDist = this.terrain.getPathDistance(x, z);
      if (pathDist < 1.6 || pathDist > 14) continue;

      const y = this.terrain.getTerrainHeight(x, z);
      const s = 0.7 + this.random() * 0.6;

      dummy.position.set(x, y, z);
      dummy.rotation.y = this.random() * Math.PI;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      this.grassMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.grassMesh);
  }

  /**
   * Atmospheric depth: Ambient forest pollen / floating dust motes.
   */
  initAtmosphericMotes() {
    const moteCount = 180;
    const moteGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(moteCount * 3);
    this.moteSpeeds = new Float32Array(moteCount);

    for (let i = 0; i < moteCount; i++) {
      const idx = i * 3;
      positions[idx] = (this.random() - 0.5) * 70;
      positions[idx + 1] = 1 + this.random() * 8;
      positions[idx + 2] = (this.random() - 0.5) * 70;
      this.moteSpeeds[i] = 0.2 + this.random() * 0.5;
    }

    moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const moteMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.18,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });

    this.motes = new THREE.Points(moteGeo, moteMat);
    this.scene.add(this.motes);
  }

  update(deltaTime) {
    if (this.motes) {
      const pos = this.motes.geometry.attributes.position;
      const time = Date.now() * 0.001;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i);
        let x = pos.getX(i);
        y += Math.sin(time + i) * 0.008;
        x += Math.cos(time * 0.5 + i) * 0.005;

        if (y > 9) y = 1.0;
        if (y < 1.0) y = 9.0;

        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }
  }
}
