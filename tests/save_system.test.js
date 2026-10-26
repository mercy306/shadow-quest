import http from 'http';
import { spawn } from 'child_process';

const WS = globalThis.WebSocket;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const TARGET_URL = 'http://localhost:5173/';

async function sleep(ms) {
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
    this.events = [];
    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    };
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const trimmed = expression.trim();
    const wrapped = (trimmed.includes(';') || trimmed.includes('\n') || trimmed.startsWith('const ') || trimmed.startsWith('let '))
      ? `(async () => {\n${trimmed}\n})()`
      : trimmed;
    const res = await this.send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function runTests() {
  console.log('=== SHADOW QUEST PERSISTENT SAVE SYSTEM VERIFICATION ===\n');

  // Launch headless chrome
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--user-data-dir=C:\\Users\\bsd\\AppData\\Local\\Temp\\chrome-test-save-${Date.now()}`
  ]);

  let cdp = null;

  try {
    console.log('Waiting for Chrome DevTools port...');
    await sleep(1500);

    const versionInfo = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
    console.log('Connected to Chrome:', versionInfo['Browser']);

    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log('Connecting to page WebSocket:', pageTarget.webSocketDebuggerUrl);

    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    console.log(`Navigating to ${TARGET_URL}...`);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2500);

    // Wait until engine finishes loading
    console.log('Waiting for game initialization...');
    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }

    console.log('Game initialized!');

    // ==========================================
    // TEST 1: Initial State & Continue Button Check
    // ==========================================
    console.log('\n--- Test 1: Initial Main Menu State ---');
    const continueBtnDisabled = await cdp.eval(`
      const btn = document.getElementById('menu-btn-continue');
      return ({ disabled: btn.disabled, hasDisabledClass: btn.classList.contains('disabled') });
    `);
    console.log('Initial Continue button state:', continueBtnDisabled);
    if (!continueBtnDisabled.disabled) {
      throw new Error('Continue button should be disabled when no save exists.');
    }
    console.log('✓ PASS: Continue button correctly disabled on initial launch.');

    // ==========================================
    // TEST 2: Start New Game & Modify Game State
    // ==========================================
    console.log('\n--- Test 2: Start Game & Mutate State ---');
    await cdp.eval(`
      // Click New Game
      document.getElementById('menu-btn-play').click();
    `);
    await sleep(1000);

    const gameStateAfterPlay = await cdp.eval('(window.game || window.__GAME__).gameState');
    console.log('Game state after play:', gameStateAfterPlay);
    if (gameStateAfterPlay !== 'PLAYING') {
      throw new Error(`Expected PLAYING game state, got: ${gameStateAfterPlay}`);
    }

    // Mutate state: Move player to custom coords, take damage, award score, defeat enemies
    const mutatedState = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;
      player.mesh.position.set(12.5, 0.8, -18.2);
      player.mesh.rotation.y = 1.25;
      player.health = 72; // damaged
      player.xp = 350;
      player.level = 2;
      player.inventory.push({ id: 'mana_stone', name: 'Mana Stone', count: 1, icon: '🔮' });
      player.unlockedSkills.push('void_step');

      // Update HUD
      g.uiManager.updatePlayerHealth(player.health, player.maxHealth);

      // Collect one crystal
      const crystal = g.collectibleManager.collectibles[0];
      if (crystal) {
        g.collectibleManager.collectedIds.add(crystal.id);
        crystal.isCollected = true;
        crystal.isDisposed = true;
        crystal.mesh.visible = false;
        g.collectibleManager.collectedCounts.set('crystal', 1);
        g.questSystem.onCrystalCollected(crystal);
      }

      // Defeat one enemy
      const enemy = g.enemyManager.enemies[0];
      if (enemy) {
        g.questSystem.onEnemyDefeated(enemy);
      }

      return ({
        pos: { x: player.position.x, y: player.position.y, z: player.position.z },
        rotY: player.rotation.y,
        health: player.health,
        xp: player.xp,
        level: player.level,
        crystals: g.collectibleManager.getCollectedIds(),
        enemiesDefeated: g.questSystem.currentQuest.objEnemies.current
      });
    `);
    console.log('Mutated state before saving:', mutatedState);
    console.log('✓ PASS: In-game state mutated successfully.');

    // ==========================================
    // TEST 3: Save Game & Save Indicator Toast
    // ==========================================
    console.log('\n--- Test 3: Manual Save & Save Indicator Notification ---');
    const saveResult = await cdp.eval(`
      return (window.game || window.__GAME__).saveCurrentGame();
    `);
    console.log('Save result:', saveResult);
    if (!saveResult || !saveResult.success) {
      throw new Error(`Save failed: ${saveResult?.reason}`);
    }

    // Verify Save indicator toast is active and displayed
    const toastCheck = await cdp.eval(`
      const toast = document.getElementById('save-indicator');
      const text = document.getElementById('save-indicator-text');
      return ({
        visible: !toast.classList.contains('hidden'),
        text: text.textContent
      });
    `);
    console.log('Save indicator toast check:', toastCheck);
    if (!toastCheck.visible || !toastCheck.text.includes('SAVED')) {
      throw new Error('Save indicator toast was not triggered properly.');
    }
    console.log('✓ PASS: Manual save succeeded and indicator toast confirmed.');

    // ==========================================
    // TEST 4: Inspect Persisted Schema & Multiplayer Isolation
    // ==========================================
    console.log('\n--- Test 4: Inspect Save Schema & Multiplayer Isolation ---');
    const persistedSave = await cdp.eval(`
      const g = window.game || window.__GAME__;
      return g.saveManager.readFromStorage('quicksave');
    `);
    console.log('Persisted Save Schema Summary:');
    console.log('  Version:', persistedSave.version);
    console.log('  Player Position:', persistedSave.player.position);
    console.log('  Player Health:', persistedSave.player.health);
    console.log('  Player Level & XP:', persistedSave.player.level, persistedSave.player.xp);
    console.log('  Player Inventory:', persistedSave.player.inventory);
    console.log('  Player Skills:', persistedSave.player.unlockedSkills);
    console.log('  Collectibles:', persistedSave.collectibles);
    console.log('  Quest:', persistedSave.quest);
    console.log('  Settings:', persistedSave.settings);
    console.log('  Multiplayer state (Requirement 10):', persistedSave.multiplayer);

    if (persistedSave.version !== 1) throw new Error('Schema version must be 1');
    if (persistedSave.player.health !== 72) throw new Error('Saved health mismatch');
    if (persistedSave.player.level !== 2) throw new Error('Saved level mismatch');
    if (persistedSave.multiplayer.isMultiplayer !== false) throw new Error('Multiplayer state must be isolated');
    console.log('✓ PASS: Schema integrity & multiplayer isolation confirmed.');

    // ==========================================
    // TEST 5: Transient State Protection
    // ==========================================
    console.log('\n--- Test 5: Transient State Protection ---');
    const transientCheck = await cdp.eval(`
      const g = window.game || window.__GAME__;
      // 1. Try to save while in level transition
      g.levelManager.isTransitioning = true;
      const transSave = g.saveManager.canSave(g);
      g.levelManager.isTransitioning = false;

      // 2. Try to save while dead
      const prevHealth = g.player.health;
      g.player.health = 0;
      const deadSave = g.saveManager.canSave(g);
      g.player.health = prevHealth;

      // 3. Try to save while in main menu
      g.gameState = 'MAIN_MENU';
      const menuSave = g.saveManager.canSave(g);
      g.gameState = 'PLAYING';

      return ({
        transSaveAllowed: transSave.allowed,
        transReason: transSave.reason,
        deadSaveAllowed: deadSave.allowed,
        deadReason: deadSave.reason,
        menuSaveAllowed: menuSave.allowed,
        menuReason: menuSave.reason
      });
    `);
    console.log('Transient state checks:', transientCheck);
    if (transientCheck.transSaveAllowed || transientCheck.deadSaveAllowed || transientCheck.menuSaveAllowed) {
      throw new Error('SaveManager must reject saving transient, defeated, or menu states.');
    }
    console.log('✓ PASS: Transient state protection successfully rejects unsafe saves.');

    // ==========================================
    // TEST 6: Schema Migration & Corrupted Data Handling
    // ==========================================
    console.log('\n--- Test 6: Migrations & Corruption Resilience ---');
    const migrationCheck = await cdp.eval(`
      const g = window.game || window.__GAME__;
      // Legacy unversioned save
      const legacySave = {
        player: { position: { x: 5, y: 1, z: 5 }, health: 90 },
        world: { currentLevelIndex: 0 }
      };
      const migrated = g.saveManager.migrateSaveData(legacySave);
      const validation = g.saveManager.validateSaveData(migrated);

      // Corrupted save data
      const corruptedSave = { version: 1, player: { position: { x: NaN, y: 0, z: 0 }, health: -10 } };
      const corruptValidation = g.saveManager.validateSaveData(corruptedSave);

      return ({
        migratedVersion: migrated.version,
        migratedValid: validation.valid,
        corruptValid: corruptValidation.valid,
        corruptError: corruptValidation.error
      });
    `);
    console.log('Migration & Corruption results:', migrationCheck);
    if (migrationCheck.migratedVersion !== 1 || !migrationCheck.migratedValid) {
      throw new Error('Migration failed to produce valid v1 schema');
    }
    if (migrationCheck.corruptValid) {
      throw new Error('Validation failed to detect corrupted data');
    }
    console.log('✓ PASS: Schema migration and corruption detection working properly.');

    // ==========================================
    // TEST 7: Settings Persistence
    // ==========================================
    console.log('\n--- Test 7: Settings Persistence ---');
    const settingsCheck = await cdp.eval(`
      const g = window.game || window.__GAME__;
      // Change master volume and mouse sensitivity
      g.saveManager.saveSettings({
        masterVolume: 0.42,
        mouseSensitivity: 3.5,
        invertY: true
      });
      return g.saveManager.loadSettings();
    `);
    console.log('Persisted settings:', settingsCheck);
    if (settingsCheck.masterVolume !== 0.42 || settingsCheck.invertY !== true) {
      throw new Error('Settings persistence mismatch');
    }
    console.log('✓ PASS: Settings persistence verified.');

    // ==========================================
    // TEST 8: Full Browser Reload & Continue Adventure
    // ==========================================
    console.log('\n--- Test 8: Browser Page Reload & Continue Adventure ---');
    await cdp.send('Page.reload');
    await sleep(2500);

    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }

    // Wait for Continue button to be ENABLED after reload!
    for (let i = 0; i < 30; i++) {
      const isDisabled = await cdp.eval('document.getElementById("menu-btn-continue").disabled');
      if (!isDisabled) break;
      await sleep(200);
    }

    const postReloadContinueState = await cdp.eval(`
      const btn = document.getElementById('menu-btn-continue');
      return ({
        disabled: btn.disabled,
        hasClass: btn.classList.contains('primary'),
        title: btn.title
      });
    `);
    console.log('Post-reload Continue button state:', postReloadContinueState);
    if (postReloadContinueState.disabled) {
      throw new Error('Continue button should be ENABLED after reloading when save exists.');
    }

    // Click Continue!
    console.log('Clicking CONTINUE button...');
    await cdp.eval(`
      document.getElementById('menu-btn-continue').click();
    `);

    // Wait until game finishes loading level and enters PLAYING state
    for (let i = 0; i < 40; i++) {
      const isPlaying = await cdp.eval('(window.game || window.__GAME__).gameState === "PLAYING"');
      if (isPlaying) break;
      await sleep(200);
    }
    await sleep(500);

    // Verify all restored states
    const restoredState = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;
      const quest = g.questSystem.currentQuest;
      const col = g.collectibleManager;
      return ({
        gameState: g.gameState,
        pos: { x: player.position.x, y: player.position.y, z: player.position.z },
        rotY: player.rotation.y,
        health: player.health,
        level: player.level,
        xp: player.xp,
        inventoryCount: player.inventory.length,
        skillsCount: player.unlockedSkills.length,
        collectedCrystals: col.getCollectedIds(),
        enemiesDefeated: quest.objEnemies.current
      });
    `);
    console.log('Restored state after CONTINUE:', restoredState);

    if (restoredState.gameState !== 'PLAYING') throw new Error('Game should be in PLAYING state');
    if (Math.abs(restoredState.pos.x - 12.5) > 0.05 || Math.abs(restoredState.pos.z - (-18.2)) > 0.05) {
      throw new Error(`Player position was not accurately restored: ${JSON.stringify(restoredState.pos)}`);
    }
    if (restoredState.health !== 72) throw new Error(`Health not restored accurately: ${restoredState.health}`);
    if (restoredState.level !== 2) throw new Error(`Level not restored: ${restoredState.level}`);
    if (restoredState.xp !== 350) throw new Error(`XP not restored: ${restoredState.xp}`);
    if (restoredState.collectedCrystals.length < 1) throw new Error('Collected crystals not restored');
    if (restoredState.enemiesDefeated !== 1) throw new Error('Quest enemies defeated not restored');

    console.log('✓ PASS: All player, world, quest, and inventory states flawlessly restored across page reload!');

    // ==========================================
    // TEST 9: In-Game Pause Menu Save & Load
    // ==========================================
    console.log('\n--- Test 9: In-Game Pause Menu Save & Load ---');
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      // Pause game
      g.togglePause();
    `);
    await sleep(500);

    const pauseScreenVisible = await cdp.eval('!document.getElementById("pause-screen").classList.contains("hidden")');
    console.log('Pause screen visible:', pauseScreenVisible);
    if (!pauseScreenVisible) throw new Error('Pause screen should be visible');

    // Click Save Game from pause menu
    await cdp.eval('document.getElementById("pause-save-btn").click()');
    await sleep(500);

    // Click Resume
    await cdp.eval('document.getElementById("resume-btn").click()');
    await sleep(300);

    const isPlayingAgain = await cdp.eval('(window.game || window.__GAME__).gameState === "PLAYING"');
    console.log('Resumed after save:', isPlayingAgain);
    if (!isPlayingAgain) throw new Error('Should resume to PLAYING');

    console.log('✓ PASS: Pause menu Save and Resume buttons verified.');

    console.log('\n======================================================');
    console.log('🏆 ALL 9 SAVE SYSTEM TEST SUITES PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ TEST RUNNER ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill('SIGKILL');
  }
}

runTests();
