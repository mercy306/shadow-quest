import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Terrain } from './Terrain.js';
import { Ruins } from './Ruins.js';
import { Vegetation } from './Vegetation.js';
import { RuinsStage } from './RuinsStage.js';

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

    this.initLighting();
    this.initSky();

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
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.035;

    this.scene.add(this.dirLight);

    // Subtle atmospheric rim light for depth and silhouette definition
    this.rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.4);
    this.rimLight.position.set(-50, 40, -40);
    this.scene.add(this.rimLight);
  }

  initSky() {
    this.sky = new Sky();
    this.sky.scale.setScalar(450000);
    this.scene.add(this.sky);
  }

  loadLevel(levelIndex, physicsWorld = this.physicsWorld) {
    this.clearLevel();
    this.currentLevelIndex = levelIndex;
    this.physicsWorld = physicsWorld;

    if (levelIndex === 0) {
      // ===== STAGE 1: THE DARK FOREST =====
      // Golden afternoon sunlight
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

    } else {
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
    }
  }

  clearLevel() {
    if (this.terrain && this.terrain.mesh) {
      this.scene.remove(this.terrain.mesh);
      this.terrain = null;
    }
    if (this.ruins && this.ruins.group) {
      this.scene.remove(this.ruins.group);
      this.ruins = null;
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
  }

  update(deltaTime) {
    if (this.currentLevelIndex === 0) {
      if (this.ruins) this.ruins.update(deltaTime);
      if (this.vegetation) this.vegetation.update(deltaTime);
    } else {
      if (this.ruinsStage) this.ruinsStage.update(deltaTime);
    }
  }

  getTerrainHeight(x, z) {
    if (this.terrain && typeof this.terrain.getTerrainHeight === 'function') {
      return this.terrain.getTerrainHeight(x, z);
    }
    return 0;
  }
}
