import * as THREE from 'three';

/**
 * Weather Types supported by the dynamic weather system.
 */
export const WeatherType = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  FOGGY: 'foggy',
  RAINY: 'rainy',
  STORMY: 'stormy'
};

/**
 * Visual & atmospheric configurations for each weather state.
 */
export const WEATHER_CONFIGS = {
  clear: {
    name: 'Clear Skies',
    icon: '☀️',
    rainIntensity: 0.0,
    targetWetness: 0.0,
    fogDensityMultiplier: 1.0,
    lightIntensityMultiplier: 1.0,
    ambientMultiplier: 1.0,
    turbidity: 4.5,
    rayleigh: 1.8,
    cloudCover: 0.0,
    hasLightning: false,
    visibilityMultiplier: 1.0
  },
  cloudy: {
    name: 'Overcast',
    icon: '☁️',
    rainIntensity: 0.0,
    targetWetness: 0.05,
    fogDensityMultiplier: 1.35,
    lightIntensityMultiplier: 0.75,
    ambientMultiplier: 0.9,
    turbidity: 8.5,
    rayleigh: 2.6,
    cloudCover: 0.65,
    hasLightning: false,
    visibilityMultiplier: 0.9
  },
  foggy: {
    name: 'Dense Mist',
    icon: '🌫️',
    rainIntensity: 0.0,
    targetWetness: 0.2,
    fogDensityMultiplier: 2.6,
    lightIntensityMultiplier: 0.55,
    ambientMultiplier: 0.8,
    turbidity: 12.0,
    rayleigh: 3.8,
    cloudCover: 0.85,
    hasLightning: false,
    visibilityMultiplier: 0.75
  },
  rainy: {
    name: 'Rain',
    icon: '🌧️',
    rainIntensity: 0.7,
    targetWetness: 0.85,
    fogDensityMultiplier: 1.7,
    lightIntensityMultiplier: 0.62,
    ambientMultiplier: 0.82,
    turbidity: 10.0,
    rayleigh: 3.0,
    cloudCover: 0.8,
    hasLightning: false,
    visibilityMultiplier: 0.85
  },
  stormy: {
    name: 'Thunderstorm',
    icon: '⛈️',
    rainIntensity: 1.0,
    targetWetness: 1.0,
    fogDensityMultiplier: 2.1,
    lightIntensityMultiplier: 0.42,
    ambientMultiplier: 0.68,
    turbidity: 14.0,
    rayleigh: 4.2,
    cloudCover: 0.95,
    hasLightning: true,
    visibilityMultiplier: 0.8
  }
};

/**
 * WeatherManager
 * Controls real-time Day/Night progression, celestial sun/moon positioning,
 * dynamic weather state interpolation, rain particles, wetness shaders, and thunder/lightning.
 */
export class WeatherManager {
  constructor(environment, scene) {
    this.environment = environment;
    this.scene = scene;

    // Day / Night cycle settings
    this.timeOfDay = 14.0; // 0.0 to 24.0 (starts at 2:00 PM)
    this.dayDuration = 480.0; // 480 seconds (8 real-world minutes for a full day)
    this.isCycleActive = true;

    // Weather state
    this.currentWeather = WeatherType.CLEAR;
    this.targetWeather = WeatherType.CLEAR;
    this.weatherTransitionProgress = 1.0;
    this.transitionDuration = 5.0; // 5 seconds smooth fade

    // Real-time atmospheric values (lerped)
    this.rainIntensity = 0.0;
    this.currentWetness = 0.0;
    this.fogDensityMultiplier = 1.0;
    this.lightIntensityMultiplier = 1.0;
    this.ambientMultiplier = 1.0;
    this.cloudCover = 0.0;

    // Baseline values from environment
    this.baseSunColor = new THREE.Color(0xfff3d6);
    this.baseDirIntensity = 1.45;
    this.baseAmbientIntensity = 0.35;
    this.baseFogDensity = 0.0085;

    // Rain Particle System
    this.rainMesh = null;
    this.rainPositions = null;
    this.rainSpeeds = null;
    this.particleCount = 2000;
    this.graphicsQuality = 'high';
    this.rainBounds = { x: 50, y: 24, z: 50 };

    // Wet surface materials registry
    this.registeredMaterials = new Set();

    // Lightning & Thunder state
    this.nextLightningTimer = 8.0;
    this.lightningFlashTimer = 0.0;
    this.isFlashing = false;
    this.thunderDelayTimer = 0.0;

    // Managers
    this.audioManager = null;
    this.uiManager = null;

    this.initRainParticles();
  }

