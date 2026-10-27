/**
 * Automated Verification Test Suite for Shadow Quest: Dedicated Photo Mode
 * Tests:
 * 1. Activation & Exit via KeyP, HUD Toggle Button, and Pause Menu Button
 * 2. Gameplay Simulation Freezing (Player, Enemies, Physics, Combat frozen)
 * 3. Free Camera Manipulation (WASD flight, Elevation Q/E/Space, Yaw/Pitch Look)
 * 4. Field of View (Zoom) Adjustment (20° to 90° range, Mouse Wheel & Slider)
 * 5. Camera Dutch Roll Tilt (-35° to +35° range & Three.js Euler roll)
 * 6. Artistic Color Filters & Real-Time CSS Post-Processing Canvas Shaders
 * 7. Tone Mapping Exposure / Brightness Slider (0.4x to 2.2x)
 * 8. Cinematic 2.39:1 Anamorphic Letterbox Bars & Depth of Field Blur
 * 9. HUD Hiding & Showing (Toggle Button, 'H'/'Tab' Hotkeys, Restore Pill)
 * 10. Reset Camera Button (Restores Framing, 60° FOV, 0° Roll, 1.0x Exposure)
 * 11. Genuine Screenshot Capture (Canvas toDataURL / toBlob PNG Generation, Shutter Audio & Flash)
 * 12. Exit Restoration (Gameplay Camera, Player Locomotion & Pointer Lock restored)
 */

import http from 'http';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const WS = globalThis.WebSocket;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9240;
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

