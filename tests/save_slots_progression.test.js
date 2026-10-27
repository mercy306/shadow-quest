import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';

const WS = globalThis.WebSocket;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9225;
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
    const trimmed = expr.trim();
    const wrapped = trimmed.startsWith('(()') || trimmed.startsWith('(async ()')
      ? trimmed
      : `(async () => {\n${trimmed}\n})()`;
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

async function runProgressionTests() {
  console.log('=== SHADOW QUEST ADVANCED SAVE & PROGRESSION VERIFICATION ===\n');

  const tempUserDataDir = path.join(os.tmpdir(), `sq-progression-test-${Date.now()}`);
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--user-data-dir=${tempUserDataDir}`
  ]);

  let cdp = null;

  try {
    await sleep(1500);
    const versionInfo = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
    console.log('Connected to Chrome:', versionInfo['Browser']);

    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitReady();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log(`Navigating to ${TARGET_URL}...`);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2500);

    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }

    console.log('Game initialized!');

    // ==========================================
    // TEST 1: Multiple Save Slots Listing & Metadata
    // ==========================================
    console.log('\n--- Test 1: Multiple Save Slots Structure ---');
    const slotsList = await cdp.eval(`
      const g = window.game || window.__GAME__;
      return g.saveManager.listAllSlots();
    `);
    console.log('Initial slots count:', slotsList.length);
    if (slotsList.length !== 5) throw new Error(`Expected 5 predefined save slots, got ${slotsList.length}`);
    const slotIds = slotsList.map(s => s.id);
    if (!slotIds.includes('autosave') || !slotIds.includes('quicksave') || !slotIds.includes('slot_1') || !slotIds.includes('slot_2') || !slotIds.includes('slot_3')) {
      throw new Error(`Missing expected slots: ${JSON.stringify(slotIds)}`);
    }
    console.log('✓ PASS: All 5 slots (autosave, quicksave, slot_1..3) discovered cleanly.');

    // ==========================================
    // TEST 2: Start Game, Mutate State & Save to Manual Slot 1
    // ==========================================
    console.log('\n--- Test 2: Save to Manual Slot 1 & Autosave Checkpoint ---');
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.startNewGame(true);
    `);
    await sleep(1000);

    const manualSaveResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;

      // Advance player stats and inventory
      player.level = 3;
      player.xp = 750;
      player.gold = 380;
      player.health = 85;
      player.position.set(15.2, 0.8, -25.4);
      player.unlockedSkills.push('void_slash');

      // Save to slot_1
      return g.saveCurrentGame('slot_1', { toastMessage: 'MANUAL SAVE 1' });
    `);
    console.log('Manual save result:', manualSaveResult);
    if (!manualSaveResult.success || manualSaveResult.slot !== 'slot_1') {
      throw new Error('Failed to save to manual slot_1');
    }

    // Trigger an autosave checkpoint
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.autoSave('Ancient Shrine Discovered');
    `);
    await sleep(500);

    const updatedSlots = await cdp.eval(`
      const g = window.game || window.__GAME__;
      return g.saveManager.listAllSlots();
    `);
    const slot1Info = updatedSlots.find(s => s.id === 'slot_1');
    const autoInfo = updatedSlots.find(s => s.id === 'autosave');
    console.log('Slot 1 Info:', slot1Info);
    console.log('Autosave Info:', autoInfo);

    if (!slot1Info.exists || slot1Info.level !== 3 || slot1Info.gold !== 380) {
      throw new Error('Slot 1 metadata was not properly recorded');
    }
    if (!autoInfo.exists || autoInfo.autosaveReason !== 'Ancient Shrine Discovered') {
      throw new Error('Autosave checkpoint was not recorded properly');
    }
    console.log('✓ PASS: Manual save slot 1 and autosave checkpoint saved with detailed metadata.');

    // ==========================================
    // TEST 3: Safe Position On Save (Airborne & Out-of-Bounds Protection)
    // ==========================================
    console.log('\n--- Test 3: Airborne & Out-of-Bounds Safe Position Guarantee ---');
    const safePosCheck = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;

      // Set last known safe grounded position
      player.lastSafePosition = { x: 10.0, y: 0.8, z: -12.0, rotationY: 0 };

      // Put player in free-fall mid-air off map
      player.isGrounded = false;
      player.position.set(10.0, -80.0, -12.0); // fallen off cliffs

      const captured = g.saveManager.captureGameState(g, 'slot_2');
      return {
        capturedPos: captured.player.position,
        isGrounded: player.isGrounded
      };
    `);
    console.log('Safe position captured:', safePosCheck);
    if (safePosCheck.capturedPos.y < -5) {
      throw new Error(`Player position was not protected against free-fall: y=${safePosCheck.capturedPos.y}`);
    }
    if (safePosCheck.capturedPos.x !== 10 || safePosCheck.capturedPos.z !== -12) {
      throw new Error('Player safe position did not match last grounded coordinates');
    }
    console.log('✓ PASS: Mid-air and off-cliff positions safely fall back to solid ground coordinates.');

    // ==========================================
    // TEST 4: Non-Serializable Object Stripping & Sanitization
    // ==========================================
    console.log('\n--- Test 4: Sanitization of Non-Serializable Runtime Objects ---');
    const sanitizeResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const testPayload = {
        name: 'SafePayload',
        number: 42,
        meshLeak: g.player.mesh, // Three.js Object3D
        audioLeak: g.audioManager.audioContext, // Web Audio Context
        domLeak: document.body, // DOM Node
        funcLeak: () => console.log('danger')
      };

      const sanitized = g.saveManager.sanitizeSerializable(testPayload);
      return {
        name: sanitized.name,
        number: sanitized.number,
        hasMesh: Boolean(sanitized.meshLeak),
        hasAudio: Boolean(sanitized.audioLeak),
        hasDom: Boolean(sanitized.domLeak),
        hasFunc: Boolean(sanitized.funcLeak)
      };
    `);
    console.log('Sanitization result:', sanitizeResult);
    if (sanitizeResult.hasMesh || sanitizeResult.hasAudio || sanitizeResult.hasDom || sanitizeResult.hasFunc) {
      throw new Error('Sanitization failed to strip non-serializable runtime references');
    }
    console.log('✓ PASS: Three.js objects, audio nodes, DOM elements, and functions are stripped cleanly.');

    // ==========================================
    // TEST 5: Multiplayer Progression Isolation
    // ==========================================
    console.log('\n--- Test 5: Multiplayer Progression Isolation ---');
    const mpCheck = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const invalidMPSave = {
        version: 1,
        player: { position: { x: 0, y: 0.8, z: 0 }, health: 100 },
        world: { currentLevelIndex: 0 },
        quest: { id: 'test' },
        multiplayer: {
          isMultiplayer: true, // Attempted unvalidated multiplayer progression injection
          authoritativeServer: null
        }
      };

      const validation = g.saveManager.validateSaveData(invalidMPSave);
      return {
        valid: validation.valid,
        error: validation.error
      };
    `);
    console.log('Multiplayer validation check:', mpCheck);
    if (mpCheck.valid) {
      throw new Error('Validation failed to reject unverified multiplayer client save');
    }
    console.log('✓ PASS: Multiplayer progression cannot be injected into single-player saves.');

    // ==========================================
    // TEST 6: Save Failures Do Not Crash Gameplay
    // ==========================================
    console.log('\n--- Test 6: Save Failure Fault Tolerance ---');
    const crashTestResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const originalWrite = g.saveManager.writeToStorage;

      // Mock storage quota exception
      g.saveManager.writeToStorage = async () => {
        throw new Error('Simulated QuotaExceededError: storage full');
      };

      const failResult = await g.saveManager.saveGame(g, 'slot_3');

      // Restore
      g.saveManager.writeToStorage = originalWrite;

      // Verify game is still PLAYING and update ticks work
      g.player.update(0.016);
      g.combatSystem.update(0.016);

      return {
        saveSuccess: failResult.success,
        reason: failResult.reason,
        gameState: g.gameState,
        playerAlive: g.player.health > 0
      };
    `);
    console.log('Failure resilience test result:', crashTestResult);
    if (crashTestResult.saveSuccess) throw new Error('Save should report failure on quota error');
    if (crashTestResult.gameState !== 'PLAYING' || !crashTestResult.playerAlive) {
      throw new Error('Save failure disrupted active gameplay state');
    }
    console.log('✓ PASS: Save failures fail gracefully and never crash the game loop.');

    // ==========================================
    // TEST 7: Corrupted Save Quarantine & Autosave Recovery
    // ==========================================
    console.log('\n--- Test 7: Corrupted Save Quarantine & Autosave Recovery ---');
    const recoveryResult = await cdp.eval(`
      const g = window.game || window.__GAME__;

      // Intentionally write corrupted data into slot_1 across storage
      await g.saveManager.writeToStorage('slot_1', {
        version: 1,
        slot: 'slot_1',
        player: { position: { x: 'corrupt', y: null, z: 0 }, health: -99 }
      });

      // Try to load corrupted slot_1
      const loadCorrupt = await g.saveManager.loadGame(g, 'slot_1');

      // Verify corrupted save was quarantined into localStorage backup
      const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('sq_corrupted_slot_1'));

      // Perform Autosave Recovery into slot_1
      const recovery = await g.saveManager.recoverFromAutosave('slot_1');

      // Now load recovered slot_1
      const loadRecovered = await g.saveManager.loadGame(g, 'slot_1');

      return {
        loadCorruptSuccess: loadCorrupt.success,
        loadCorruptReason: loadCorrupt.reason,
        isCorrupted: loadCorrupt.isCorrupted,
        quarantineBackupExists: backupKeys.length > 0,
        recoverySuccess: recovery.success,
        recoveredLevel: loadRecovered.data?.player?.level
      };
    `);
    console.log('Recovery result:', recoveryResult);
    if (recoveryResult.loadCorruptSuccess) throw new Error('Corrupted save should not load successfully');
    if (!recoveryResult.quarantineBackupExists) throw new Error('Corrupted save was not safely quarantined');
    if (!recoveryResult.recoverySuccess) throw new Error('Autosave recovery into slot_1 failed');
    console.log('✓ PASS: Corrupted saves are safely quarantined and cleanly recovered from autosave.');

    // ==========================================
    // TEST 8: Full Browser Reload & Multi-Slot Restoration
    // ==========================================
    console.log('\n--- Test 8: Browser Page Reload & Multi-Slot Restoration ---');
    await cdp.send('Page.reload');
    await sleep(2500);

    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }

    // Check Continue button after reload
    for (let i = 0; i < 30; i++) {
      const isDisabled = await cdp.eval('document.getElementById("menu-btn-continue").disabled');
      if (!isDisabled) break;
      await sleep(200);
    }

    const reloadSlotList = await cdp.eval(`
      const g = window.game || window.__GAME__;
      return g.saveManager.listAllSlots();
    `);
    console.log('Slots after reload:', reloadSlotList.filter(s => s.exists).map(s => ({ id: s.id, name: s.name, level: s.level })));

    // Load manual slot_1
    const loadSlot1AfterReload = await cdp.eval(`
      const g = window.game || window.__GAME__;
      return g.saveManager.loadGame(g, 'slot_1');
    `);
    console.log('Slot 1 load after reload:', { success: loadSlot1AfterReload.success, stage: loadSlot1AfterReload.data?.world?.currentLevelIndex });
    if (!loadSlot1AfterReload.success) throw new Error('Failed to load slot_1 after browser reload');
    console.log('✓ PASS: Multi-slot progression persisted and loaded cleanly across full page reload.');

    // ==========================================
    // TEST 9: New Game Confirmation Modal
    // ==========================================
    console.log('\n--- Test 9: New Game Confirmation Modal ---');
    const confirmModalCheck = await cdp.eval(`
      const g = window.game || window.__GAME__;
      // Trigger new game with confirmation required
      const startPromise = g.startNewGame(false);

      // Wait a moment for async hasAnySave check to resolve and display modal
      for (let i = 0; i < 20; i++) {
        if (!document.getElementById('modal-confirm').classList.contains('hidden')) break;
        await new Promise(r => setTimeout(r, 50));
      }

      const modal = document.getElementById('modal-confirm');
      const isVisible = !modal.classList.contains('hidden');
      const title = document.getElementById('confirm-modal-title').textContent;

      // Cancel it
      document.getElementById('confirm-modal-cancel-btn').click();
      await startPromise;
      const isHiddenAfterCancel = modal.classList.contains('hidden');

      return {
        isVisible,
        title,
        isHiddenAfterCancel
      };
    `);
    console.log('Confirmation modal check:', confirmModalCheck);
    if (!confirmModalCheck.isVisible) throw new Error('New game confirmation modal was not presented');
    if (!confirmModalCheck.isHiddenAfterCancel) throw new Error('Modal did not close upon cancellation');
    console.log('✓ PASS: Confirmation modal alerts player before resetting existing progression.');

    // ==========================================
    // TEST 10: In-Game Save Slots Modal Interaction
    // ==========================================
    console.log('\n--- Test 10: In-Game Save/Load Slots Modal ---');
    const slotsModalCheck = await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.togglePause();

      // Open save slots modal
      await g.uiManager.openSaveSlotsModal(g, 'save');

      const modal = document.getElementById('modal-save-slots');
      const isModalOpen = !modal.classList.contains('hidden');
      const cardsCount = document.querySelectorAll('.save-slot-card').length;

      // Switch to load tab
      document.getElementById('tab-load-mode-btn').click();
      const isLoadTabActive = document.getElementById('tab-load-mode-btn').classList.contains('active');

      // Close modal
      g.uiManager.closeSaveSlotsModal();
      const isModalClosed = modal.classList.contains('hidden');

      g.resumeGame();

      return {
        isModalOpen,
        cardsCount,
        isLoadTabActive,
        isModalClosed
      };
    `);
    console.log('Slots modal interaction check:', slotsModalCheck);
    if (!slotsModalCheck.isModalOpen || slotsModalCheck.cardsCount !== 5) {
      throw new Error('Save slots modal did not render all 5 slot cards properly');
    }
    if (!slotsModalCheck.isLoadTabActive || !slotsModalCheck.isModalClosed) {
      throw new Error('Slots modal tabs or closing behavior failed');
    }
    console.log('✓ PASS: Save/Load slots modal allows full interactive slot management.');

    console.log('\n======================================================');
    console.log('🏆 ALL 10 ADVANCED SAVE & PROGRESSION TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

  } finally {
    if (cdp && cdp.ws) cdp.ws.close();
    chromeProcess.kill('SIGKILL');
  }
}

runProgressionTests().catch(err => {
  console.error('\n❌ ADVANCED SAVE TEST FAILED:', err);
  process.exit(1);
});
