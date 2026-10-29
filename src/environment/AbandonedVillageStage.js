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
    this.buildBetGiyorgisShrine();
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

    this.tuffMat = new THREE.MeshStandardMaterial({
      color: 0x8b4538, // Warm reddish-brown volcanic tuff stone of Lalibela
      roughness: 0.92,
      metalness: 0.08
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
    // Traditional Ethiopian circular stone Tukuls (ቱኩል) with conical thatched roofs
    const tukulConfigs = [
      { x: -16, z: -15, rotY: 0.2, r: 4.2, h: 4.8, name: 'Weaver’s Tukul (የሸማኔ ቤት)' },
      { x: 16, z: -18, rotY: -0.3, r: 3.8, h: 4.5, name: 'Blacksmith’s Forge (የአንጥረኛ ቤት)' },
      { x: -22, z: 16, rotY: 0.6, r: 4.6, h: 5.2, name: 'Hermitage Sanctuary (የባሕታዊ ማደሪያ)' },
      { x: 18, z: 18, rotY: -0.5, r: 4.0, h: 4.8, name: 'Guest Dwelling (የእንግዳ ማረፊያ)' }
    ];

    const finialMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 });

    tukulConfigs.forEach(c => {
      const tukulGroup = new THREE.Group();
      tukulGroup.position.set(c.x, 0, c.z);
      tukulGroup.rotation.y = c.rotY;

      // Circular stone wall base
      const wallsGeo = new THREE.CylinderGeometry(c.r, c.r * 1.05, c.h, 16);
      const walls = new THREE.Mesh(wallsGeo, this.cobbleMat);
      walls.position.y = c.h / 2;
      walls.castShadow = true;
      walls.receiveShadow = true;
      tukulGroup.add(walls);

      // Traditional conical thatched roof (ሳር ክዳን)
      const roofH = 3.4;
      const roofGeo = new THREE.ConeGeometry(c.r * 1.25, roofH, 16);
      const roof = new THREE.Mesh(roofGeo, this.thatchMat);
      roof.position.y = c.h + roofH / 2;
      roof.castShadow = true;
      tukulGroup.add(roof);

      // Clay / Brass finial at the roof apex (የጣሪያ ማሰሪያ / ጉልላት)
      const finialGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const finial = new THREE.Mesh(finialGeo, finialMat);
      finial.position.y = c.h + roofH + 0.25;
      tukulGroup.add(finial);

      // Carved wooden entrance door
      const doorGeo = new THREE.BoxGeometry(1.4, 2.4, 0.35);
      const door = new THREE.Mesh(doorGeo, this.timberMat);
      door.position.set(0, 1.2, c.r);
      tukulGroup.add(door);

      this.group.add(tukulGroup);

      if (this.physicsWorld) {
        const col = new CircleCollider(c.x, c.z, c.r + 0.4);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }
    });
  }

  /**
   * Monolithic Rock-Hewn Greek Cross Church inspired by Bet Giyorgis (ቤተ ጊዮርጊስ) in Lalibela
   */
  buildBetGiyorgisShrine() {
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(-1.0, 0, -2.0);

    // Carved rock trench platform
    const trenchGeo = new THREE.BoxGeometry(16, 0.4, 16);
    const trench = new THREE.Mesh(trenchGeo, this.cobbleMat);
    trench.position.y = 0.2;
    trench.receiveShadow = true;
    shrineGroup.add(trench);

    // Monolithic Greek Cross Footprint (two intersecting perpendicular stone blocks)
    const armLen = 8.5;
    const armWidth = 3.2;
    const wallHeight = 6.2;

    const arm1Geo = new THREE.BoxGeometry(armLen, wallHeight, armWidth);
    const arm1 = new THREE.Mesh(arm1Geo, this.tuffMat);
    arm1.position.y = wallHeight / 2 + 0.4;
    arm1.castShadow = true;
    arm1.receiveShadow = true;
    shrineGroup.add(arm1);

    const arm2Geo = new THREE.BoxGeometry(armWidth, wallHeight, armLen);
    const arm2 = new THREE.Mesh(arm2Geo, this.tuffMat);
    arm2.position.y = wallHeight / 2 + 0.4;
    arm2.castShadow = true;
    arm2.receiveShadow = true;
    shrineGroup.add(arm2);

    // Flat roof carved with authentic concentric Greek Crosses (symbol of Bet Giyorgis)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x6e352b,
      roughness: 0.95
    });
    const roofArm1 = new THREE.Mesh(new THREE.BoxGeometry(armLen + 0.1, 0.25, armWidth + 0.1), roofMat);
    roofArm1.position.y = wallHeight + 0.52;
    shrineGroup.add(roofArm1);

    const roofArm2 = new THREE.Mesh(new THREE.BoxGeometry(armWidth + 0.1, 0.25, armLen + 0.1), roofMat);
    roofArm2.position.y = wallHeight + 0.52;
    shrineGroup.add(roofArm2);

    // Carved Axumite style ogival arched windows with cross apertures
    const winMat = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.9 });
    [-2.6, 2.6].forEach(xOff => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, armWidth + 0.08), winMat);
      win.position.set(xOff, 3.8, 0);
      shrineGroup.add(win);
    });

    this.group.add(shrineGroup);

    if (this.physicsWorld) {
      const col1 = new BoxCollider(-1.0, -2.0, armLen / 2 + 0.2, armWidth / 2 + 0.2);
      const col2 = new BoxCollider(-1.0, -2.0, armWidth / 2 + 0.2, armLen / 2 + 0.2);
      this.physicsWorld.addCollider(col1);
      this.physicsWorld.addCollider(col2);
      this.colliders.push(col1, col2);
    }
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