  setManagers({ audioManager, uiManager }) {
    if (audioManager) this.audioManager = audioManager;
    if (uiManager) this.uiManager = uiManager;
  }

  setGraphicsQuality(preset = 'high') {
    this.graphicsQuality = preset;
    const countMap = { high: 2500, med: 1200, medium: 1200, low: 400 };
    const targetCount = countMap[preset] || 2000;
    if (targetCount !== this.particleCount) {
      this.particleCount = targetCount;
      this.initRainParticles();
    }
  }

  /**
   * Initializes the GPU particle point cloud for rain drops
   */
  initRainParticles() {
    if (this.rainMesh) {
      this.scene.remove(this.rainMesh);
      if (this.rainMesh.geometry) this.rainMesh.geometry.dispose();
      if (this.rainMesh.material) this.rainMesh.material.dispose();
      this.rainMesh = null;
    }

    const count = this.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.rainBounds.x;
      positions[i * 3 + 1] = Math.random() * this.rainBounds.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.rainBounds.z;
      speeds[i] = 24.0 + Math.random() * 14.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainPositions = positions;
    this.rainSpeeds = speeds;

    // Procedural rain drop sprite texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(8, 0, 8, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.3, 'rgba(186, 230, 253, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

    ctx.fillStyle = grad;
    ctx.fillRect(6, 0, 4, 64);

    const rainTex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.75,
      map: rainTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.rainMesh = new THREE.Points(geometry, material);
    this.rainMesh.visible = false;
    this.scene.add(this.rainMesh);
  }

  /**
   * Registers materials for dynamic wetness & roughness modulation
   */
  registerMaterial(material) {
    if (!material || !material.isMeshStandardMaterial) return;
    if (!this.registeredMaterials.has(material)) {
      if (material.userData.baseRoughness === undefined) {
        material.userData.baseRoughness = material.roughness;
      }
      if (material.userData.baseMetalness === undefined) {
        material.userData.baseMetalness = material.metalness;
      }
      this.registeredMaterials.add(material);
    }
  }

  /**
   * Sets weather state (smooth transition or immediate)
   */
  setWeather(weatherType, instant = false) {
    if (!WEATHER_CONFIGS[weatherType]) return;

    if (instant) {
      this.currentWeather = weatherType;
      this.targetWeather = weatherType;
      this.weatherTransitionProgress = 1.0;
      this.applyConfigImmediate(WEATHER_CONFIGS[weatherType]);
    } else {
      this.targetWeather = weatherType;
      this.weatherTransitionProgress = 0.0;
    }

    if (this.uiManager && typeof this.uiManager.updateWeatherHUD === 'function') {
      this.uiManager.updateWeatherHUD(WEATHER_CONFIGS[this.targetWeather]);
    }
  }

  applyConfigImmediate(cfg) {
    this.rainIntensity = cfg.rainIntensity;
    this.fogDensityMultiplier = cfg.fogDensityMultiplier;
    this.lightIntensityMultiplier = cfg.lightIntensityMultiplier;
    this.ambientMultiplier = cfg.ambientMultiplier;
    this.cloudCover = cfg.cloudCover;
  }

  /**
   * Sets time of day directly (0.0 - 24.0 hours)
   */
  setTimeOfDay(hours, isCycleActive = this.isCycleActive) {
    this.timeOfDay = ((hours % 24) + 24) % 24;
    this.isCycleActive = isCycleActive;
  }

  getTimeOfDay() {
    return this.timeOfDay;
  }

