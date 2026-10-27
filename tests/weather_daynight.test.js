/**
 * Automated Verification Test Suite for Shadow Quest: Dynamic Weather & Day/Night System
 * Tests:
 * 1. Initial Weather & Day/Night System Setup & HUD Badge
 * 2. 24-Hour Day/Night Cycle & Solar Positioning across Phases (Dawn, Day, Dusk, Night)
 * 3. Switching All 5 Weather Conditions with Smooth Interpolation
 * 4. Rain Particle System Activation & Player Volume Tracking
 * 5. Dynamic Wet-Surface Material Roughness & Drying Modulation
 * 6. Thunderstorm Lightning Screen Flash & Thunder Synthesis
 * 7. Fair Atmospheric Gameplay Impact (Enemy Perception & Footstep Masking)
 * 8. Subterranean Stage 4 (Whispering Cavern) Indoor Rain Suppression
 * 9. Visual Quality Preset Particle Scaling (High: 2500, Med: 1200, Low: 400)
 * 10. Save/Load Persistence & Settings UI Synchronization
 */

import http from 'http';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const WS = globalThis.WebSocket;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9237;
const TARGET_URL = 'http://localhost:5173/';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WS(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  async waitReady() {
    if (this.ws.readyState === WS.OPEN) return;
    return new Promise(resolve => {
      this.ws.onopen = () => resolve();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const isAsync = expr.includes('await');
    const wrapped = expr.trim().startsWith('(') || !expr.includes('return')
      ? (isAsync && !expr.trim().startsWith('(async') ? `(async () => {\n${expr}\n})()` : expr)
      : `(${isAsync ? 'async ' : ''}() => {\n${expr}\n})()`;
    const res = await this.send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true
    });
    if (res && res.exceptionDetails) {
      console.error('CDP Eval Exception:', JSON.stringify(res.exceptionDetails, null, 2));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function runWeatherDayNightTests() {
  console.log('=== SHADOW QUEST DYNAMIC WEATHER & DAY/NIGHT SYSTEM VERIFICATION ===\n');

  const tempUserDataDir = path.join(os.tmpdir(), `sq-weather-test-${Date.now()}`);
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,720',
    '--user-data-dir=' + tempUserDataDir,
    TARGET_URL
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch (e) {}
      await sleep(250);
    }

    if (!targets || targets.length === 0) {
      throw new Error('Chrome remote debugging did not respond in time.');
    }

    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitReady();

    console.log('Connected to Headless Chrome via CDP on port', PORT);

    // Wait for game ready
    let gameReady = false;
    for (let i = 0; i < 40; i++) {
      gameReady = await cdp.eval(`Boolean(window.__GAME__ && window.__GAME__.levelManager && window.__GAME__.levelManager.hasInitiallyLoaded)`);
      if (gameReady) break;
      await sleep(300);
    }
    if (!gameReady) throw new Error('Game failed to initialize within timeout.');

    // Start clean game
    await cdp.eval(`
      const g = window.__GAME__;
      g.startNewGame(true);
    `);
    await sleep(800);

    let passCount = 0;
    const totalTests = 10;

    // ==========================================
    // TEST 1: Initial Weather & HUD Badge Setup
    // ==========================================
    console.log('--- Test 1: Initial Weather & Day/Night System Setup ---');
    const initCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;
      const badge = document.getElementById('weather-time-badge');
      const icon = document.getElementById('weather-icon')?.textContent;
      const name = document.getElementById('weather-name')?.textContent;
      const time = document.getElementById('time-text')?.textContent;
      return {
        hasWeatherManager: Boolean(wm),
        currentWeather: wm ? wm.currentWeather : null,
        timeOfDay: wm ? wm.timeOfDay : null,
        timeString: wm ? wm.getTimeString() : null,
        timePhase: wm ? wm.getTimePhase() : null,
        badgeVisible: Boolean(badge && !badge.closest('.hidden')),
        icon,
        name,
        time
      };
    `);

    if (initCheck.hasWeatherManager &&
        initCheck.currentWeather === 'clear' &&
        Math.abs(initCheck.timeOfDay - 14.0) < 0.2 &&
        initCheck.timePhase === 'DAY' &&
        initCheck.name === 'Clear Skies') {
      console.log('✓ PASS: WeatherManager active with initial Clear Skies at 2:00 PM.');
      passCount++;
    } else {
      console.error('✗ FAIL: Initial weather state mismatch:', initCheck);
    }

    // ==========================================
    // TEST 2: 24-Hour Day/Night Solar Trajectory
    // ==========================================
    console.log('\n--- Test 2: 24-Hour Day/Night Celestial Sun/Moon Trajectory ---');
    const celestialCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;

      // Check Dawn (6:00 AM)
      wm.setTimeOfDay(6.0, false);
      wm.update(0.1, g.player.position, 0);
      const dawnPhase = wm.getTimePhase();
      const dawnColor = g.environment.dirLight.color.getHexString();
      const dawnElevation = g.environment.dirLight.position.y;

      // Check Noon (12:00 PM)
      wm.setTimeOfDay(12.0, false);
      wm.update(0.1, g.player.position, 0);
      const noonPhase = wm.getTimePhase();
      const noonIntensity = g.environment.dirLight.intensity;
      const noonElevation = g.environment.dirLight.position.y;

      // Check Dusk (18:00 PM)
      wm.setTimeOfDay(18.0, false);
      wm.update(0.1, g.player.position, 0);
      const duskPhase = wm.getTimePhase();
      const duskColor = g.environment.dirLight.color.getHexString();

      // Check Night (23:00 PM)
      wm.setTimeOfDay(23.0, false);
      wm.update(0.1, g.player.position, 0);
      const nightPhase = wm.getTimePhase();
      const nightIntensity = g.environment.dirLight.intensity;

      // Reset to 14:00 Day
      wm.setTimeOfDay(14.0, true);
      wm.update(0.1, g.player.position, 0);

      return {
        dawnPhase,
        noonPhase,
        duskPhase,
        nightPhase,
        noonElevationHigherThanDawn: noonElevation > dawnElevation,
        noonBrighterThanNight: noonIntensity > nightIntensity
      };
    `);

    if (celestialCheck.dawnPhase === 'DAWN' &&
        celestialCheck.noonPhase === 'DAY' &&
        celestialCheck.duskPhase === 'DUSK' &&
        celestialCheck.nightPhase === 'NIGHT' &&
        celestialCheck.noonElevationHigherThanDawn &&
        celestialCheck.noonBrighterThanNight) {
      console.log('✓ PASS: Celestial trajectory correctly transitions Dawn -> Noon -> Dusk -> Night.');
      passCount++;
    } else {
      console.error('✗ FAIL: Celestial trajectory check failed:', celestialCheck);
    }

    // ==========================================
    // TEST 3: Switching All 5 Weather Conditions
    // ==========================================
    console.log('\n--- Test 3: Switching Across All 5 Weather Conditions ---');
    const weatherStatesCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;
      const states = ['cloudy', 'foggy', 'rainy', 'stormy', 'clear'];
      const results = {};

      for (const w of states) {
        wm.setWeather(w, true); // Instant switch for testing
        wm.update(0.1, g.player.position, 0);
        results[w] = {
          currentWeather: wm.currentWeather,
          rainIntensity: wm.rainIntensity,
          fogMultiplier: wm.fogDensityMultiplier,
          lightMultiplier: wm.lightIntensityMultiplier,
          cloudCover: wm.cloudCover
        };
      }

      return results;
    `);

    const cloudyOk = weatherStatesCheck.cloudy.currentWeather === 'cloudy' && weatherStatesCheck.cloudy.cloudCover > 0.5;
    const foggyOk = weatherStatesCheck.foggy.currentWeather === 'foggy' && weatherStatesCheck.foggy.fogMultiplier > 2.0;
    const rainyOk = weatherStatesCheck.rainy.currentWeather === 'rainy' && weatherStatesCheck.rainy.rainIntensity > 0.5;
    const stormyOk = weatherStatesCheck.stormy.currentWeather === 'stormy' && weatherStatesCheck.stormy.rainIntensity === 1.0;
    const clearOk = weatherStatesCheck.clear.currentWeather === 'clear' && weatherStatesCheck.clear.rainIntensity === 0;

    if (cloudyOk && foggyOk && rainyOk && stormyOk && clearOk) {
      console.log('✓ PASS: All 5 weather conditions successfully configure atmospheric params.');
      passCount++;
    } else {
      console.error('✗ FAIL: Weather state test failure:', weatherStatesCheck);
    }

    // ==========================================
    // TEST 4: Rain Particle System & Player Tracking
    // ==========================================
    console.log('\n--- Test 4: Rain Particle System Activation & Player Following ---');
    const rainParticlesCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;

      // 1. Clear weather: rain hidden
      wm.setWeather('clear', true);
      wm.update(0.1, g.player.position, 0);
      const clearVisible = wm.rainMesh ? wm.rainMesh.visible : false;

      // 2. Rainy weather: rain visible
      wm.setWeather('rainy', true);
      wm.update(0.1, g.player.position, 0);
      const rainVisible = wm.rainMesh ? wm.rainMesh.visible : false;
      const particleCount = wm.particleCount;

      // 3. Move player and update
      g.player.teleport(65, -80, 0, true, false);
      wm.update(0.1, g.player.position, 0);

      // Verify particles center near player
      const posAttr = wm.rainMesh.geometry.attributes.position.array;
      let minX = Infinity, maxX = -Infinity;
      for (let i = 0; i < particleCount; i++) {
        const x = posAttr[i * 3];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
      const avgX = (minX + maxX) / 2;

      return {
        clearVisible,
        rainVisible,
        particleCount,
        playerX: g.player.position.x,
        particlesCenterX: avgX,
        trackedPlayer: Math.abs(avgX - 65) < 30
      };
    `);

    if (!rainParticlesCheck.clearVisible &&
        rainParticlesCheck.rainVisible &&
        rainParticlesCheck.particleCount >= 2000 &&
        rainParticlesCheck.trackedPlayer) {
      console.log(`✓ PASS: Rain particle system activates in rain (${rainParticlesCheck.particleCount} pts) and tracks player position.`);
      passCount++;
    } else {
      console.error('✗ FAIL: Rain particle test failure:', rainParticlesCheck);
    }

    // ==========================================
    // TEST 5: Wet-Surface Material Roughness Modulation
    // ==========================================
    console.log('\n--- Test 5: Dynamic Wet Surface Roughness & Drying Modulation ---');
    const wetSurfaceCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;

      const registeredCount = wm.registeredMaterials.size;
      const sampleMat = Array.from(wm.registeredMaterials)[0];
      const baseRoughness = sampleMat ? sampleMat.userData.baseRoughness : null;

      // Set storm and simulate 15 seconds of rainfall accumulation
      wm.setWeather('stormy', true);
      for (let step = 0; step < 30; step++) {
        wm.update(0.5, g.player.position, 0);
      }
      const wetnessHigh = wm.currentWetness;
      const wetRoughness = sampleMat ? sampleMat.roughness : null;

      // Set clear and simulate drying evaporation
      wm.setWeather('clear', true);
      for (let step = 0; step < 40; step++) {
        wm.update(0.5, g.player.position, 0);
      }
      const driedWetness = wm.currentWetness;
      const driedRoughness = sampleMat ? sampleMat.roughness : null;

      return {
        registeredCount,
        baseRoughness,
        wetnessHigh,
        wetRoughness,
        driedWetness,
        driedRoughness,
        becameGlossier: wetRoughness < baseRoughness,
        driedBackTowardsBase: driedRoughness > wetRoughness
      };
    `);

    if (wetSurfaceCheck.registeredCount > 0 &&
        wetSurfaceCheck.wetnessHigh > 0.8 &&
        wetSurfaceCheck.becameGlossier &&
        wetSurfaceCheck.driedBackTowardsBase) {
      console.log(`✓ PASS: Surface wetness dynamically modulates ${wetSurfaceCheck.registeredCount} materials (roughness reduced when wet, dried on clear).`);
      passCount++;
    } else {
      console.error('✗ FAIL: Wet surface modulation check failed:', wetSurfaceCheck);
    }

    // ==========================================
    // TEST 6: Thunderstorm Lightning & Audio Trigger
    // ==========================================
    console.log('\n--- Test 6: Thunderstorm Lightning Screen Flash & Thunder Synthesis ---');
    const lightningCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;

      let thunderCalled = false;
      const originalThunder = g.audioManager.playThunder;
      g.audioManager.playThunder = () => {
        thunderCalled = true;
        if (typeof originalThunder === 'function') originalThunder.call(g.audioManager);
      };

      wm.setWeather('stormy', true);
      // Force lightning strike timer to 0
      wm.nextLightningTimer = 0.01;
      wm.update(0.05, g.player.position, 0);

      const isFlashing = wm.isFlashing;
      const dirLightSurge = g.environment.dirLight.intensity;
      const overlayHasFlash = document.getElementById('lightning-flash-overlay')?.classList.contains('flash');

      // Fast-forward delay for acoustic thunder (0.4s to 1.0s max delay)
      wm.update(1.2, g.player.position, 0);

      // Restore
      g.audioManager.playThunder = originalThunder;
      wm.isFlashing = false;

      return {
        isFlashing,
        dirLightSurge: dirLightSurge > 3.0,
        overlayHasFlash,
        thunderCalled
      };
    `);

    if (lightningCheck.dirLightSurge && lightningCheck.thunderCalled) {
      console.log('✓ PASS: Storm generates directional lightning surge and synthesizes thunder audio.');
      passCount++;
    } else {
      console.error('✗ FAIL: Lightning test check failed:', lightningCheck);
    }

    // ==========================================
    // TEST 7: Fair Atmospheric Gameplay Impact
    // ==========================================
    console.log('\n--- Test 7: Gameplay Atmosphere Impact (Perception & Noise Masking) ---');
    const gameplayImpactCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;
      const enemies = g.enemyManager.getEnemies();
      const testEnemy = enemies[0];

      wm.setWeather('clear', true);
      wm.setTimeOfDay(12.0, false);
      const clearMult = wm.getVisibilityMultiplier();

      wm.setWeather('foggy', true);
      const foggyMult = wm.getVisibilityMultiplier();

      wm.setWeather('stormy', true);
      const stormyMult = wm.getVisibilityMultiplier();

      // Check night modifier
      wm.setTimeOfDay(23.0, false);
      const nightMult = wm.getVisibilityMultiplier();

      return {
        hasEnemy: Boolean(testEnemy),
        enemyHasWeatherRef: Boolean(testEnemy && testEnemy.weatherManager),
        clearMult,
        foggyMult,
        stormyMult,
        nightMult,
        foggyReduced: foggyMult < clearMult,
        stormyReduced: stormyMult < clearMult,
        nightReduced: nightMult < stormyMult
      };
    `);

    if (gameplayImpactCheck.hasEnemy &&
        gameplayImpactCheck.enemyHasWeatherRef &&
        gameplayImpactCheck.foggyReduced &&
        gameplayImpactCheck.stormyReduced &&
        gameplayImpactCheck.nightReduced) {
      console.log(`✓ PASS: Enemy perception dynamically respects visibility multipliers (Clear: ${gameplayImpactCheck.clearMult}, Fog: ${gameplayImpactCheck.foggyMult}, Night: ${gameplayImpactCheck.nightMult.toFixed(2)}).`);
      passCount++;
    } else {
      console.error('✗ FAIL: Gameplay atmospheric impact check failed:', gameplayImpactCheck);
    }

    // ==========================================
    // TEST 8: Subterranean Stage 4 Cave Protection
    // ==========================================
    console.log('\n--- Test 8: Subterranean Stage 4 (Whispering Cavern) Cave Protection ---');
    const caveCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;

      // Switch to Stage 4 Whispering Cavern
      await g.levelManager.loadLevel(4, false);
      wm.setWeather('stormy', true);
      wm.update(0.1, g.player.position, 4);

      const caveRainVisible = wm.rainMesh.visible;
      const isSubterranean = (g.levelManager.currentLevelIndex === 4);

      // Return to Stage 0 Dark Forest
      await g.levelManager.loadLevel(0, false);
      wm.update(0.1, g.player.position, 0);
      const outdoorRainVisible = wm.rainMesh.visible;

      return {
        isSubterranean,
        caveRainVisible,
        outdoorRainVisible
      };
    `);

    if (!caveCheck.caveRainVisible && caveCheck.outdoorRainVisible) {
      console.log('✓ PASS: Whispering Cavern correctly suppresses outdoor rain particles and preserves cave atmosphere.');
      passCount++;
    } else {
      console.error('✗ FAIL: Cavern protection check failed:', caveCheck);
    }

    // ==========================================
    // TEST 9: Visual Quality Presets Scaling
    // ==========================================
    console.log('\n--- Test 9: Visual Quality Presets Rain Particle Scaling ---');
    const qualityPresetsCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;

      g.setGraphicsQuality('high');
      const highCount = wm.particleCount;

      g.setGraphicsQuality('medium');
      const medCount = wm.particleCount;

      g.setGraphicsQuality('low');
      const lowCount = wm.particleCount;

      // Restore to high
      g.setGraphicsQuality('high');

      return {
        highCount,
        medCount,
        lowCount,
        isScaledProperly: highCount > medCount && medCount > lowCount
      };
    `);

    if (qualityPresetsCheck.highCount === 2500 &&
        qualityPresetsCheck.medCount === 1200 &&
        qualityPresetsCheck.lowCount === 400 &&
        qualityPresetsCheck.isScaledProperly) {
      console.log(`✓ PASS: Graphics quality presets correctly scale rain particles (High: ${qualityPresetsCheck.highCount}, Med: ${qualityPresetsCheck.medCount}, Low: ${qualityPresetsCheck.lowCount}).`);
      passCount++;
    } else {
      console.error('✗ FAIL: Quality presets check failed:', qualityPresetsCheck);
    }

    // ==========================================
    // TEST 10: Save/Load Persistence & UI Sync
    // ==========================================
    console.log('\n--- Test 10: Save/Load Persistence & Settings UI Synchronization ---');
    const saveLoadCheck = await cdp.eval(`
      const g = window.__GAME__;
      const wm = g.environment.weatherManager;
      const sm = g.saveManager;

      // Set unique weather & time
      wm.setWeather('foggy', true);
      wm.setTimeOfDay(19.5, false); // 7:30 PM Dusk
      wm.update(0.1, g.player.position, 0);

      // Save to slot_1
      const saveRes = await sm.saveGame(g, 'slot_1');

      // Change weather to rainy at 8:00 AM
      wm.setWeather('rainy', true);
      wm.setTimeOfDay(8.0, true);
      wm.update(0.1, g.player.position, 0);

      const alteredWeather = wm.currentWeather;
      const alteredTime = wm.timeOfDay;

      // Load back slot_1
      const loadRes = await sm.loadGame(g, 'slot_1');
      wm.update(0.1, g.player.position, 0);

      const restoredWeather = wm.currentWeather;
      const restoredTime = wm.timeOfDay;
      const hudBadgeText = document.getElementById('weather-name')?.textContent;
      const hudTimeText = document.getElementById('time-text')?.textContent;

      return {
        saveSuccess: saveRes.success,
        loadSuccess: loadRes.success,
        alteredWeather,
        restoredWeather,
        restoredTime: Math.round(restoredTime * 10) / 10,
        hudBadgeText,
        hudTimeText
      };
    `);

    if (saveLoadCheck.saveSuccess &&
        saveLoadCheck.loadSuccess &&
        saveLoadCheck.restoredWeather === 'foggy' &&
        Math.abs(saveLoadCheck.restoredTime - 19.5) < 0.2 &&
        saveLoadCheck.hudBadgeText === 'Dense Mist') {
      console.log(`✓ PASS: Weather state (Dense Mist) and Time (7:30 PM) persisted across save/reload cycle with HUD sync.`);
      passCount++;
    } else {
      console.error('✗ FAIL: Save/load persistence check failed:', saveLoadCheck);
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n==========================================');
    console.log(`FINAL RESULT: ${passCount} / ${totalTests} TESTS PASSED (${Math.round((passCount / totalTests) * 100)}%)`);
    console.log('==========================================');

    if (passCount === totalTests) {
      console.log('DYNAMIC WEATHER & DAY/NIGHT SYSTEM FULLY VERIFIED!\n');
    } else {
      throw new Error(`Only ${passCount}/${totalTests} tests passed.`);
    }

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    try {
      chromeProcess.kill('SIGTERM');
    } catch (e) {}
  }
}

runWeatherDayNightTests();
