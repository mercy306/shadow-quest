import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { BoxCollider, CircleCollider } from '../physics/Colliders.js';

/**
 * Level 3 Playable Environment: The Mountain Pass
 * A rugged alpine canyon with sheer crags, a wooden rope bridge spanning a chasm,
 * the Eagle's Peak Cairn shrine, and hidden scout caches.
 */
export class MountainPassStage {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();
    this.colliders = [];

    this.initMaterials();
    this.buildTerrain();
    this.buildCliffsAndCanyon();
    this.buildHighwindBridge();
    this.buildEaglesPeakCairn();
    this.buildSecretCache();
    this.buildPassagePortals();

    this.scene.add(this.group);
  }

  initMaterials() {
    this.rockTex = TextureGenerator.createMountainRockTexture(512);
    this.woodTex = TextureGenerator.createWoodTexture(512);

    this.groundMat = new THREE.MeshStandardMaterial({
      map: this.rockTex,
      roughness: 0.88,
      metalness: 0.12,
      flatShading: false
    });

    this.cliffMat = new THREE.MeshStandardMaterial({
      map: this.rockTex,
      roughness: 0.95,
      metalness: 0.08,
      flatShading: true
    });

    this.woodMat = new THREE.MeshStandardMaterial({
      map: this.woodTex,
      roughness: 0.75,
      metalness: 0.05
    });

    this.cairnMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.6,
      metalness: 0.2
    });

    this.gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.8
    });

    this.gateRuneMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });
  }

  buildTerrain() {
    const geo = new THREE.PlaneGeometry(160, 160, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Central winding path from (35, 28) through bridge at (0, 5) to (-30, -30)
      const distFromCenter = Math.hypot(x, z);

      // Base altitude incline (mountain slope climbs as z decreases)
      let y = -z * 0.12 + Math.sin(x * 0.08) * 1.5;

      // Deep chasm cutting across the center near z = 5
      const chasmDist = Math.abs(z - 5);
      if (chasmDist < 6 && Math.abs(x) > 4) {
        y -= (1 - chasmDist / 6) * 14.0;
      }

      // Outer rim towering cliffs
      if (distFromCenter > 42) {
        y += Math.pow((distFromCenter - 42) / 25, 2.0) * 18.0;
      }

      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    this.groundMesh = new THREE.Mesh(geo, this.groundMat);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    this.terrain = {
      getTerrainHeight: (x, z) => {
        let y = -z * 0.12 + Math.sin(x * 0.08) * 1.5;
        const chasmDist = Math.abs(z - 5);
        if (chasmDist < 6 && Math.abs(x) > 4) {
          y -= (1 - chasmDist / 6) * 14.0;
        }
        const distFromCenter = Math.hypot(x, z);
        if (distFromCenter > 42) {
          y += Math.pow((distFromCenter - 42) / 25, 2.0) * 18.0;
        }
        return y;
      }
    };

    if (this.physicsWorld) {
      this.physicsWorld.setTerrain(this.terrain);
    }
  }

  buildCliffsAndCanyon() {
    // Generate rock crag boulders and boundary pillars
    const rockPositions = [
      { x: -28, y: 3, z: 12, s: 6 },
      { x: -35, y: 5, z: 0, s: 8 },
      { x: -18, y: 2, z: -18, s: 7 },
      { x: 18, y: 2, z: 18, s: 7 },
      { x: 26, y: 4, z: -10, s: 9 },
      { x: 12, y: 1, z: -32, s: 6 },
      { x: -45, y: 8, z: 25, s: 12 },
      { x: 45, y: 8, z: -25, s: 12 },
      { x: -10, y: 2, z: 35, s: 7 }
    ];

    rockPositions.forEach(p => {
      const rockGeo = new THREE.DodecahedronGeometry(p.s, 1);
      const rockMesh = new THREE.Mesh(rockGeo, this.cliffMat);
      rockMesh.position.set(p.x, p.y, p.z);
      rockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      this.group.add(rockMesh);

      if (this.physicsWorld) {
        const col = new CircleCollider(p.x, p.z, p.s * 0.85);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }
    });
  }

  buildHighwindBridge() {
    // Bridge spanning the chasm along z from z: 10 to z: 0 at x: 0
    const bridgeGroup = new THREE.Group();
    const plankGeo = new THREE.BoxGeometry(4.2, 0.25, 1.0);

    for (let z = 10; z >= 0; z -= 1.1) {
      const plank = new THREE.Mesh(plankGeo, this.woodMat);
      // Slight bridge sag in center
      const sag = Math.sin(((z) / 10) * Math.PI) * 0.4;
      plank.position.set(0, 0.4 - sag, z);
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }

    // Bridge posts and rope handrails
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.8, 6);
    [-2.0, 2.0].forEach(px => {
      [10.5, 5.0, -0.5].forEach(pz => {
        const post = new THREE.Mesh(postGeo, this.woodMat);
        post.position.set(px, 0.9, pz);
        post.castShadow = true;
        bridgeGroup.add(post);
      });
    });

    this.group.add(bridgeGroup);

    // Collider for the bridge walkway
    if (this.physicsWorld) {
      const bridgeCol = new BoxCollider(0, 5, 4.4, 11);
      this.physicsWorld.addCollider(bridgeCol);
      this.colliders.push(bridgeCol);
    }
  }

  buildEaglesPeakCairn() {
    // Ancient stone cairn landmark at x: -25, z: -20
    const cairnGroup = new THREE.Group();
    cairnGroup.position.set(-25, 3.2, -20);

    const stoneSizes = [
      { r: 2.2, h: 0.9, y: 0.45 },
      { r: 1.8, h: 0.8, y: 1.3 },
      { r: 1.3, h: 0.7, y: 2.05 },
      { r: 0.9, h: 0.6, y: 2.7 }
    ];

    stoneSizes.forEach(s => {
      const geo = new THREE.CylinderGeometry(s.r * 0.85, s.r, s.h, 7);
      const mesh = new THREE.Mesh(geo, this.cairnMat);
      mesh.position.y = s.y;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      cairnGroup.add(mesh);
    });

    // Radiant prayer stone at the apex
    const apexGeo = new THREE.OctahedronGeometry(0.55);
    const apex = new THREE.Mesh(apexGeo, this.gemMat);
    apex.position.y = 3.4;
    apex.castShadow = true;
    cairnGroup.add(apex);
    this.cairnApex = apex;

    // Glowing point light at the cairn
    const cairnLight = new THREE.PointLight(0x38bdf8, 1.4, 16);
    cairnLight.position.set(-25, 6.8, -20);
    this.group.add(cairnLight);

    this.group.add(cairnGroup);

    if (this.physicsWorld) {
      const cairnCol = new CircleCollider(-25, -20, 2.5);
      this.physicsWorld.addCollider(cairnCol);
      this.colliders.push(cairnCol);
    }
  }

  buildSecretCache() {
    // Hidden scout cache chest at x: -15, z: 30
    const cacheGroup = new THREE.Group();
    cacheGroup.position.set(-15, 0.4, 30);

    const chestGeo = new THREE.BoxGeometry(1.4, 0.9, 1.0);
    const chest = new THREE.Mesh(chestGeo, this.woodMat);
    chest.position.y = 0.45;
    chest.castShadow = true;
    cacheGroup.add(chest);

    // Glowing lock plate
    const lockGeo = new THREE.BoxGeometry(0.25, 0.35, 0.1);
    const lock = new THREE.Mesh(lockGeo, this.gemMat);
    lock.position.set(0, 0.45, 0.52);
    cacheGroup.add(lock);

    this.group.add(cacheGroup);

    if (this.physicsWorld) {
      const cacheCol = new BoxCollider(-15, 30, 1.8, 1.4);
      this.physicsWorld.addCollider(cacheCol);
      this.colliders.push(cacheCol);
    }
  }

  buildPassagePortals() {
    // Archway markers at passages
    const passages = [
      { name: 'Dark Forest Passage', x: 35, y: -2.0, z: 28, rotY: Math.PI / 4 },
      { name: 'Abandoned Village Trail', x: -30, y: 4.5, z: -30, rotY: -Math.PI / 3 },
      { name: 'Ancient Ruins Terrace', x: 32, y: 1.5, z: -20, rotY: -Math.PI / 6 }
    ];

    passages.forEach(p => {
      const arch = new THREE.Group();
      arch.position.set(p.x, p.y, p.z);
      arch.rotation.y = p.rotY;

      const pillarGeo = new THREE.CylinderGeometry(0.4, 0.5, 4.0, 6);
      const leftPillar = new THREE.Mesh(pillarGeo, this.cliffMat);
      leftPillar.position.set(-1.8, 2.0, 0);
      leftPillar.castShadow = true;
      arch.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, this.cliffMat);
      rightPillar.position.set(1.8, 2.0, 0);
      rightPillar.castShadow = true;
      arch.add(rightPillar);

      const lintelGeo = new THREE.BoxGeometry(4.4, 0.6, 0.9);
      const lintel = new THREE.Mesh(lintelGeo, this.cliffMat);
      lintel.position.set(0, 4.2, 0);
      lintel.castShadow = true;
      arch.add(lintel);

      const portalRuneGeo = new THREE.RingGeometry(0.3, 1.2, 16);
      const portalRune = new THREE.Mesh(portalRuneGeo, this.gateRuneMat);
      portalRune.position.set(0, 2.2, 0);
      arch.add(portalRune);

      this.group.add(arch);
    });
  }

  update(deltaTime) {
    if (this.cairnApex) {
      this.cairnApex.rotation.y += deltaTime * 1.5;
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
