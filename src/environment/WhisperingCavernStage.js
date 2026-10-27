import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { BoxCollider, CircleCollider } from '../physics/Colliders.js';

/**
 * Level 5 Playable Environment: The Whispering Cavern
 * A vast subterranean chamber featuring luminous mushrooms, towering stalagmites,
 * a subterranean river with a natural rock bridge, and the Sunken Crypt Dungeon Gate.
 */
export class WhisperingCavernStage {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();
    this.colliders = [];

    this.shrooms = [];
    this.animTime = 0;

    this.initMaterials();
    this.buildTerrain();
    this.buildSubterraneanRiverAndBridge();
    this.buildStalagmitesAndPillars();
    this.buildBioluminescentMushrooms();
    this.buildSunkenCryptDungeonGate();
    this.buildSmugglerCache();
    this.buildPassagePortals();

    this.scene.add(this.group);
  }

  initMaterials() {
    this.cavernTex = TextureGenerator.createCavernTexture(512);

    this.cavernMat = new THREE.MeshStandardMaterial({
      map: this.cavernTex,
      roughness: 0.9,
      metalness: 0.15,
      flatShading: true
    });

    this.riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75
    });

    this.cryptMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.8
    });

    this.runeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.9
    });

    this.shroomCapMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 2.2,
      roughness: 0.3
    });

    this.shroomStemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.4
    });
  }

  buildTerrain() {
    const geo = new THREE.PlaneGeometry(160, 160, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.hypot(x, z);

      // Sunken river canyon running through middle along x = 0
      let y = (Math.sin(x * 0.15) + Math.cos(z * 0.15)) * 0.5;

      // River channel cuts down along x between -6 and +6
      const riverDist = Math.abs(x);
      if (riverDist < 7.0 && Math.abs(z) > 4.5) {
        y -= (1 - riverDist / 7.0) * 4.5;
      }

      // Cavern outer walls climb steeply
      if (dist > 42) {
        y += Math.pow((dist - 42) / 24, 2.0) * 16.0;
      }

      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    this.groundMesh = new THREE.Mesh(geo, this.cavernMat);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    this.terrain = {
      getTerrainHeight: (x, z) => {
        let y = (Math.sin(x * 0.15) + Math.cos(z * 0.15)) * 0.5;
        const riverDist = Math.abs(x);
        if (riverDist < 7.0 && Math.abs(z) > 4.5) {
          y -= (1 - riverDist / 7.0) * 4.5;
        }
        const dist = Math.hypot(x, z);
        if (dist > 42) {
          y += Math.pow((dist - 42) / 24, 2.0) * 16.0;
        }
        return y;
      }
    };

    if (this.physicsWorld) {
      this.physicsWorld.setTerrain(this.terrain);
    }
  }

  buildSubterraneanRiverAndBridge() {
    // Water surface plane in the river channel
    const riverGeo = new THREE.PlaneGeometry(14, 90);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMesh = new THREE.Mesh(riverGeo, this.riverMat);
    riverMesh.position.set(0, -3.2, 0);
    this.group.add(riverMesh);

    // Natural arched stone bridge at center (x: 0, z: 0)
    const bridgeGeo = new THREE.BoxGeometry(16, 1.2, 7.0);
    const bridge = new THREE.Mesh(bridgeGeo, this.cavernMat);
    bridge.position.set(0, 0.4, 0);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    this.group.add(bridge);

    if (this.physicsWorld) {
      const bridgeCol = new BoxCollider(0, 0, 16.5, 7.5);
      this.physicsWorld.addCollider(bridgeCol);
      this.colliders.push(bridgeCol);
    }
  }

  buildStalagmitesAndPillars() {
    const stalagmiteSpawns = [
      { x: -18, z: 15, h: 7, r: 1.8 },
      { x: -22, z: -16, h: 9, r: 2.2 },
      { x: 18, z: -14, h: 8, r: 2.0 },
      { x: 22, z: 18, h: 6.5, r: 1.6 },
      { x: -12, z: -32, h: 10, r: 2.4 },
      { x: 14, z: 32, h: 8.5, r: 2.0 }
    ];

    stalagmiteSpawns.forEach(s => {
      // Stalagmite rising from floor
      const geo = new THREE.ConeGeometry(s.r, s.h, 7);
      const mesh = new THREE.Mesh(geo, this.cavernMat);
      mesh.position.set(s.x, s.h / 2 - 0.2, s.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);

      // Corresponding stalactite hanging from cavern ceiling
      const topGeo = new THREE.ConeGeometry(s.r * 0.9, s.h * 0.9, 7);
      const topMesh = new THREE.Mesh(topGeo, this.cavernMat);
      topMesh.position.set(s.x, 22 - s.h * 0.45, s.z);
      topMesh.rotation.x = Math.PI;
      this.group.add(topMesh);

      if (this.physicsWorld) {
        const col = new CircleCollider(s.x, s.z, s.r * 1.1);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }
    });
  }

  buildBioluminescentMushrooms() {
    const shroomSpawns = [
      { x: -14, z: 8, s: 1.4 },
      { x: -15, z: 9.5, s: 0.9 },
      { x: 12, z: 8, s: 1.3 },
      { x: -8, z: -18, s: 1.6 },
      { x: 15, z: -20, s: 1.5 },
      { x: 25, z: -10, s: 1.8 }
    ];

    shroomSpawns.forEach((s, idx) => {
      const shroomGroup = new THREE.Group();
      shroomGroup.position.set(s.x, 0.2, s.z);
      shroomGroup.scale.setScalar(s.s);

      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.15, 0.25, 1.8, 8);
      const stem = new THREE.Mesh(stemGeo, this.shroomStemMat);
      stem.position.y = 0.9;
      shroomGroup.add(stem);

      // Cap
      const capGeo = new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, this.shroomCapMat);
      cap.position.y = 1.8;
      cap.scale.set(1.1, 0.8, 1.1);
      shroomGroup.add(cap);

      // Light glow
      const light = new THREE.PointLight(idx % 2 === 0 ? 0xa855f7 : 0x06b6d4, 1.1, 10);
      light.position.set(s.x, 2.2 * s.s, s.z);
      this.group.add(light);

      this.shrooms.push({ group: shroomGroup, cap, light, baseScale: s.s });
      this.group.add(shroomGroup);
    });
  }

  buildSunkenCryptDungeonGate() {
    // Massive Dungeon Entrance Gate at x: 25, z: -25
    const dungeonGate = new THREE.Group();
    dungeonGate.position.set(25, 0, -25);
    dungeonGate.rotation.y = -Math.PI / 4;

    // Heavy carved stone portal arch
    const archGeo = new THREE.BoxGeometry(7.0, 7.5, 2.0);
    const archMesh = new THREE.Mesh(archGeo, this.cryptMat);
    archMesh.position.y = 3.75;
    archMesh.castShadow = true;
    archMesh.receiveShadow = true;
    dungeonGate.add(archMesh);

    // Inner crypt void passage / doorway
    const innerVoidGeo = new THREE.BoxGeometry(4.2, 5.5, 2.2);
    const innerVoidMat = new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.1
    });
    const innerVoid = new THREE.Mesh(innerVoidGeo, innerVoidMat);
    innerVoid.position.y = 2.75;
    dungeonGate.add(innerVoid);

    // Runic portcullis bars
    const barGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.2, 6);
    for (let x = -1.6; x <= 1.6; x += 0.8) {
      const bar = new THREE.Mesh(barGeo, this.runeGlowMat);
      bar.position.set(x, 2.6, 0);
      dungeonGate.add(bar);
    }

    // Floating glowing glyph above the crypt portal
    const glyphGeo = new THREE.OctahedronGeometry(0.65);
    const glyph = new THREE.Mesh(glyphGeo, this.runeGlowMat);
    glyph.position.set(0, 6.2, 1.1);
    dungeonGate.add(glyph);
    this.cryptGlyph = glyph;

    const cryptLight = new THREE.PointLight(0x06b6d4, 1.8, 18);
    cryptLight.position.set(25, 5.0, -25);
    this.group.add(cryptLight);

    this.group.add(dungeonGate);

    if (this.physicsWorld) {
      const gateCol = new BoxCollider(25, -25, 7.5, 4.0);
      this.physicsWorld.addCollider(gateCol);
      this.colliders.push(gateCol);
    }
  }

  buildSmugglerCache() {
    // Secret smuggler's cache at x: 30, z: 20
    const cacheGroup = new THREE.Group();
    cacheGroup.position.set(30, 0.4, 20);

    const chestGeo = new THREE.BoxGeometry(1.4, 0.9, 1.0);
    const chest = new THREE.Mesh(chestGeo, this.cryptMat);
    chest.position.y = 0.45;
    chest.castShadow = true;
    cacheGroup.add(chest);

    // Glowing cyan lock
    const lockGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const lock = new THREE.Mesh(lockGeo, this.runeGlowMat);
    lock.position.set(0, 0.5, 0.55);
    cacheGroup.add(lock);

    this.group.add(cacheGroup);

    if (this.physicsWorld) {
      const cacheCol = new BoxCollider(30, 20, 1.8, 1.4);
      this.physicsWorld.addCollider(cacheCol);
      this.colliders.push(cacheCol);
    }
  }

  buildPassagePortals() {
    const passages = [
      { name: 'Dark Forest Grotto Fissure', x: -30, y: 0.5, z: 30, rotY: Math.PI / 4 },
      { name: 'Ancient Ruins Crypt Passage', x: 28, y: 0.5, z: -28, rotY: -Math.PI / 4 },
      { name: 'Abandoned Village Well Shaft', x: -5, y: 0.5, z: -30, rotY: 0 }
    ];

    passages.forEach(p => {
      const portal = new THREE.Group();
      portal.position.set(p.x, p.y, p.z);
      portal.rotation.y = p.rotY;

      const runeGeo = new THREE.RingGeometry(0.5, 1.3, 16);
      const rune = new THREE.Mesh(runeGeo, this.runeGlowMat);
      rune.position.set(0, 2.0, 0);
      portal.add(rune);

      this.group.add(portal);
    });
  }

  update(deltaTime) {
    this.animTime += deltaTime;

    if (this.cryptGlyph) {
      this.cryptGlyph.rotation.y += deltaTime * 1.2;
      this.cryptGlyph.position.y = 6.2 + Math.sin(this.animTime * 2.0) * 0.15;
    }

    // Pulse mushroom glow subtly
    const pulse = 1.8 + Math.sin(this.animTime * 2.5) * 0.6;
    if (this.shroomCapMat) {
      this.shroomCapMat.emissiveIntensity = pulse;
    }
  }

  dispose() {
    if (this.physicsWorld && this.colliders.length > 0) {
      this.colliders.forEach(col => {
        if (typeof this.physicsWorld.removeCollider === 'function') {
          this.physicsWorld.removeCollider(col);
        }
      });
      this.colliders = [];
    }

    if (this.group && this.scene) {
      this.scene.remove(this.group);
      this.group.traverse(child => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
  }
}
