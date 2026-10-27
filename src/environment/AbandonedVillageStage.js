import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { BoxCollider, CircleCollider } from '../physics/Colliders.js';

/**
 * Level 4 Playable Environment: The Abandoned Village
 * A deserted medieval settlement with ruined timber-framed cottages,
 * the Crowfall Windmill with rotating vanes, the central Sunken Wellhouse,
 * and palisade gate barricades.
 */
export class AbandonedVillageStage {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();
    this.colliders = [];

    this.windmillSails = null;

    this.initMaterials();
    this.buildTerrain();
    this.buildCottages();
    this.buildCrowfallWindmill();
    this.buildVillageWellhouse();
    this.buildPalisadeBarricades();
    this.buildSecretElderLockbox();
    this.buildPassagePortals();

    this.scene.add(this.group);
  }

  initMaterials() {
    this.stoneTex = TextureGenerator.createStoneTexture(512);
    this.woodTex = TextureGenerator.createWoodTexture(512);

    this.cobbleMat = new THREE.MeshStandardMaterial({
      map: this.stoneTex,
      roughness: 0.85,
      metalness: 0.15
    });

    this.timberMat = new THREE.MeshStandardMaterial({
      map: this.woodTex,
      roughness: 0.8,
      metalness: 0.1
    });

    this.thatchMat = new THREE.MeshStandardMaterial({
      color: 0x473c2b,
      roughness: 0.95,
      metalness: 0.05
    });

    this.lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 2.0,
      roughness: 0.2
    });

    this.runeGateMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.0,
      roughness: 0.2,
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
      const dist = Math.hypot(x, z);

      // Village sits in a shallow bowl nestled between gentle ridges
      let y = (Math.sin(x * 0.06) + Math.cos(z * 0.06)) * 0.8;
      if (dist > 44) {
        y += Math.pow((dist - 44) / 22, 1.8) * 12.0;
      }
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    this.groundMesh = new THREE.Mesh(geo, this.cobbleMat);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    this.terrain = {
      getTerrainHeight: (x, z) => {
        let y = (Math.sin(x * 0.06) + Math.cos(z * 0.06)) * 0.8;
        const dist = Math.hypot(x, z);
        if (dist > 44) {
          y += Math.pow((dist - 44) / 22, 1.8) * 12.0;
        }
        return y;
      }
    };

    if (this.physicsWorld) {
      this.physicsWorld.setTerrain(this.terrain);
    }
  }

  buildCottages() {
    // 4 timber-framed houses
    const cottageConfigs = [
      { x: -16, z: -15, rotY: 0.2, w: 9, h: 5, d: 7, name: 'Weaver’s Cottage' },
      { x: 16, z: -18, rotY: -0.3, w: 8, h: 4.8, d: 6.5, name: 'Blacksmith’s Forge' },
      { x: -22, z: 16, rotY: 0.6, w: 10, h: 5.5, d: 8, name: 'Elder’s Manor' },
      { x: 18, z: 18, rotY: -0.5, w: 8.5, h: 5, d: 7, name: 'Tavern Ruins' }
    ];

    cottageConfigs.forEach(c => {
      const cottageGroup = new THREE.Group();
      cottageGroup.position.set(c.x, 0, c.z);
      cottageGroup.rotation.y = c.rotY;

      // Base stone foundation & timber walls
      const wallsGeo = new THREE.BoxGeometry(c.w, c.h, c.d);
      const walls = new THREE.Mesh(wallsGeo, this.timberMat);
      walls.position.y = c.h / 2;
      walls.castShadow = true;
      walls.receiveShadow = true;
      cottageGroup.add(walls);

      // Pitched thatch roof
      const roofGeo = new THREE.ConeGeometry(Math.max(c.w, c.d) * 0.75, 3.2, 4);
      const roof = new THREE.Mesh(roofGeo, this.thatchMat);
      roof.position.y = c.h + 1.6;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      cottageGroup.add(roof);

      // Wooden doorway arch
      const doorGeo = new THREE.BoxGeometry(1.6, 2.6, 0.4);
      const door = new THREE.Mesh(doorGeo, this.thatchMat);
      door.position.set(0, 1.3, c.d / 2 + 0.1);
      cottageGroup.add(door);

      this.group.add(cottageGroup);

      if (this.physicsWorld) {
        const col = new BoxCollider(c.x, c.z, c.w + 0.5, c.d + 0.5);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }
    });
  }

  buildCrowfallWindmill() {
    // Crowfall Windmill at x: 26, z: -2
    const windmillGroup = new THREE.Group();
    windmillGroup.position.set(26, 0, -2);

    // Stone base tower
    const baseGeo = new THREE.CylinderGeometry(3.6, 4.4, 9.0, 10);
    const base = new THREE.Mesh(baseGeo, this.cobbleMat);
    base.position.y = 4.5;
    base.castShadow = true;
    base.receiveShadow = true;
    windmillGroup.add(base);

    // Conical cap roof
    const capGeo = new THREE.ConeGeometry(3.8, 2.8, 10);
    const cap = new THREE.Mesh(capGeo, this.thatchMat);
    cap.position.y = 10.4;
    cap.castShadow = true;
    windmillGroup.add(cap);

    // Rotating Sails Hub
    const sailsGroup = new THREE.Group();
    sailsGroup.position.set(0, 8.5, 3.8);

    const hubGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, this.timberMat);
    sailsGroup.add(hub);

    // 4 sails
    const vaneGeo = new THREE.BoxGeometry(0.5, 7.0, 0.1);
    for (let i = 0; i < 4; i++) {
      const vane = new THREE.Mesh(vaneGeo, this.timberMat);
      vane.rotation.z = (i * Math.PI) / 2;
      vane.castShadow = true;
      sailsGroup.add(vane);
    }

    windmillGroup.add(sailsGroup);
    this.windmillSails = sailsGroup;

    // Lantern hanging on the door
    const lanternGeo = new THREE.DodecahedronGeometry(0.35);
    const lantern = new THREE.Mesh(lanternGeo, this.lanternGlowMat);
    lantern.position.set(0, 2.8, 4.1);
    windmillGroup.add(lantern);

    const lanternLight = new THREE.PointLight(0xf59e0b, 1.2, 12);
    lanternLight.position.set(26, 2.8, 2.3);
    this.group.add(lanternLight);

    this.group.add(windmillGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(26, -2, 4.2);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  buildVillageWellhouse() {
    // Sunken Wellhouse at x: -5, z: 5
    const wellGroup = new THREE.Group();
    wellGroup.position.set(-5, 0, 5);

    // Stone well ring
    const wellGeo = new THREE.CylinderGeometry(1.8, 2.0, 1.2, 12, 1, true);
    const well = new THREE.Mesh(wellGeo, this.cobbleMat);
    well.position.y = 0.6;
    well.castShadow = true;
    wellGroup.add(well);

    // Timber posts & roof canopy
    [-1.6, 1.6].forEach(px => {
      const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.8, 6);
      const post = new THREE.Mesh(postGeo, this.timberMat);
      post.position.set(px, 1.4, 0);
      post.castShadow = true;
      wellGroup.add(post);
    });

    const roofGeo = new THREE.ConeGeometry(2.4, 1.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, this.thatchMat);
    roof.position.y = 3.0;
    roof.castShadow = true;
    wellGroup.add(roof);

    // Well shaft dark interior / secret passage descent indicator
    const discGeo = new THREE.CircleGeometry(1.6, 16);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: 0x047857,
      emissiveIntensity: 1.2
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.3;
    wellGroup.add(disc);

    this.group.add(wellGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(-5, 5, 2.2);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  buildPalisadeBarricades() {
    // Palisade logs along southern approach and borders
    const logGeo = new THREE.CylinderGeometry(0.2, 0.25, 3.2, 6);
    const fenceGroup = new THREE.Group();

    for (let x = -20; x <= 20; x += 1.6) {
      if (Math.abs(x) < 4.0) continue; // Gate opening
      const log = new THREE.Mesh(logGeo, this.timberMat);
      log.position.set(x, 1.6, -38);
      log.rotation.z = (Math.random() - 0.5) * 0.1;
      log.castShadow = true;
      fenceGroup.add(log);
    }

    this.group.add(fenceGroup);

    if (this.physicsWorld) {
      const colLeft = new BoxCollider(-12, -38, 16, 1.5);
      const colRight = new BoxCollider(12, -38, 16, 1.5);
      this.physicsWorld.addCollider(colLeft);
      this.physicsWorld.addCollider(colRight);
      this.colliders.push(colLeft, colRight);
    }
  }

  buildSecretElderLockbox() {
    // Secret Elder's Lockbox behind the manor at x: -25, z: -15
    const chestGroup = new THREE.Group();
    chestGroup.position.set(-25, 0.5, -15);

    const chestGeo = new THREE.BoxGeometry(1.3, 0.8, 0.9);
    const chest = new THREE.Mesh(chestGeo, this.timberMat);
    chest.position.y = 0.4;
    chest.castShadow = true;
    chestGroup.add(chest);

    // Emerald jewel rune on lid
    const runeGeo = new THREE.OctahedronGeometry(0.3);
    const rune = new THREE.Mesh(runeGeo, this.runeGateMat);
    rune.position.set(0, 0.85, 0);
    chestGroup.add(rune);

    this.group.add(chestGroup);

    if (this.physicsWorld) {
      const col = new BoxCollider(-25, -15, 1.6, 1.4);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  buildPassagePortals() {
    const passages = [
      { name: 'Dark Forest Palisade Gate', x: 0, y: 0, z: -40, rotY: 0 },
      { name: 'Mountain Pass Footpath', x: -35, y: 1.0, z: 15, rotY: Math.PI / 2 },
      { name: 'Whispering Cavern Cellar', x: -5, y: 0.2, z: 5, rotY: 0 }
    ];

    passages.forEach(p => {
      if (p.name.includes('Cellar')) return; // Covered by wellhouse

      const gate = new THREE.Group();
      gate.position.set(p.x, p.y, p.z);
      gate.rotation.y = p.rotY;

      const postGeo = new THREE.CylinderGeometry(0.35, 0.45, 4.5, 6);
      const lp = new THREE.Mesh(postGeo, this.timberMat);
      lp.position.set(-2.2, 2.25, 0);
      lp.castShadow = true;
      gate.add(lp);

      const rp = new THREE.Mesh(postGeo, this.timberMat);
      rp.position.set(2.2, 2.25, 0);
      rp.castShadow = true;
      gate.add(rp);

      const topGeo = new THREE.BoxGeometry(5.0, 0.6, 0.6);
      const top = new THREE.Mesh(topGeo, this.timberMat);
      top.position.set(0, 4.3, 0);
      top.castShadow = true;
      gate.add(top);

      const runeGeo = new THREE.RingGeometry(0.4, 1.1, 16);
      const rune = new THREE.Mesh(runeGeo, this.runeGateMat);
      rune.position.set(0, 2.4, 0);
      gate.add(rune);

      this.group.add(gate);
    });
  }

  update(deltaTime) {
    if (this.windmillSails) {
      this.windmillSails.rotation.z += deltaTime * 0.85;
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
