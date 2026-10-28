import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { CircleCollider, BoxCollider } from '../physics/Colliders.js';

/**
 * Level 2 Playable Environment: The Ancient Ruins Sanctuary
 * Features ancient stone corridors, broken concentric walls, colonnades,
 * atmospheric moonlight and glowing fire braziers.
 */
export class RuinsStage {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();

    this.brazierLights = [];
    this.initMaterials();
    this.buildGround();
    this.buildRuinedCorridors();
    this.buildColonnade();
    this.buildAxumiteObelisks();
    this.buildBraziers();
    this.buildSanctumAltar();

    this.scene.add(this.group);
  }

  initMaterials() {
    this.stoneTex = TextureGenerator.createStoneTexture(512);

    this.stoneMat = new THREE.MeshStandardMaterial({
      map: this.stoneTex,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: false
    });

    this.floorMat = new THREE.MeshStandardMaterial({
      map: this.stoneTex,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: false
    });

    this.altarMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.75
    });

    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7, // Royal Purple / Void Amethyst
      emissive: 0x9333ea,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });

    this.brazierMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.3
    });
  }

  buildGround() {
    // Large flagstone ground plane
    const groundGeo = new THREE.PlaneGeometry(180, 180, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);

    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.hypot(x, z);

      // Elevated outer courtyard rim, sunken central arena
      let y = (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 0.2;
      if (dist > 45) {
        y += Math.pow((dist - 45) / 35, 1.8) * 8.0;
      }
      pos.setY(i, y);
    }
    groundGeo.computeVertexNormals();

    this.groundMesh = new THREE.Mesh(groundGeo, this.floorMat);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    // Provide terrain interface for physics
    this.terrain = {
      getTerrainHeight: (x, z) => {
        const dist = Math.hypot(x, z);
        let y = (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 0.2;
        if (dist > 45) {
          y += Math.pow((dist - 45) / 35, 1.8) * 8.0;
        }
        return y;
      }
    };

    if (this.physicsWorld) {
      this.physicsWorld.setTerrain(this.terrain);
    }
  }

  buildRuinedCorridors() {
    // Concentric ruined stone walls forming narrow pathways & corridors
    const wallConfigs = [
      // Outer ring corridor walls
      { x: 0, z: -25, w: 22, l: 1.4, h: 4.5, rot: 0 },
      { x: -25, z: 0, w: 1.4, l: 22, h: 4.5, rot: 0 },
      { x: 25, z: 0, w: 1.4, l: 22, h: 4.5, rot: 0 },
      { x: 0, z: 25, w: 22, l: 1.4, h: 4.5, rot: 0 },

      // Diagonal corridor segments creating maze-like ruins
      { x: -16, z: -16, w: 12, l: 1.4, h: 3.8, rot: Math.PI / 4 },
      { x: 16, z: -16, w: 12, l: 1.4, h: 3.8, rot: -Math.PI / 4 },
      { x: -16, z: 16, w: 12, l: 1.4, h: 3.8, rot: -Math.PI / 4 },
      { x: 16, z: 16, w: 12, l: 1.4, h: 3.8, rot: Math.PI / 4 },

      // Inner courtyard partition walls
      { x: -8, z: -8, w: 6, l: 1.2, h: 3.2, rot: 0 },
      { x: 8, z: -8, w: 6, l: 1.2, h: 3.2, rot: 0 },
      { x: -8, z: 8, w: 6, l: 1.2, h: 3.2, rot: 0 },
      { x: 8, z: 8, w: 6, l: 1.2, h: 3.2, rot: 0 }
    ];

    wallConfigs.forEach(cfg => {
      const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.l);
      const wall = new THREE.Mesh(geo, this.stoneMat);
      wall.position.set(cfg.x, cfg.h / 2, cfg.z);
      wall.rotation.y = cfg.rot;
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);

      if (this.physicsWorld) {
        this.physicsWorld.addCollider(new BoxCollider(
          cfg.x,
          cfg.z,
          cfg.w / 2,
          cfg.l / 2,
          cfg.rot,
          -0.5,
          cfg.h + 1,
          'wall'
        ));
      }
    });
  }

  buildColonnade() {
    // Ring of 12 ancient pillars around the central arena
    const pillarCount = 12;
    const radius = 18;
    const pillarGeo = new THREE.CylinderGeometry(0.75, 0.85, 7.5, 12);
    const plinthGeo = new THREE.BoxGeometry(2.0, 0.6, 2.0);

    for (let i = 0; i < pillarCount; i++) {
      // Leave entrance gaps on cardinal axes
      if (i % 3 === 0) continue;

      const angle = (i / pillarCount) * Math.PI * 2;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      const pGroup = new THREE.Group();
      pGroup.position.set(px, 0, pz);

      const shaft = new THREE.Mesh(pillarGeo, this.stoneMat);
      shaft.position.y = 3.75;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      pGroup.add(shaft);

      const plinth = new THREE.Mesh(plinthGeo, this.stoneMat);
      plinth.position.y = 0.3;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      pGroup.add(plinth);

      this.group.add(pGroup);

      if (this.physicsWorld) {
        this.physicsWorld.addCollider(new CircleCollider(
          px,
          pz,
          0.95,
          -0.5,
          8.5,
          'pillar'
        ));
      }
    }
  }

  buildAxumiteObelisks() {
    // Majestic Axumite Hawilti Obelisks standing as sacred monuments
    const obeliskPositions = [
      { x: -18, z: 0, h: 16, rot: Math.PI / 2 },
      { x: 18, z: 0, h: 16, rot: -Math.PI / 2 },
      { x: 0, z: -28, h: 20, rot: 0 }
    ];

    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.85 });
    const discMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });

    obeliskPositions.forEach(cfg => {
      const obeliskGroup = new THREE.Group();
      obeliskGroup.position.set(cfg.x, 0, cfg.z);
      obeliskGroup.rotation.y = cfg.rot;

      // Base stepped plinth
      const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 3.6), this.stoneMat);
      plinth1.position.y = 0.3;
      plinth1.castShadow = true;
      plinth1.receiveShadow = true;
      obeliskGroup.add(plinth1);

      const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 2.8), this.stoneMat);
      plinth2.position.y = 0.85;
      plinth2.castShadow = true;
      plinth2.receiveShadow = true;
      obeliskGroup.add(plinth2);

      // Monolithic Tapered Stele
      const baseW = 2.0;
      const topW = 1.3;
      const shaftH = cfg.h - 2.5;
      const shaftGeo = new THREE.BoxGeometry(baseW, shaftH, baseW);
      const pos = shaftGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const py = pos.getY(i);
        const factor = (py + shaftH / 2) / shaftH;
        const scale = 1.0 - factor * (1.0 - topW / baseW);
        pos.setX(i, pos.getX(i) * scale);
        pos.setZ(i, pos.getZ(i) * scale);
      }
      shaftGeo.computeVertexNormals();

      const shaft = new THREE.Mesh(shaftGeo, this.stoneMat);
      shaft.position.y = 1.1 + shaftH / 2;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      obeliskGroup.add(shaft);

      // Axumite false architectural stories & beam ends
      const stories = Math.floor(shaftH / 2.3);
      for (let s = 1; s <= stories; s++) {
        const sy = 1.1 + s * 2.3;
        const factor = (sy - 1.1) / shaftH;
        const currentW = baseW - factor * (baseW - topW);

        const ledge = new THREE.Mesh(new THREE.BoxGeometry(currentW + 0.14, 0.12, currentW + 0.14), this.stoneMat);
        ledge.position.y = sy;
        ledge.castShadow = true;
        obeliskGroup.add(ledge);

        const win = new THREE.Mesh(new THREE.BoxGeometry(currentW * 0.44, 0.95, currentW + 0.04), darkWoodMat);
        win.position.set(0, sy - 0.95, 0);
        obeliskGroup.add(win);
      }

      // Semicircular crown arch
      const crownApexY = 1.1 + shaftH;
      const archGeo = new THREE.CylinderGeometry(topW * 0.48, topW * 0.48, topW * 0.9, 16);
      archGeo.rotateZ(Math.PI / 2);
      const arch = new THREE.Mesh(archGeo, this.stoneMat);
      arch.position.set(0, crownApexY, 0);
      arch.castShadow = true;
      obeliskGroup.add(arch);

      // Gold Axumite Solar Disc
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12), discMat);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(0, crownApexY + 0.55, 0);
      disc.castShadow = true;
      obeliskGroup.add(disc);

      this.group.add(obeliskGroup);

      if (this.physicsWorld) {
        this.physicsWorld.addCollider(new CircleCollider(
          cfg.x,
          cfg.z,
          1.8,
          -0.5,
          cfg.h + 1,
          'obelisk'
        ));
      }
    });
  }

  buildBraziers() {
    // 6 flickering warm torch braziers along the corridors
    const brazierPositions = [
      { x: -12, z: -12 },
      { x: 12, z: -12 },
      { x: -12, z: 12 },
      { x: 12, z: 12 },
      { x: 0, z: -20 },
      { x: 0, z: 20 }
    ];

    const bowlGeo = new THREE.CylinderGeometry(0.8, 0.4, 0.9, 8);
    const standGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.4, 8);

    brazierPositions.forEach(p => {
      const bGroup = new THREE.Group();
      bGroup.position.set(p.x, 0, p.z);

      const stand = new THREE.Mesh(standGeo, this.brazierMat);
      stand.position.y = 0.7;
      stand.castShadow = true;
      bGroup.add(stand);

      const bowl = new THREE.Mesh(bowlGeo, this.brazierMat);
      bowl.position.y = 1.6;
      bowl.castShadow = true;
      bGroup.add(bowl);

      // Glowing ember fire sphere
      const fireGeo = new THREE.DodecahedronGeometry(0.35, 1);
      const fireMat = new THREE.MeshBasicMaterial({ color: 0xfb923c });
      const fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.y = 2.1;
      bGroup.add(fire);

      // Flickering fire point light
      const fireLight = new THREE.PointLight(0xf97316, 2.4, 14, 1.6);
      fireLight.position.y = 2.3;
      bGroup.add(fireLight);

      this.brazierLights.push(fireLight);
      this.group.add(bGroup);

      if (this.physicsWorld) {
        this.physicsWorld.addCollider(new CircleCollider(p.x, p.z, 0.7, -0.5, 3.0, 'brazier'));
      }
    });
  }

  buildSanctumAltar() {
    // Central circular sanctum dais (Exit / Goal)
    const daisGeo = new THREE.CylinderGeometry(4.2, 4.8, 1.0, 16);
    const dais = new THREE.Mesh(daisGeo, this.stoneMat);
    dais.position.y = 0.5;
    dais.castShadow = true;
    dais.receiveShadow = true;
    this.group.add(dais);

    const altarTopGeo = new THREE.CylinderGeometry(2.0, 2.4, 0.8, 8);
    const altarTop = new THREE.Mesh(altarTopGeo, this.altarMat);
    altarTop.position.y = 1.4;
    altarTop.castShadow = true;
    this.group.add(altarTop);

    // Floating Ancient Void Relic
    const coreGeo = new THREE.OctahedronGeometry(0.75, 0);
    this.relicCore = new THREE.Mesh(coreGeo, this.coreMat);
    this.relicCore.position.y = 2.8;
    this.relicCore.castShadow = true;
    this.group.add(this.relicCore);

    this.sanctumLight = new THREE.PointLight(0xa855f7, 3.0, 16, 1.8);
    this.sanctumLight.position.y = 3.0;
    this.group.add(this.sanctumLight);

    // Active exit beacon beam
    const beamGeo = new THREE.CylinderGeometry(2.0, 2.5, 50, 16, 1, true);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.exitBeam = new THREE.Mesh(beamGeo, this.beamMat);
    this.exitBeam.position.y = 25;
    this.exitBeam.visible = false;
    this.group.add(this.exitBeam);

    if (this.physicsWorld) {
      this.physicsWorld.addPlatform({
        hasWall: false,
        isPointInside: (x, z) => Math.hypot(x, z) <= 4.5,
        getHeight: () => 1.0
      });
      this.physicsWorld.addCollider(new CircleCollider(0, 0, 2.4, 0.8, 4.0, 'altar'));
    }
  }

  unlockSanctum() {
    if (this.exitBeam) {
      this.exitBeam.visible = true;
      let op = 0;
      const interval = setInterval(() => {
        op += 0.04;
        if (op >= 0.7) clearInterval(interval);
        this.beamMat.opacity = op;
      }, 30);
    }
    if (this.sanctumLight) {
      this.sanctumLight.intensity = 6.0;
    }
  }

  update(deltaTime) {
    if (this.relicCore) {
      this.relicCore.rotation.y += deltaTime * 1.2;
      this.relicCore.position.y = 2.8 + Math.sin(Date.now() * 0.003) * 0.15;
    }

    if (this.exitBeam && this.exitBeam.visible) {
      this.exitBeam.rotation.y += deltaTime * 0.5;
    }

    // Torchlight subtle flickering
    const time = Date.now() * 0.006;
    for (let i = 0; i < this.brazierLights.length; i++) {
      this.brazierLights[i].intensity = 2.2 + Math.sin(time + i * 1.5) * 0.4;
    }
  }

  dispose() {
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