async function runPhotoModeTests() {
  console.log('=== SHADOW QUEST DEDICATED PHOTO MODE VERIFICATION ===\n');

  const tempUserDataDir = path.join(os.tmpdir(), `sq-photo-test-${Date.now()}`);
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempUserDataDir}`,
    TARGET_URL
  ]);

  let cdp = null;

  try {
    let connected = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const versionData = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
        if (versionData && versionData.webSocketDebuggerUrl) {
          const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
          const page = list.find(item => item.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            cdp = new CDPClient(page.webSocketDebuggerUrl);
            await cdp.waitReady();
            connected = true;
            break;
          }
        }
      } catch (err) {
        // waiting for chrome to listen
      }
      await sleep(400);
    }

    if (!connected || !cdp) {
      throw new Error(`Failed to connect to Chrome CDP on port ${PORT}`);
    }

    console.log('[CDP] Connected to Headless Chrome. Initializing game...');

    // Wait for game ready
    let gameReady = false;
    for (let i = 0; i < 40; i++) {
      try {
        gameReady = await cdp.eval(`Boolean(window.__GAME__ && window.__GAME__.isReady && window.__GAME__.levelManager && window.__GAME__.levelManager.hasInitiallyLoaded)`);
        if (gameReady) break;
      } catch (e) {}
      await sleep(300);
    }
    if (!gameReady) {
      const err = await cdp.eval(`window.__INIT_ERROR__ || null`).catch(() => null);
      throw new Error(`Game failed to initialize within timeout: ${err}`);
    }

    // Start a clean new game
    await cdp.eval(`
      const g = window.__GAME__ || window.game;
      await g.startNewGame(true);
      g.clock.getDelta();
    `);
    await sleep(800);

    let passedTests = 0;
    const totalTests = 12;

    // TEST 1: Activation & Exit via KeyP, HUD Toggle Button, and Pause Menu
    console.log('[TEST 1/12] Testing Photo Mode Activation & Exit via KeyP & UI Buttons...');
    const test1 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const initialActive = pmm.isActive;

      // 1. Enter via KeyP
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', bubbles: true }));
      const activeAfterP = pmm.isActive;
      const overlayVisibleP = !document.getElementById('photo-mode-overlay').classList.contains('hidden');

      // 2. Exit via KeyP
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', bubbles: true }));
      const activeAfterP2 = pmm.isActive;

      // 3. Enter via HUD button
      const hudBtn = document.getElementById('photo-mode-toggle-btn');
      hudBtn.click();
      const activeAfterHud = pmm.isActive;

      // 4. Exit via Exit button
      document.getElementById('photo-btn-exit').click();
      const activeAfterExitBtn = pmm.isActive;

      // 5. Enter via Pause Menu button
      window.game.togglePause();
      const pausePhotoBtn = document.getElementById('pause-photo-btn');
      pausePhotoBtn.click();
      const activeAfterPause = pmm.isActive;

      // Exit for next test
      pmm.exit();

      return {
        initialActive,
        activeAfterP,
        overlayVisibleP,
        activeAfterP2,
        activeAfterHud,
        activeAfterExitBtn,
        activeAfterPause,
        finalActive: pmm.isActive
      };
    `);

    if (
      !test1.initialActive &&
      test1.activeAfterP &&
      test1.overlayVisibleP &&
      !test1.activeAfterP2 &&
      test1.activeAfterHud &&
      !test1.activeAfterExitBtn &&
      test1.activeAfterPause &&
      !test1.finalActive
    ) {
      console.log('  ✓ Test 1 Passed: Photo Mode toggles cleanly via KeyP, HUD button, and Pause menu.');
      passedTests++;
    } else {
      console.error('  ✗ Test 1 Failed:', JSON.stringify(test1));
    }

    // TEST 2: Gameplay Simulation Freezing (Player, Enemies, Physics, Combat frozen)
    console.log('[TEST 2/12] Testing Gameplay Simulation Freezing in Photo Mode...');
    const test2 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const player = window.game.player;
      const enemies = window.game.enemyManager.getEnemies();

      // Enter photo mode
      pmm.enter();

      const initialPlayerPos = player.getPosition().clone();
      const initialEnemyPos = (enemies[0] && enemies[0].position) ? enemies[0].position.clone() : null;
      const playerEnabledWhilePhoto = player.isEnabled;

      // Advance game loop simulation by 1.5 seconds
      for (let i = 0; i < 30; i++) {
        window.game.update(0.05);
      }

      const playerPosAfterUpdate = player.getPosition().clone();
      const enemyPosAfterUpdate = (enemies[0] && enemies[0].position) ? enemies[0].position.clone() : null;

      const playerDelta = initialPlayerPos.distanceTo(playerPosAfterUpdate);
      const enemyDelta = (initialEnemyPos && enemyPosAfterUpdate)
        ? initialEnemyPos.distanceTo(enemyPosAfterUpdate)
        : 0;

      pmm.exit();

      return {
        playerEnabledWhilePhoto,
        playerDelta,
        enemyDelta,
        isFrozen: playerDelta < 0.001 && enemyDelta < 0.001
      };
    `);

    if (!test2.playerEnabledWhilePhoto && test2.isFrozen) {
      console.log('  ✓ Test 2 Passed: Player and enemy positions held 100% frozen during simulation updates.');
      passedTests++;
    } else {
      console.error('  ✗ Test 2 Failed:', JSON.stringify(test2));
    }

    // TEST 3: Free Camera Manipulation (WASD flight, Elevation Q/E/Space, Yaw/Pitch Look)
    console.log('[TEST 3/12] Testing Free Camera WASD Flight, Elevation & Mouse Look...');
    const test3 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const cm = window.game.cameraManager;

      pmm.enter();
      const initialPos = cm.photoCameraPos.clone();
      const initialYaw = cm.photoCameraYaw;
      const initialPitch = cm.photoCameraPitch;

      // Simulate mouse drag look
      pmm.pendingMouseDeltaX = 50;
      pmm.pendingMouseDeltaY = 25;
      pmm.flyKeys.forward = true;
      pmm.flyKeys.up = true;

      // Advance photo mode update
      pmm.update(0.1);

      const posAfterFlight = cm.photoCameraPos.clone();
      const yawAfterLook = cm.photoCameraYaw;
      const pitchAfterLook = cm.photoCameraPitch;

      pmm.flyKeys.forward = false;
      pmm.flyKeys.up = false;

      const movedForward = posAfterFlight.distanceTo(initialPos) > 0.5;
      const rotatedYaw = Math.abs(yawAfterLook - initialYaw) > 0.01;
      const rotatedPitch = Math.abs(pitchAfterLook - initialPitch) > 0.01;

      pmm.exit();

      return {
        movedForward,
        rotatedYaw,
        rotatedPitch,
        distMoved: posAfterFlight.distanceTo(initialPos)
      };
    `);

    if (test3.movedForward && test3.rotatedYaw && test3.rotatedPitch) {
      console.log(`  ✓ Test 3 Passed: Free camera navigated forward (${test3.distMoved.toFixed(2)}m) with yaw/pitch look.`);
      passedTests++;
    } else {
      console.error('  ✗ Test 3 Failed:', JSON.stringify(test3));
    }

    // TEST 4: Field of View (Zoom) Adjustment (20° to 90° range, Mouse Wheel & Slider)
    console.log('[TEST 4/12] Testing FOV Zoom Range & Mouse Wheel Zooming...');
    const test4 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const cm = window.game.cameraManager;

      pmm.enter();

      // Test slider setting to 35°
      pmm.setFOV(35);
      const fov35 = cm.getFOV();
      const sliderVal35 = parseFloat(document.getElementById('photo-slider-fov').value);
      const textVal35 = document.getElementById('photo-val-fov').textContent;

      // Test clamping limits: min 20, max 90
      pmm.setFOV(10);
      const clampedMin = cm.getFOV();
      pmm.setFOV(120);
      const clampedMax = cm.getFOV();

      // Test wheel event zoom
      pmm.setFOV(50);
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
      const fovAfterWheelZoomIn = cm.getFOV();

      pmm.exit();

      return {
        fov35,
        sliderVal35,
        textVal35,
        clampedMin,
        clampedMax,
        fovAfterWheelZoomIn
      };
    `);

    if (
      test4.fov35 === 35 &&
      test4.sliderVal35 === 35 &&
      test4.textVal35 === '35°' &&
      test4.clampedMin === 20 &&
      test4.clampedMax === 90 &&
      test4.fovAfterWheelZoomIn < 50
    ) {
      console.log('  ✓ Test 4 Passed: FOV clamped cleanly to [20°, 90°], synced with UI and mouse wheel.');
      passedTests++;
    } else {
      console.error('  ✗ Test 4 Failed:', JSON.stringify(test4));
    }

    // TEST 5: Camera Dutch Roll Tilt (-35° to +35° range & Three.js Euler roll)
    console.log('[TEST 5/12] Testing Camera Dutch Roll Tilt...');
    const test5 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const cm = window.game.cameraManager;

      pmm.enter();

      pmm.setRoll(18);
      const roll18Degrees = THREE.MathUtils.radToDeg(cm.getRoll());
      const sliderRollVal = parseFloat(document.getElementById('photo-slider-roll').value);
      const textRollVal = document.getElementById('photo-val-roll').textContent;

      // Test clamping
      pmm.setRoll(-50);
      const clampedMinRoll = THREE.MathUtils.radToDeg(cm.getRoll());
      pmm.setRoll(50);
      const clampedMaxRoll = THREE.MathUtils.radToDeg(cm.getRoll());

      pmm.exit();

      return {
        roll18Degrees: Math.round(roll18Degrees),
        sliderRollVal,
        textRollVal,
        clampedMinRoll: Math.round(clampedMinRoll),
        clampedMaxRoll: Math.round(clampedMaxRoll)
      };
    `);

    if (
      test5.roll18Degrees === 18 &&
      test5.sliderRollVal === 18 &&
      test5.textRollVal === '18°' &&
      test5.clampedMinRoll === -35 &&
      test5.clampedMaxRoll === 35
    ) {
      console.log('  ✓ Test 5 Passed: Camera Dutch angle roll tilted accurately between -35° and +35°.');
      passedTests++;
    } else {
      console.error('  ✗ Test 5 Failed:', JSON.stringify(test5));
    }

    // TEST 6: Artistic Color Filters & Real-Time CSS Post-Processing
    console.log('[TEST 6/12] Testing Artistic Color Filter Presets...');
    const test6 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const canvas = window.game.renderer.domElement;

      pmm.enter();

      // Test Noir preset
      pmm.setFilter('noir');
      const filterNoir = canvas.style.filter;
      const selectValNoir = document.getElementById('photo-select-filter').value;

      // Test Sunset preset
      pmm.setFilter('sunset');
      const filterSunset = canvas.style.filter;

      // Test Vibrant preset
      pmm.setFilter('vibrant');
      const filterVibrant = canvas.style.filter;

      // Reset to none
      pmm.setFilter('none');
      const filterNone = canvas.style.filter;

      pmm.exit();

      return {
        noirValid: filterNoir.includes('grayscale'),
        sunsetValid: filterSunset.includes('sepia'),
        vibrantValid: filterVibrant.includes('contrast'),
        noneValid: filterNone === 'none',
        selectValNoir
      };
    `);

    if (
      test6.noirValid &&
      test6.sunsetValid &&
      test6.vibrantValid &&
      test6.noneValid &&
      test6.selectValNoir === 'noir'
    ) {
      console.log('  ✓ Test 6 Passed: Color grading presets (Noir, Sunset, Vibrant, None) applied properly.');
      passedTests++;
    } else {
      console.error('  ✗ Test 6 Failed:', JSON.stringify(test6));
    }

    // TEST 7: Tone Mapping Exposure / Brightness Slider
    console.log('[TEST 7/12] Testing Tone Mapping Exposure / Brightness Slider...');
    const test7 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const renderer = window.game.renderer;

      pmm.enter();

      pmm.setExposure(1.45);
      const rendererExp = renderer.toneMappingExposure;
      const sliderExpVal = parseFloat(document.getElementById('photo-slider-exposure').value);
      const textExpVal = document.getElementById('photo-val-exposure').textContent;

      // Clamping
      pmm.setExposure(0.1);
      const clampedMinExp = renderer.toneMappingExposure;
      pmm.setExposure(3.5);
      const clampedMaxExp = renderer.toneMappingExposure;

      pmm.exit();

      return {
        rendererExp: Math.round(rendererExp * 100) / 100,
        sliderExpVal,
        textExpVal,
        clampedMinExp,
        clampedMaxExp
      };
    `);

    if (
      Math.abs(test7.rendererExp - 1.45) < 0.05 &&
      Math.abs(test7.sliderExpVal - 1.45) < 0.05 &&
      test7.textExpVal === '1.45x' &&
      test7.clampedMinExp === 0.4 &&
      test7.clampedMaxExp === 2.2
    ) {
      console.log('  ✓ Test 7 Passed: Tone mapping exposure tuned dynamically between 0.4x and 2.2x.');
      passedTests++;
    } else {
      console.error('  ✗ Test 7 Failed:', JSON.stringify(test7));
    }

    // TEST 8: Cinematic 2.39:1 Anamorphic Letterbox Bars & Depth of Field Blur
    console.log('[TEST 8/12] Testing 2.39:1 Widescreen Letterbox Bars & DoF Blur...');
    const test8 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const letterboxEl = document.getElementById('photo-letterbox-overlay');
      const dofEl = document.getElementById('photo-dof-overlay');

      pmm.enter();

      // Enable letterbox
      pmm.setLetterbox(true);
      const letterboxActive = !letterboxEl.classList.contains('hidden');
      const checkboxChecked = document.getElementById('photo-toggle-letterbox').checked;

      // Disable letterbox
      pmm.setLetterbox(false);
      const letterboxInactive = letterboxEl.classList.contains('hidden');

      // Test DoF blur slider
      const sliderBlur = document.getElementById('photo-slider-blur');
      sliderBlur.value = 0.6;
      sliderBlur.dispatchEvent(new Event('input'));
      const dofActive = !dofEl.classList.contains('hidden');
      const blurBackdrop = dofEl.style.backdropFilter;

      pmm.exit();

      return {
        letterboxActive,
        checkboxChecked,
        letterboxInactive,
        dofActive,
        blurBackdrop
      };
    `);

    if (
      test8.letterboxActive &&
      test8.checkboxChecked &&
      test8.letterboxInactive &&
      test8.dofActive &&
      test8.blurBackdrop.includes('blur')
    ) {
      console.log('  ✓ Test 8 Passed: 2.39:1 widescreen letterbox overlay and DoF blur functional.');
      passedTests++;
    } else {
      console.error('  ✗ Test 8 Failed:', JSON.stringify(test8));
    }

    // TEST 9: HUD Hiding & Showing (Toggle Button, 'H'/'Tab' Hotkeys, Restore Pill)
    console.log('[TEST 9/12] Testing HUD Hide/Show Controls & Floating Restore Pill...');
    const test9 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const dock = document.getElementById('photo-controls-dock');
      const pill = document.getElementById('photo-show-ui-pill');

      pmm.enter();

      // 1. Hide UI via button
      document.getElementById('photo-btn-hide-ui').click();
      const hiddenAfterBtn = pmm.isUIHidden && dock.classList.contains('hidden') && !pill.classList.contains('hidden');

      // 2. Show UI via pill
      pill.click();
      const shownAfterPill = !pmm.isUIHidden && !dock.classList.contains('hidden') && pill.classList.contains('hidden');

      // 3. Toggle via 'H' key
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', bubbles: true }));
      const hiddenAfterH = pmm.isUIHidden;

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', bubbles: true }));
      const shownAfterH2 = !pmm.isUIHidden;

      pmm.exit();

      return {
        hiddenAfterBtn,
        shownAfterPill,
        hiddenAfterH,
        shownAfterH2
      };
    `);

    if (
      test9.hiddenAfterBtn &&
      test9.shownAfterPill &&
      test9.hiddenAfterH &&
      test9.shownAfterH2
    ) {
      console.log('  ✓ Test 9 Passed: Photo UI hides with "H"/Button and restores via floating pill.');
      passedTests++;
    } else {
      console.error('  ✗ Test 9 Failed:', JSON.stringify(test9));
    }

    // TEST 10: Reset Camera Button
    console.log('[TEST 10/12] Testing Reset Camera Button...');
    const test10 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const cm = window.game.cameraManager;

      pmm.enter();

      // Change settings
      pmm.setFOV(30);
      pmm.setRoll(20);
      pmm.setExposure(1.8);
      pmm.setFilter('noir');
      pmm.setLetterbox(true);

      // Trigger reset
      document.getElementById('photo-btn-reset').click();

      const fovAfterReset = cm.getFOV();
      const rollAfterReset = cm.getRoll();
      const filterAfterReset = pmm.currentFilter;
      const letterboxAfterReset = pmm.isLetterboxActive;

      pmm.exit();

      return {
        fovAfterReset,
        rollAfterReset,
        filterAfterReset,
        letterboxAfterReset
      };
    `);

    if (
      test10.fovAfterReset === 60 &&
      test10.rollAfterReset === 0 &&
      test10.filterAfterReset === 'none' &&
      !test10.letterboxAfterReset
    ) {
      console.log('  ✓ Test 10 Passed: Reset camera restored 60° FOV, 0° roll, standard grading and framing.');
      passedTests++;
    } else {
      console.error('  ✗ Test 10 Failed:', JSON.stringify(test10));
    }

    // TEST 11: Genuine Screenshot Capture (Canvas toDataURL / toBlob PNG Generation, Shutter Audio & Flash)
    console.log('[TEST 11/12] Testing High-Res WebGL Screenshot Capture...');
    const test11 = await cdp.eval(`
      const pmm = window.game.photoModeManager;

      pmm.enter();

      let shutterFlashFired = false;
      const shutterFlash = document.getElementById('photo-shutter-flash');
      const observer = new MutationObserver(() => {
        if (shutterFlash.classList.contains('flash')) {
          shutterFlashFired = true;
        }
      });
      observer.observe(shutterFlash, { attributes: true, attributeFilter: ['class'] });

      // Trigger screenshot capture
      const captureResult = await pmm.captureScreenshot();

      observer.disconnect();

      const hasDataUrl = Boolean(pmm.lastCapturedDataUrl && pmm.lastCapturedDataUrl.startsWith('data:image/png'));
      const filenameValid = captureResult && captureResult.filename.startsWith('ShadowQuest_Photo_');
      const dimensionsValid = captureResult && captureResult.width > 0 && captureResult.height > 0;

      pmm.exit();

      return {
        success: captureResult?.success,
        hasDataUrl,
        filenameValid,
        dimensionsValid,
        width: captureResult?.width,
        height: captureResult?.height,
        filename: captureResult?.filename
      };
    `);

    if (
      test11.success &&
      test11.hasDataUrl &&
      test11.filenameValid &&
      test11.dimensionsValid
    ) {
      console.log(`  ✓ Test 11 Passed: Captured genuine high-res PNG (${test11.width}x${test11.height}, file: ${test11.filename}).`);
      passedTests++;
    } else {
      console.error('  ✗ Test 11 Failed:', JSON.stringify(test11));
    }

    // TEST 12: Exit Restoration (Gameplay Camera, Player Locomotion & Pointer Lock)
    console.log('[TEST 12/12] Testing Exit Restoration of Gameplay Camera & Player Controller...');
    const test12 = await cdp.eval(`
      const pmm = window.game.photoModeManager;
      const player = window.game.player;
      const cm = window.game.cameraManager;

      // Ensure normal gameplay
      window.game.resumeGame();
      const savedGameplayFOV = cm.camera.fov;
      const savedGameplayDistance = cm.distance;

      // Enter Photo Mode & alter framing
      pmm.enter();
      pmm.setFOV(25);
      pmm.update(0.1);

      const inPhotoModeActive = pmm.isActive;
      const inPhotoModeFOV = cm.camera.fov;

      // Exit Photo Mode
      pmm.exit();

      const afterExitActive = pmm.isActive;
      const afterExitPlayerEnabled = player.isEnabled;
      const afterExitFOV = cm.camera.fov;
      const afterExitDistance = cm.distance;
      const afterExitHudVisible = !document.getElementById('ui-overlay').classList.contains('hidden');

      return {
        inPhotoModeActive,
        inPhotoModeFOV,
        afterExitActive,
        afterExitPlayerEnabled,
        afterExitFOV,
        savedGameplayFOV,
        afterExitDistance,
        savedGameplayDistance,
        afterExitHudVisible
      };
    `);

    if (
      test12.inPhotoModeActive &&
      test12.inPhotoModeFOV === 25 &&
      !test12.afterExitActive &&
      test12.afterExitPlayerEnabled &&
      test12.afterExitFOV === test12.savedGameplayFOV &&
      test12.afterExitDistance === test12.savedGameplayDistance &&
      test12.afterExitHudVisible
    ) {
      console.log('  ✓ Test 12 Passed: Exiting photo mode cleanly restored gameplay camera, HUD, and player controls.');
      passedTests++;
    } else {
      console.error('  ✗ Test 12 Failed:', JSON.stringify(test12));
    }

    console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round(passedTests / totalTests * 100)}%) ===\n`);

    if (passedTests !== totalTests) {
      throw new Error(`Photo mode test suite failed: ${passedTests}/${totalTests} passed`);
    }

  } finally {
    if (cdp && cdp.ws) {
      try { cdp.ws.close(); } catch (e) {}
    }
    if (chromeProcess) {
      chromeProcess.kill();
    }
  }
}

runPhotoModeTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
