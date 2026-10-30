import { TextureGenerator } from './TextureGenerator.js';
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
  constructor(scene, physicsWorld = null, renderer = null) {
    this.renderer = renderer;
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
    this.initEnvironmentReflections();

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

    this.dirLight.shadow.mapSize.width = 4096;
    this.dirLight.shadow.mapSize.height = 4096;
    this.dirLight.shadow.camera.near = 1.0;
    this.dirLight.shadow.camera.far = 220;

    const d = 80;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0002;
    this.dirLight.shadow.normalBias = 0.025;

    this.scene.add(this.dirLight);

    // Subtle atmospheric rim light for depth and silhouette definition
    this.rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.4);
    this.rimLight.position.set(-50, 40, -40);
    this.scene.add(this.rimLight);
  }

  initEnvironmentReflections() {
    if (this.renderer) {
      try {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        const skyCanvas = TextureGenerator.createHdriSkyCanvas(512, 256);
        const envTex = new THREE.CanvasTexture(skyCanvas);
        envTex.mapping = THREE.EquirectangularReflectionMapping;
        envTex.colorSpace = THREE.SRGBColorSpace;
        this.scene.environment = pmrem.fromEquirectangular(envTex).texture;
        pmrem.dispose();
        envTex.dispose();
      } catch (err) {
        console.warn('[Environment] PMREM sky reflections initialization:', err);
      }
    }
  }

  initSky() {
    // Photorealistic Panoramic Sky Shader Dome with atmospheric scattering, celestial sun glare, and soft drifting clouds
    const skyGeo = new THREE.SphereGeometry(1500, 64, 32);

    const skyShader = {
      uniforms: {
        sunPosition: { value: new THREE.Vector3(50, 75, 40).normalize() },
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 sunPosition;
        uniform float time;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot * p * 2.02;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float y = dir.y;

          // Atmospheric Rayleigh & Mie sky gradient: Rich Ethiopian morning blue zenith to soft warm horizon
          vec3 zenith = vec3(0.10, 0.42, 0.82);      // Rich Ethiopian highland blue
          vec3 midSky = vec3(0.30, 0.60, 0.90);      // Azure mid-altitude
          vec3 horizon = vec3(0.84, 0.90, 0.97);     // Soft golden atmospheric horizon
          vec3 groundHaze = vec3(0.70, 0.76, 0.80);  // Low horizon tone

          vec3 col;
          if (y >= 0.0) {
            float t = pow(y, 0.55);
            col = mix(horizon, midSky, t);
            col = mix(col, zenith, pow(y, 1.7));
          } else {
            col = mix(horizon, groundHaze, clamp(-y * 4.0, 0.0, 1.0));
          }

          // Brilliant Celestial Sun Disc & Radiant Golden Corona
          vec3 sDir = normalize(sunPosition);
          float cosTheta = dot(dir, sDir);
          float sunDisc = smoothstep(0.9993, 0.9998, cosTheta);
          float sunGlow = pow(max(0.0, cosTheta), 12.0) * 0.4 + pow(max(0.0, cosTheta), 64.0) * 0.65;
          vec3 sunColor = vec3(1.0, 0.97, 0.88);
          col += sunColor * (sunDisc * 2.8 + sunGlow * 0.85);

          // Soft realistic drifting cumulus and cirrus clouds
          if (y > 0.02) {
            vec2 cloudUV = dir.xz / (y + 0.15) * 0.55;
            cloudUV += vec2(time * 0.006, time * 0.003); // Natural smooth wind drift

            float cNoise = fbm(cloudUV * 1.5);
            float cDensity = smoothstep(0.48, 0.75, cNoise);

            // Cloud lighting: Warm sunlit crests, soft shaded undersides
            float sunFacing = dot(dir, sDir) * 0.5 + 0.5;
            vec3 cloudLit = mix(vec3(0.96, 0.97, 0.99), vec3(1.0, 0.98, 0.92), sunFacing);
            vec3 cloudShadow = mix(vec3(0.75, 0.80, 0.88), vec3(0.88, 0.90, 0.94), y);
            vec3 cloudCol = mix(cloudShadow, cloudLit, 0.7 + 0.3 * sunFacing);

            // Gentle horizon dissipation (clouds fade out smoothly towards the horizon)
            float horizonFade = smoothstep(0.03, 0.20, y);
            col = mix(col, cloudCol, cDensity * 0.88 * horizonFade);
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    };

    this.skyMat = new THREE.ShaderMaterial(skyShader);
    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyMesh);

    // Backward-compatible this.sky reference for WeatherManager
    this.sky = {
      material: {
        uniforms: {
          sunPosition: this.skyMat.uniforms.sunPosition,
          turbidity: { value: 2.2 },
          rayleigh: { value: 1.6 },
          mieCoefficient: { value: 0.003 },
          mieDirectionalG: { value: 0.85 }
        }
      },
      position: this.skyMesh.position
    };
  }

  loadLevel(levelIndex, physicsWorld = this.physicsWorld) {
    this.clearLevel();
    this.currentLevelIndex = levelIndex;
    this.physicsWorld = physicsWorld;

    if (levelIndex === 0) {
      // ===== STAGE 1: HARAR JUGOL WALLED CITY & BAZAAR (ደረጃ ፩: ሐረር ጁጎል) =====
      // Radiant Eastern Ethiopian plateau sunshine (1,885m altitude) with golden warmth,
      // rich azure sky, and warm bounce light off the indigo blue & terracotta stucco walls
      this.ambientLight.color.setHex(0xfef3c7);
      this.ambientLight.intensity = 0.65;
      this.hemiLight.color.setHex(0x38bdf8); // Vivid azure sky
      this.hemiLight.groundColor.setHex(0xc2410c); // Terracotta ground bounce
      this.hemiLight.intensity = 0.72;

      this.dirLight.color.setHex(0xfff8db); // Warm golden sun
      this.dirLight.intensity = 1.65;

      if (this.rimLight) {
        this.rimLight.color.setHex(0xfbbf24);
        this.rimLight.intensity = 0.55;
      }

      const skyUniforms = this.sky.material.uniforms;
      skyUniforms['turbidity'].value = 2.0;
      skyUniforms['rayleigh'].value = 1.5; // Deep clear highland blue
      skyUniforms['mieCoefficient'].value = 0.0028;
      skyUniforms['mieDirectionalG'].value = 0.85;

      const elevation = 48;
      const azimuth = 140;
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      this.sun.setFromSphericalCoords(1, phi, theta);
      skyUniforms['sunPosition'].value.copy(this.sun);
      this.dirLight.position.copy(this.sun).multiplyScalar(120);

      this.scene.fog = new THREE.FogExp2(0xf0f9ff, 0.0007); // Crystal-clear open horizon

      // Build vibrant historic Harar Jugol walled city
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

    // Animate photorealistic sky shader and keep dome centered around player
    if (this.skyMat && this.skyMat.uniforms.time) {
      this.skyMat.uniforms.time.value += deltaTime;
    }
    if (this.skyMesh && playerPosition) {
      this.skyMesh.position.set(playerPosition.x, 0, playerPosition.z);
    }
    if (this.skyMat && this.skyMat.uniforms.sunPosition && this.sun) {
      this.skyMat.uniforms.sunPosition.value.copy(this.sun);
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

