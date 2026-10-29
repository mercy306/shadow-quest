import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Terrain } from './Terrain.js';
import { Ruins } from './Ruins.js';
import { Vegetation } from './Vegetation.js';
import { RuinsStage } from './RuinsStage.js';
import { ArenaGrove } from './ArenaGrove.js';
import { MountainPassStage } from './MountainPassStage.js';
import { AbandonedVillageStage } from './AbandonedVillageStage.js';
import { WhisperingCavernStage } from './WhisperingCavernStage.js';
import { WeatherManager } from './WeatherManager.js';

export class Environment {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.sun = new THREE.Vector3();

    this.currentLevelIndex = 0;
    this.terrain = null;
    this.ruins = null;
    this.vegetation = null;
    this.ruinsStage = null;
    this.arenaGrove = null;
    this.mountainPassStage = null;
    this.abandonedVillageStage = null;
    this.whisperingCavernStage = null;

    this.initLighting();
    this.initSky();

    // Dynamic Weather and Day/Night Manager
    this.weatherManager = new WeatherManager(this, this.scene);

    // Default to Level 1 on initialization
    this.loadLevel(0, physicsWorld);
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0x334155, 0.32);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x22381f, 0.5);
    this.hemiLight.position.set(0, 60, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff3d6, 1.45);
    this.dirLight.position.set(55, 65, 40);
    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1.0;
    this.dirLight.shadow.camera.far = 220;

    const d = 80;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0001;
    this.dirLight.shadow.normalBias = 0.04;

    this.scene.add(this.dirLight);

    // Subtle atmospheric rim light for depth and silhouette definition
    this.rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.4);
    this.rimLight.position.set(-50, 40, -40);
    this.scene.add(this.rimLight);
  }

  initSky() {
    this.sky = new Sky();
    this.sky.scale.setScalar(1800);
    this.scene.add(this.sky);

    // Initial clear Ethiopian highland sky parameters
    const skyUniforms = this.sky.material.uniforms;
    skyUniforms['turbidity'].value = 2.2;
    skyUniforms['rayleigh'].value = 1.6; // Deep vivid sky blue
    skyUniforms['mieCoefficient'].value = 0.003;
    skyUniforms['mieDirectionalG'].value = 0.85;

    this.initClouds();
    this.initSunGlow();
    this.initDistantMountains();
  }

  initClouds() {
    this.cloudGroup = new THREE.Group();

    // Soft illuminated cumulus cloud material
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.0,
      flatShading: true,
      transparent: true,
      opacity: 0.92
    });

    const cloudCount = 28;
    for (let c = 0; c < cloudCount; c++) {
      const cluster = new THREE.Group();

      // Distribute broadly across the sky
      const cx = (Math.random() - 0.5) * 600;
      const cy = 85 + Math.random() * 45; // Altitude 85m to 130m
      const cz = (Math.random() - 0.5) * 600;
      cluster.position.set(cx, cy, cz);

      // Overlapping puffs to form a billowing cumulus cloud
      const puffCount = 5 + Math.floor(Math.random() * 5);
      const clusterScale = 1.2 + Math.random() * 1.5;

      for (let p = 0; p < puffCount; p++) {
        const radius = (8 + Math.random() * 8) * clusterScale;
        const puffGeo = new THREE.DodecahedronGeometry(radius, 1);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 22 * clusterScale,
          (Math.random() - 0.2) * 8 * clusterScale,
          (Math.random() - 0.5) * 18 * clusterScale
        );
        puff.scale.set(1.4, 0.75, 1.1); // Slightly flat on underside like real cumulus
        cluster.add(puff);
      }

      this.cloudGroup.add(cluster);
    }

    this.scene.add(this.cloudGroup);
  }

  initSunGlow() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.15, 'rgba(254, 240, 138, 0.9)');
    grad.addColorStop(0.4, 'rgba(251, 191, 36, 0.4)');
    grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.12)');
    grad.addColorStop(1.0, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    const sunSpriteMat = new THREE.SpriteMaterial({
      map: tex,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sunSprite = new THREE.Sprite(sunSpriteMat);
    this.sunSprite.scale.set(110, 110, 1);
    this.scene.add(this.sunSprite);
  }

  initDistantMountains() {
    this.mountainGroup = new THREE.Group();
    const mtnMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Atmospheric hazy mountain blue-slate
      roughness: 0.95,
      metalness: 0.05
    });

    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 260 + (i % 4) * 35;
      const mtnH = 65 + (i * 19) % 55;
      const mtnW = 110 + (i * 29) % 50;

      const coneGeo = new THREE.ConeGeometry(mtnW, mtnH, 7);
      const mtn = new THREE.Mesh(coneGeo, mtnMat);
      mtn.position.set(Math.cos(angle) * r, mtnH * 0.42, Math.sin(angle) * r);
      mtn.rotation.y = angle + 0.4;
      this.mountainGroup.add(mtn);
    }
    this.scene.add(this.mountainGroup);
  }

  loadLevel(levelIndex, physicsWorld = this.physicsWorld) {
    this.clearLevel();
    this.currentLevelIndex = levelIndex;
    this.physicsWorld = physicsWorld;

    if (levelIndex === 0) {
      // ===== STAGE 1: GONDAR IMPERIAL CITY & BAZAAR (ደረጃ ፩: ጎንደር ከተማ) =====
      // Crisp Ethiopian Highland morning sunshine with golden warmth and crystal clear blue sky
      this.ambientLight.color.setHex(0xfef3c7);
      this.ambientLight.intensity = 0.55;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0xb45309);
      this.hemiLight.intensity = 0.65;

      this.dirLight.color.setHex(0xfffbeb);
      this.dirLight.intensity = 1.5;

      if (this.rimLight) {
        this.rimLight.color.setHex(0xfacc15);
        this.rimLight.intensity = 0.5;
      }

      const skyUniforms = this.sky.material.uniforms;
      skyUniforms['turbidity'].value = 2.2;
      skyUniforms['rayleigh'].value = 1.6; // Deep vivid sky blue
      skyUniforms['mieCoefficient'].value = 0.003;
      skyUniforms['mieDirectionalG'].value = 0.85;

      const elevation = 42;
      const azimuth = 135;
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      this.sun.setFromSphericalCoords(1, phi, theta);
      skyUniforms['sunPosition'].value.copy(this.sun);
      this.dirLight.position.copy(this.sun).multiplyScalar(120);

      this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.0012); // Clear crisp highland atmosphere

      // Build vibrant Ethiopian Imperial City
      this.abandonedVillageStage = new AbandonedVillageStage(this.scene, this.physicsWorld);
      this.terrain = this.abandonedVillageStage.terrain;

    } else if (levelIndex === 1) {
      // ===== STAGE 2: THE ANCIENT RUINS SANCTUARY =====
      // Midnight moonlit illumination with glowing torchlight
      this.ambientLight.color.setHex(0x1e1b4b);
      this.ambientLight.intensity = 0.45;
      this.hemiLight.color.setHex(0x6366f1);
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.hemiLight.intensity = 0.4;

      this.dirLight.color.setHex(0xc7d2fe); // Pale silvery moonlight
      this.dirLight.intensity = 0.95;

      if (this.rimLight) {
        this.rimLight.color.setHex(0xa855f7); // Void amethyst rim
        this.rimLight.intensity = 0.6;
      }

      const skyUniforms = this.sky.material.uniforms;
      skyUniforms['turbidity'].value = 4.0;
      skyUniforms['rayleigh'].value = 0.5;
      skyUniforms['mieCoefficient'].value = 0.01;
      skyUniforms['mieDirectionalG'].value = 0.9;

      const elevation = 45; // High nocturnal moon
      const azimuth = 210;
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      this.sun.setFromSphericalCoords(1, phi, theta);
      skyUniforms['sunPosition'].value.copy(this.sun);
      this.dirLight.position.copy(this.sun).multiplyScalar(90);

      this.scene.fog = new THREE.FogExp2(0x0c111d, 0.011);

      // Build ancient ruins sanctuary stage
      this.ruinsStage = new RuinsStage(this.scene, this.physicsWorld);
      this.terrain = this.ruinsStage.terrain;
      this.ruins = null;
      this.vegetation = null;

    } else if (levelIndex === 2) {
      // ===== STAGE 3: THE MOUNTAIN PASS =====
      // Crisp alpine daylight with cool mountain rim light
      this.ambientLight.color.setHex(0x38bdf8);
      this.ambientLight.intensity = 0.35;
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.55;

      this.dirLight.color.setHex(0xfef08a);
      this.dirLight.intensity = 1.35;

      if (this.rimLight) {
        this.rimLight.color.setHex(0x7dd3fc);
        this.rimLight.intensity = 0.55;
      }

      const skyUniforms = this.sky.material.uniforms;
      skyUniforms['turbidity'].value = 5.0;
      skyUniforms['rayleigh'].value = 1.2;
      skyUniforms['mieCoefficient'].value = 0.003;
      skyUniforms['mieDirectionalG'].value = 0.75;

      const elevation = 35;
      const azimuth = 150;
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      this.sun.setFromSphericalCoords(1, phi, theta);
      skyUniforms['sunPosition'].value.copy(this.sun);
      this.dirLight.position.copy(this.sun).multiplyScalar(90);

      this.scene.fog = new THREE.FogExp2(0x475569, 0.007);

      this.mountainPassStage = new MountainPassStage(this.scene, this.physicsWorld);
      this.terrain = this.mountainPassStage.terrain;

    } else if (levelIndex === 3) {
      // ===== STAGE 4: THE SIMIEN HIGHLANDS WILDERNESS (ደረጃ ፬: ደብረ ስሜን) =====
      // Golden afternoon sunlight with mountain breeze
      this.ambientLight.color.setHex(0x334155);
      this.ambientLight.intensity = 0.35;
      this.hemiLight.color.setHex(0x93c5fd);
      this.hemiLight.groundColor.setHex(0x22381f);
      this.hemiLight.intensity = 0.5;

      this.dirLight.color.setHex(0xfff3d6);
      this.dirLight.intensity = 1.45;

      if (this.rimLight) {
        this.rimLight.color.setHex(0x7dd3fc);
        this.rimLight.intensity = 0.45;
      }

      const skyUniforms = this.sky.material.uniforms;
      skyUniforms['turbidity'].value = 9.0;
      skyUniforms['rayleigh'].value = 2.4;
      skyUniforms['mieCoefficient'].value = 0.005;
      skyUniforms['mieDirectionalG'].value = 0.82;

      const elevation = 20;
      const azimuth = 130;
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      this.sun.setFromSphericalCoords(1, phi, theta);
      skyUniforms['sunPosition'].value.copy(this.sun);
      this.dirLight.position.copy(this.sun).multiplyScalar(90);

      this.scene.fog = new THREE.FogExp2(0x38485c, 0.0085);

      // Build forest environment
      this.terrain = new Terrain(this.scene);
      if (this.physicsWorld) {
        this.physicsWorld.setTerrain(this.terrain);
      }
      this.ruins = new Ruins(this.scene, this.terrain, this.physicsWorld);
      this.vegetation = new Vegetation(this.scene, this.terrain, this.physicsWorld);
      this.arenaGrove = new ArenaGrove(this.scene, this.terrain, this.physicsWorld);

    } else if (levelIndex === 4) {
      // ===== STAGE 5: THE WHISPERING CAVERN =====
      // Subterranean dark cavern illuminated by bioluminescent glow
      this.ambientLight.color.setHex(0x082f49);
      this.ambientLight.intensity = 0.3;
      this.hemiLight.color.setHex(0x06b6d4);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.35;

      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.45;

      if (this.rimLight) {
        this.rimLight.color.setHex(0xa855f7);
        this.rimLight.intensity = 0.7;
      }

      const skyUniforms = this.sky.material.uniforms;
      skyUniforms['turbidity'].value = 2.0;
      skyUniforms['rayleigh'].value = 0.1;
      skyUniforms['mieCoefficient'].value = 0.02;
      skyUniforms['mieDirectionalG'].value = 0.95;

      const elevation = 5;
      const azimuth = 180;
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      this.sun.setFromSphericalCoords(1, phi, theta);
      skyUniforms['sunPosition'].value.copy(this.sun);
      this.dirLight.position.copy(this.sun).multiplyScalar(90);

      this.scene.fog = new THREE.FogExp2(0x030712, 0.014);

      this.whisperingCavernStage = new WhisperingCavernStage(this.scene, this.physicsWorld);
      this.terrain = this.whisperingCavernStage.terrain;
    }

    this.registerLevelMaterials();
  }

  /**
   * Registers current stage meshes for dynamic wetness roughness/reflectivity modulation
   */
  registerLevelMaterials() {
    if (!this.weatherManager) return;
    this.weatherManager.registeredMaterials.clear();

    const registerRecursive = (obj) => {
      if (!obj) return;
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => this.weatherManager.registerMaterial(m));
        } else {
          this.weatherManager.registerMaterial(obj.material);
        }
      }
      if (obj.children) {
        obj.children.forEach(child => registerRecursive(child));
      }
    };

    if (this.terrain && this.terrain.mesh) registerRecursive(this.terrain.mesh);
    if (this.ruins && this.ruins.group) registerRecursive(this.ruins.group);
    if (this.ruinsStage && this.ruinsStage.group) registerRecursive(this.ruinsStage.group);
    if (this.arenaGrove && this.arenaGrove.group) registerRecursive(this.arenaGrove.group);
    if (this.mountainPassStage && this.mountainPassStage.group) registerRecursive(this.mountainPassStage.group);
    if (this.abandonedVillageStage && this.abandonedVillageStage.group) registerRecursive(this.abandonedVillageStage.group);
    if (this.whisperingCavernStage && this.whisperingCavernStage.group) registerRecursive(this.whisperingCavernStage.group);
  }

  clearLevel() {
    if (this.weatherManager) {
      this.weatherManager.registeredMaterials.clear();
    }
    if (this.terrain && this.terrain.mesh) {
      this.scene.remove(this.terrain.mesh);
      this.terrain = null;
    }
    if (this.ruins && this.ruins.group) {
      this.scene.remove(this.ruins.group);
      this.ruins = null;
    }
    if (this.arenaGrove) {
      this.arenaGrove.dispose();
      this.arenaGrove = null;
    }
    if (this.vegetation) {
      if (this.vegetation.motes) this.scene.remove(this.vegetation.motes);
      if (this.vegetation.grassMesh) this.scene.remove(this.vegetation.grassMesh);
      this.vegetation = null;
    }
    if (this.ruinsStage) {
      this.ruinsStage.dispose();
      this.ruinsStage = null;
    }
    if (this.mountainPassStage) {
      this.mountainPassStage.dispose();
      this.mountainPassStage = null;
    }
    if (this.abandonedVillageStage) {
      this.abandonedVillageStage.dispose();
      this.abandonedVillageStage = null;
    }
    if (this.whisperingCavernStage) {
      this.whisperingCavernStage.dispose();
      this.whisperingCavernStage = null;
    }
  }

  update(deltaTime, playerPosition = null) {
    // Dynamic Weather and Day/Night update
    if (this.weatherManager) {
      this.weatherManager.update(deltaTime, playerPosition, this.currentLevelIndex);
    }

    // Keep sky dome & mountain horizon centered around player
    if (playerPosition) {
      if (this.sky) {
        this.sky.position.set(playerPosition.x, 0, playerPosition.z);
      }
      if (this.mountainGroup) {
        this.mountainGroup.position.set(playerPosition.x, 0, playerPosition.z);
      }
    }

    // Realistic wind drifting of cumulus clouds
    if (this.cloudGroup) {
      this.cloudGroup.position.x += deltaTime * 2.5;
      if (this.cloudGroup.position.x > 300) {
        this.cloudGroup.position.x -= 600;
      }
    }

    // Celestial Sun sprite tracking
    if (this.sunSprite && this.dirLight) {
      this.sunSprite.position.copy(this.dirLight.position);
    }

    if (this.abandonedVillageStage) {
      this.abandonedVillageStage.update(deltaTime);
    }

    if (this.currentLevelIndex === 0) {
      if (this.ruins) this.ruins.update(deltaTime);
      if (this.vegetation) this.vegetation.update(deltaTime);
      if (this.arenaGrove) this.arenaGrove.update(deltaTime, playerPosition);
    } else if (this.currentLevelIndex === 1) {
      if (this.ruinsStage) this.ruinsStage.update(deltaTime);
    } else if (this.currentLevelIndex === 2) {
      if (this.mountainPassStage) this.mountainPassStage.update(deltaTime);
    } else if (this.currentLevelIndex === 3) {
      if (this.abandonedVillageStage) this.abandonedVillageStage.update(deltaTime);
    } else if (this.currentLevelIndex === 4) {
      if (this.whisperingCavernStage) this.whisperingCavernStage.update(deltaTime);
    }
  }

  dispose() {
    this.clearLevel();
    if (this.weatherManager) {
      this.weatherManager.dispose();
      this.weatherManager = null;
    }
  }

  getTerrainHeight(x, z) {
    if (this.terrain && typeof this.terrain.getTerrainHeight === 'function') {
      return this.terrain.getTerrainHeight(x, z);
    }
    return 0;
  }

  isNearCover(x, z) {
    if (this.vegetation && typeof this.vegetation.isNearCover === 'function') {
      return this.vegetation.isNearCover(x, z);
    }
    return false;
  }
}