  getTimeString() {
    const totalMinutes = Math.floor(this.timeOfDay * 60);
    const h24 = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mStr} ${period}`;
  }

  getTimePhase() {
    if (this.timeOfDay >= 5.0 && this.timeOfDay < 7.5) return 'DAWN';
    if (this.timeOfDay >= 7.5 && this.timeOfDay < 17.5) return 'DAY';
    if (this.timeOfDay >= 17.5 && this.timeOfDay < 20.0) return 'DUSK';
    return 'NIGHT';
  }

  getVisibilityMultiplier() {
    const cfg = WEATHER_CONFIGS[this.currentWeather] || WEATHER_CONFIGS.clear;
    let mult = cfg.visibilityMultiplier;
    // Further subtle reduction at dead of night
    if (this.getTimePhase() === 'NIGHT') {
      mult *= 0.9;
    }
    return mult;
  }

  update(deltaTime, playerPosition = null, currentLevelIndex = 0) {
    // 1. Advance Day / Night Cycle
    if (this.isCycleActive) {
      const hoursPerSecond = 24.0 / this.dayDuration;
      this.timeOfDay = (this.timeOfDay + hoursPerSecond * deltaTime) % 24.0;
    }

    // 2. Interpolate Weather Transition
    if (this.weatherTransitionProgress < 1.0) {
      this.weatherTransitionProgress = Math.min(1.0, this.weatherTransitionProgress + deltaTime / this.transitionDuration);
      const fromCfg = WEATHER_CONFIGS[this.currentWeather];
      const toCfg = WEATHER_CONFIGS[this.targetWeather];
      const t = this.weatherTransitionProgress;

      this.rainIntensity = THREE.MathUtils.lerp(fromCfg.rainIntensity, toCfg.rainIntensity, t);
      this.fogDensityMultiplier = THREE.MathUtils.lerp(fromCfg.fogDensityMultiplier, toCfg.fogDensityMultiplier, t);
      this.lightIntensityMultiplier = THREE.MathUtils.lerp(fromCfg.lightIntensityMultiplier, toCfg.lightIntensityMultiplier, t);
      this.ambientMultiplier = THREE.MathUtils.lerp(fromCfg.ambientMultiplier, toCfg.ambientMultiplier, t);
      this.cloudCover = THREE.MathUtils.lerp(fromCfg.cloudCover, toCfg.cloudCover, t);

      if (this.weatherTransitionProgress >= 1.0) {
        this.currentWeather = this.targetWeather;
      }
    }

    // 3. Wetness Accumulation & Evaporation
    const targetWetness = WEATHER_CONFIGS[this.currentWeather].targetWetness;
    if (this.currentWetness < targetWetness) {
      this.currentWetness = Math.min(targetWetness, this.currentWetness + deltaTime * 0.12);
    } else if (this.currentWetness > targetWetness) {
      this.currentWetness = Math.max(targetWetness, this.currentWetness - deltaTime * 0.035);
    }

    // 4. Update Wet Materials
    this.updateWetMaterials();

    const isSubterranean = (currentLevelIndex === 4); // Stage 4: Whispering Cavern

    // 5. Lightning & Thunder System (Computed before celestial lighting so flash surge takes effect immediately)
    if (!isSubterranean && WEATHER_CONFIGS[this.currentWeather].hasLightning) {
      this.updateLightning(deltaTime);
    } else {
      this.isFlashing = false;
    }

    // 6. Update Celestial Lighting & Sky (Outdoor regions only)
    if (!isSubterranean) {
      this.updateCelestialLighting();
    }

    // 7. Rain Particle System Update
    this.updateRainParticles(deltaTime, playerPosition, isSubterranean);

    // 8. Update Audio Ambience (Rain sound)
    if (this.audioManager) {
      if (!isSubterranean && this.rainIntensity > 0.05) {
        if (typeof this.audioManager.updateRainAmbience === 'function') {
          this.audioManager.updateRainAmbience(this.rainIntensity);
        }
      } else if (typeof this.audioManager.stopRainAmbience === 'function') {
        this.audioManager.stopRainAmbience();
      }
    }

    // 9. Update UI HUD Badge
    if (this.uiManager && typeof this.uiManager.updateWeatherHUD === 'function') {
      this.uiManager.updateWeatherHUD(
        WEATHER_CONFIGS[this.currentWeather],
        this.getTimeString(),
        this.getTimePhase()
      );
    }
  }

  /**
   * Updates sun elevation, azimuth, color, and sky parameters
   */
  updateCelestialLighting() {
    const env = this.environment;
    if (!env || !env.dirLight) return;

    const t = this.timeOfDay;
    const isDay = (t >= 5.5 && t <= 18.5);

    // Celestial angle
    let elevation = 0;
    let azimuth = 0;
    let lightColor = new THREE.Color();
    let intensity = 1.0;

    if (isDay) {
      // Daytime: Sun trajectory from East (6:00, 90°) to South (12:00, 180°) to West (18:00, 270°)
      const dayFactor = (t - 5.5) / 13.0; // 0.0 to 1.0
      elevation = Math.sin(dayFactor * Math.PI) * 62.0 + 3.0;
      azimuth = 80.0 + dayFactor * 190.0;

      // Color temperature
      if (t < 7.5) {
        // Sunrise: golden amber rose
        const dawnT = (t - 5.5) / 2.0;
        lightColor.setHex(0xfb923c).lerp(new THREE.Color(0xfff3d6), dawnT);
        intensity = THREE.MathUtils.lerp(0.85, 1.45, dawnT);
      } else if (t > 16.5) {
        // Sunset: fiery golden orange
        const duskT = (t - 16.5) / 2.0;
        lightColor.setHex(0xfff3d6).lerp(new THREE.Color(0xf97316), duskT);
        intensity = THREE.MathUtils.lerp(1.45, 0.75, duskT);
      } else {
        // Midday sun
        lightColor.setHex(0xfffbeb);
        intensity = 1.45;
      }
    } else {
      // Nighttime: Silvery Moon
      const nightProgress = t > 18.5 ? (t - 18.5) / 11.0 : (t + 5.5) / 11.0;
      elevation = Math.sin(nightProgress * Math.PI) * 45.0 + 5.0;
      azimuth = 270.0 + nightProgress * 180.0;
      lightColor.setHex(0xc7d2fe); // Pale silvery moonlight
      intensity = 0.38;
    }

    // Apply Weather Modifiers
    intensity *= this.lightIntensityMultiplier;

    // Apply Lightning Burst if flashing
    if (this.isFlashing) {
      intensity += 3.2;
      lightColor.setHex(0xffffff);
    }

    // Set Sun/Moon vector in Three.js
    const phi = THREE.MathUtils.degToRad(90 - Math.max(1, elevation));
    const theta = THREE.MathUtils.degToRad(azimuth);
    env.sun.setFromSphericalCoords(1, phi, theta);

    if (env.sky && env.sky.material) {
      const u = env.sky.material.uniforms;
      u['sunPosition'].value.copy(env.sun);
      const cfg = WEATHER_CONFIGS[this.currentWeather];
      u['turbidity'].value = cfg.turbidity;
      u['rayleigh'].value = isDay ? cfg.rayleigh : 0.4;
      u['mieCoefficient'].value = isDay ? 0.005 + this.cloudCover * 0.015 : 0.008;
    }

    env.dirLight.position.copy(env.sun).multiplyScalar(95);
    env.dirLight.color.copy(lightColor);
    env.dirLight.intensity = intensity;

    // Ambient and Hemisphere
    if (env.ambientLight) {
      const ambColor = isDay ? new THREE.Color(0x334155) : new THREE.Color(0x0f172a);
      if (this.isFlashing) ambColor.setHex(0x94a3b8);
      env.ambientLight.color.copy(ambColor);
      env.ambientLight.intensity = (isDay ? this.baseAmbientIntensity : 0.2) * this.ambientMultiplier * (this.isFlashing ? 2.5 : 1.0);
    }

    if (env.hemiLight) {
      env.hemiLight.intensity = (isDay ? 0.5 : 0.25) * this.ambientMultiplier;
    }

    // Dynamic Fog modulation
    if (env.scene.fog) {
      const baseStageFog = (env.currentLevelIndex === 2 ? 0.007 : 0.0085);
      env.scene.fog.density = baseStageFog * this.fogDensityMultiplier;
    }
  }

  /**
   * Updates wet surfaces roughness and reflectivity
   */
  updateWetMaterials() {
    if (this.registeredMaterials.size === 0) return;
    const wet = this.currentWetness;

    this.registeredMaterials.forEach(mat => {
      const baseR = mat.userData.baseRoughness !== undefined ? mat.userData.baseRoughness : 0.85;
      const baseM = mat.userData.baseMetalness !== undefined ? mat.userData.baseMetalness : 0.1;
      mat.roughness = Math.max(0.18, baseR * (1.0 - wet * 0.45));
      mat.metalness = Math.min(0.85, baseM + wet * 0.15);
    });
  }

  /**
   * Updates rain particle positions around the player
   */
  updateRainParticles(deltaTime, playerPosition, isSubterranean) {
    if (!this.rainMesh) return;

    if (isSubterranean || this.rainIntensity <= 0.05) {
      this.rainMesh.visible = false;
      return;
    }

    this.rainMesh.visible = true;
    const pos = this.rainPositions;
    const speeds = this.rainSpeeds;
    const count = this.particleCount;

    const px = playerPosition ? playerPosition.x : 0;
    const py = playerPosition ? playerPosition.y : 0;
    const pz = playerPosition ? playerPosition.z : 0;

    const halfW = this.rainBounds.x * 0.5;
    const halfD = this.rainBounds.z * 0.5;
    const windX = (this.currentWeather === WeatherType.STORMY ? -10.0 : -2.5);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx + 1] -= speeds[i] * deltaTime * (0.6 + this.rainIntensity * 0.6);
      pos[idx] += windX * deltaTime;

      // Wrap vertically or horizontally relative to player
      if (pos[idx + 1] < py - 1.5 ||
          Math.abs(pos[idx] - px) > halfW ||
          Math.abs(pos[idx + 2] - pz) > halfD) {
        pos[idx] = px + (Math.random() - 0.5) * this.rainBounds.x;
        pos[idx + 1] = py + 12.0 + Math.random() * 10.0;
        pos[idx + 2] = pz + (Math.random() - 0.5) * this.rainBounds.z;
      }
    }

    this.rainMesh.geometry.attributes.position.needsUpdate = true;
    this.rainMesh.material.opacity = Math.min(0.85, this.rainIntensity * 0.75);
  }

  /**
   * Lightning flashes and thunder rumbling during storms
   */
  updateLightning(deltaTime) {
    this.nextLightningTimer -= deltaTime;

    // Trigger new lightning strike
    if (this.nextLightningTimer <= 0) {
      this.nextLightningTimer = 6.0 + Math.random() * 8.0;
      this.isFlashing = true;
      this.lightningFlashTimer = 0.18; // 180ms flash duration
      this.thunderDelayTimer = 0.4 + Math.random() * 0.6; // Acoustic thunder delay

      // Screen flash DOM effect
      const overlay = document.getElementById('lightning-flash-overlay');
      if (overlay) {
        overlay.classList.add('flash');
        setTimeout(() => overlay.classList.remove('flash'), 180);
      }
    }

    if (this.lightningFlashTimer > 0) {
      this.lightningFlashTimer -= deltaTime;
      if (this.lightningFlashTimer <= 0) {
        this.isFlashing = false;
      }
    }

    if (this.thunderDelayTimer > 0) {
      this.thunderDelayTimer -= deltaTime;
      if (this.thunderDelayTimer <= 0) {
        if (this.audioManager && typeof this.audioManager.playThunder === 'function') {
          this.audioManager.playThunder();
        }
      }
    }
  }

  dispose() {
    if (this.rainMesh) {
      this.scene.remove(this.rainMesh);
      if (this.rainMesh.geometry) this.rainMesh.geometry.dispose();
      if (this.rainMesh.material) this.rainMesh.material.dispose();
      this.rainMesh = null;
    }
    this.registeredMaterials.clear();
  }
}
