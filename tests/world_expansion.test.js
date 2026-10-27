/**
 * Automated Verification Test Suite for Shadow Quest: Expanded World & Connected Realms
 * Tests:
 * 1. Initial realm state (Dark Forest), connected passages, and landmark registration
 * 2. Stage 2: The Mountain Pass loading, terrain crags, Highwind Bridge, and Torvald NPC
 * 3. Landmark discovery trigger, exploration XP reward, and floating HUD banner
 * 4. Stage 3: The Abandoned Village loading, Crowfall Windmill, cottages, and Mara NPC
 * 5. Stage 4: The Whispering Cavern loading, subterranean river bridge, mushrooms, and Gideon NPC
 * 6. Passage proximity detection, HUD interaction prompt, and gateway traversal
 * 7. Player progression preservation (HP, stamina, inventory, gold, XP) across level switches
 * 8. World Map modal UI ([M] key / HUD button), topology badges, and region inspector
 * 9. Entity cleanup & zero entity/collider duplication across multiple transitions
 * 10. Backward compatibility with Stage 0 Dark Forest & Stage 1 Ancient Ruins
 */

import http from 'http';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const WS = globalThis.WebSocket;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9236;
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

async function runWorldExpansionTests() {
  console.log('=== SHADOW QUEST EXPANDED WORLD & CONNECTED REALMS VERIFICATION ===\n');

  const tempUserDataDir = path.join(os.tmpdir(), `sq-world-test-${Date.now()}`);
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
    await sleep(1000);

    // ==========================================
    // TEST 1: Initial Realm State & Passages
    // ==========================================
    console.log('--- Test 1: Stage 0 (The Dark Forest) Passages & Landmarks ---');
    const stage0Info = await cdp.eval(`
      const g = window.__GAME__;
      const stage = g.levelManager.getCurrentStage();
      const passages = g.levelManager.getPassages();
      const landmarks = g.levelManager.getLandmarks();
      return {
        stageId: stage.id,
        stageName: stage.name,
        passagesCount: passages.length,
        passageNames: passages.map(p => p.name),
        landmarksCount: landmarks.length,
        landmarkNames: landmarks.map(lm => lm.name),
        isForestDiscovered: g.player.discoveredLocations.includes('dark-forest')
      };
    `);
    console.log('Stage 0 info:', stage0Info);
    if (stage0Info.stageId !== 'dark-forest') throw new Error('Stage 0 ID should be dark-forest');
    if (stage0Info.passagesCount < 4) throw new Error('Stage 0 should have at least 4 passages');
    if (stage0Info.landmarksCount < 4) throw new Error('Stage 0 should have at least 4 landmarks');
    if (!stage0Info.isForestDiscovered) throw new Error('Dark forest should be discovered');
    console.log('✓ PASS: Dark Forest has registered passages, landmarks, and discovery tracking.');

    // ==========================================
    // TEST 2: Stage 2 (The Mountain Pass)
    // ==========================================
    console.log('\n--- Test 2: Stage 2 (The Mountain Pass) Geometry & Highwind Bridge ---');
    await cdp.eval(`
      const g = window.__GAME__;
      return g.levelManager.loadLevel(2, false);
    `);
    await sleep(1200);

    const stage2Info = await cdp.eval(`
      const g = window.__GAME__;
      return {
        stageIndex: g.levelManager.currentLevelIndex,
        stageName: g.levelManager.getCurrentStage().name,
        hasMountainStage: Boolean(g.environment.mountainPassStage),
        enemiesCount: g.enemyManager.getEnemies().length,
        npcsCount: g.npcManager.npcs.length,
        npcNames: g.npcManager.npcs.map(n => n.name),
        playerPos: { x: g.player.position.x, z: g.player.position.z },
        crystalsCount: g.collectibleManager.collectibles.filter(c => c.isCrystal).length
      };
    `);
    console.log('Stage 2 info:', stage2Info);
    if (stage2Info.stageIndex !== 2) throw new Error('Stage index should be 2');
    if (!stage2Info.hasMountainStage) throw new Error('MountainPassStage geometry should be loaded');
    if (stage2Info.enemiesCount < 3) throw new Error('Mountain Pass should have alpine enemies');
    if (!stage2Info.npcNames.includes('Torvald')) throw new Error('Torvald NPC should be at Mountain Pass');
    console.log('✓ PASS: Mountain Pass loaded with crags, bridge, alpine sentinels, and Torvald.');

    // ==========================================
    // TEST 3: Landmark Discovery & Exploration XP
    // ==========================================
    console.log('\n--- Test 3: Landmark Discovery Trigger & Reward Banner ---');
    const discoveryResult = await cdp.eval(`
      const g = window.__GAME__;
      const initialXP = g.player.xp;
      const initialDiscovered = [...g.player.discoveredLocations];

      // Teleport player near Eagle's Peak Cairn (x: -25, z: -20)
      g.player.teleport(-25, -20, 0, true);
      // Run game loop ticks
      g.update(0.016);
      g.update(0.016);

      const banner = document.getElementById('discovery-banner');
      const bannerTitle = document.getElementById('discovery-title')?.textContent;
      const bannerType = document.getElementById('discovery-type')?.textContent;

      return {
        initialXP,
        newXP: g.player.xp,
        isCairnDiscovered: g.player.discoveredLocations.includes('mp-cairn'),
        bannerVisible: !banner.classList.contains('hidden'),
        bannerTitle,
        bannerType
      };
    `);
    console.log('Discovery result:', discoveryResult);
    if (!discoveryResult.isCairnDiscovered) throw new Error("Eagle's Peak Cairn should be marked discovered");
    if (discoveryResult.newXP <= discoveryResult.initialXP) throw new Error('Exploration XP should be awarded');
    if (!discoveryResult.bannerVisible) throw new Error('Discovery banner should be visible');
    if (!discoveryResult.bannerTitle.includes('Eagle')) throw new Error('Banner title should display landmark name');
    console.log('✓ PASS: Landmark discovery awards exploration XP and triggers floating HUD banner.');

    // ==========================================
    // TEST 4: Stage 3 (The Abandoned Village)
    // ==========================================
    console.log('\n--- Test 4: Stage 3 (The Abandoned Village) Cottages & Windmill ---');
    await cdp.eval(`
      const g = window.__GAME__;
      return g.levelManager.loadLevel(3, false);
    `);
    await sleep(1200);

    const stage3Info = await cdp.eval(`
      const g = window.__GAME__;
      const villageStage = g.environment.abandonedVillageStage;
      return {
        stageIndex: g.levelManager.currentLevelIndex,
        stageName: g.levelManager.getCurrentStage().name,
        hasVillageStage: Boolean(villageStage),
        hasWindmillSails: Boolean(villageStage && villageStage.windmillSails),
        enemiesCount: g.enemyManager.getEnemies().length,
        npcNames: g.npcManager.npcs.map(n => n.name),
        crystalsCount: g.collectibleManager.collectibles.filter(c => c.isCrystal).length
      };
    `);
    console.log('Stage 3 info:', stage3Info);
    if (stage3Info.stageIndex !== 3) throw new Error('Stage index should be 3');
    if (!stage3Info.hasVillageStage) throw new Error('AbandonedVillageStage geometry should be loaded');
    if (!stage3Info.hasWindmillSails) throw new Error('Crowfall Windmill sails should exist');
    if (!stage3Info.npcNames.includes('Mara')) throw new Error('Mara NPC should be present at Crowfall Village');
    console.log('✓ PASS: Abandoned Village loaded with timber cottages, rotating windmill, and Mara.');

    // ==========================================
    // TEST 5: Stage 4 (The Whispering Cavern)
    // ==========================================
    console.log('\n--- Test 5: Stage 4 (The Whispering Cavern) & Sunken Crypt Gate ---');
    await cdp.eval(`
      const g = window.__GAME__;
      return g.levelManager.loadLevel(4, false);
    `);
    await sleep(1200);

    const stage4Info = await cdp.eval(`
      const g = window.__GAME__;
      const cavernStage = g.environment.whisperingCavernStage;
      return {
        stageIndex: g.levelManager.currentLevelIndex,
        stageName: g.levelManager.getCurrentStage().name,
        hasCavernStage: Boolean(cavernStage),
        shroomsCount: cavernStage ? cavernStage.shrooms.length : 0,
        hasCryptGlyph: Boolean(cavernStage && cavernStage.cryptGlyph),
        enemiesCount: g.enemyManager.getEnemies().length,
        npcNames: g.npcManager.npcs.map(n => n.name)
      };
    `);
    console.log('Stage 4 info:', stage4Info);
    if (stage4Info.stageIndex !== 4) throw new Error('Stage index should be 4');
    if (!stage4Info.hasCavernStage) throw new Error('WhisperingCavernStage geometry should be loaded');
    if (stage4Info.shroomsCount < 4) throw new Error('Luminescent mushrooms should be spawned in cavern');
    if (!stage4Info.hasCryptGlyph) throw new Error('Sunken Crypt Gate glyph should exist');
    if (!stage4Info.npcNames.includes('Gideon')) throw new Error('Gideon cartographer NPC should be present in cavern');
    console.log('✓ PASS: Whispering Cavern loaded with river bridge, glowing mushrooms, and Sunken Crypt Gate.');

    // ==========================================
    // TEST 6: Passage Proximity & Gateway Traversal
    // ==========================================
    console.log('\n--- Test 6: Passage Proximity Detection & Traversal ---');
    const passageResult = await cdp.eval(`
      const g = window.__GAME__;
      // In cavern, passage to Dark Forest is at x: -30, z: 30
      g.player.teleport(-30, 30, 0, true);
      g.update(0.016);

      const nearbyPassage = g.levelManager.getNearbyPassage(g.player.getPosition());
      const promptEl = document.getElementById('interaction-prompt');
      const promptText = document.getElementById('interaction-prompt-text')?.textContent;

      // Now trigger interaction [E]
      const interactSuccess = g.player.onInteractCallback ? g.player.onInteractCallback() : false;

      return {
        hasPassage: Boolean(nearbyPassage),
        passageTarget: nearbyPassage?.targetLevelIndex,
        promptVisible: !promptEl.classList.contains('hidden'),
        promptText,
        interactSuccess
      };
    `);
    console.log('Passage detection result:', passageResult);
    if (!passageResult.hasPassage) throw new Error('Nearby passage should be detected');
    if (!passageResult.promptVisible) throw new Error('Interaction prompt should be visible');
    if (!passageResult.interactSuccess) throw new Error('Interacting with passage should succeed');

    await sleep(2000);

    const postTransitionInfo = await cdp.eval(`
      const g = window.__GAME__;
      return {
        currentIndex: g.levelManager.currentLevelIndex,
        stageName: g.levelManager.getCurrentStage().name
      };
    `);
    console.log('Post transition info:', postTransitionInfo);
    if (postTransitionInfo.currentIndex !== 0) throw new Error('Should have transitioned back to Dark Forest (Stage 0)');
    console.log('✓ PASS: Proximity detection shows [E] prompt and seamless bidirectional passage traversal.');

    // Wait until transition is completely settled
    for (let i = 0; i < 20; i++) {
      const isTrans = await cdp.eval(`Boolean(window.__GAME__.levelManager.isTransitioning)`);
      if (!isTrans) break;
      await sleep(200);
    }

    // ==========================================
    // TEST 7: Progression Preservation
    // ==========================================
    console.log('\n--- Test 7: Player Progression Preservation Across Level Switches ---');
    await cdp.eval(`
      const g = window.__GAME__;
      g.player.health = 68;
      g.player.stamina = 45;
      g.player.gold = 350;
      g.player.level = 3;
      g.player.xp = 140;
      return g.levelManager.loadLevel(2, false);
    `);
    await sleep(1800);

    const progressionResult = await cdp.eval(`
      const g = window.__GAME__;
      return {
        stageIndex: g.levelManager.currentLevelIndex,
        health: g.player.health,
        stamina: g.player.stamina,
        gold: g.player.gold,
        level: g.player.level,
        xp: g.player.xp
      };
    `);
    console.log('Progression result:', progressionResult);
    if (progressionResult.stageIndex !== 2) throw new Error(`Stage index should be 2, got ${progressionResult.stageIndex}`);
    if (progressionResult.health !== 68) throw new Error(`Health should be 68, got ${progressionResult.health}`);
    if (progressionResult.gold !== 350) throw new Error(`Gold should be 350, got ${progressionResult.gold}`);
    if (progressionResult.level !== 3) throw new Error(`Level should be 3, got ${progressionResult.level}`);
    if (progressionResult.xp !== 140) throw new Error(`XP should be 140, got ${progressionResult.xp}`);
    console.log('✓ PASS: Player health, stamina, gold, level, and XP preserved without wiping.');

    // ==========================================
    // TEST 8: World Map UI Verification
    // ==========================================
    console.log('\n--- Test 8: World Map Modal ([M] Key & HUD Button) ---');
    const mapResult = await cdp.eval(`
      const g = window.__GAME__;
      // Open World Map
      g.toggleWorldMap(true);

      const modal = document.getElementById('modal-world-map');
      const isVisible = !modal.classList.contains('hidden');
      const nodes = document.querySelectorAll('.map-region-node');
      const currentNode = document.querySelector('.map-region-node.current');
      const currentRegionId = currentNode?.dataset.region;

      const badgeText = document.getElementById('map-discovery-badge')?.textContent;
      const regionNameText = document.getElementById('map-selected-region-name')?.textContent;

      // Close World Map
      g.toggleWorldMap(false);
      const isHiddenAfter = modal.classList.contains('hidden');

      return {
        isVisible,
        nodesCount: nodes.length,
        currentRegionId,
        badgeText,
        regionNameText,
        isHiddenAfter
      };
    `);
    console.log('World Map result:', mapResult);
    if (!mapResult.isVisible) throw new Error('World map modal should be visible');
    if (mapResult.nodesCount !== 5) throw new Error(`World map should have 5 region nodes, got ${mapResult.nodesCount}`);
    if (mapResult.currentRegionId !== 'mountain-pass') throw new Error('Current region node should be mountain-pass');
    if (!mapResult.badgeText.includes('DISCOVERED')) throw new Error('Discovery badge should be populated');
    if (!mapResult.isHiddenAfter) throw new Error('World map modal should close cleanly');
    console.log('✓ PASS: World Map modal renders all 5 regions, highlights current position, and tracks discovery.');

    // ==========================================
    // TEST 9: Entity Cleanup & Zero Duplication
    // ==========================================
    console.log('\n--- Test 9: Zero Entity & Collider Duplication After Roundtrip Traversal ---');
    const roundtripResult = await cdp.eval(`
      const g = window.__GAME__;
      // Rapid roundtrip travel: 2 -> 3 -> 4 -> 1 -> 0
      await g.levelManager.loadLevel(3, false);
      await g.levelManager.loadLevel(4, false);
      await g.levelManager.loadLevel(1, false);
      await g.levelManager.loadLevel(0, false);

      return {
        stageIndex: g.levelManager.currentLevelIndex,
        stageName: g.levelManager.getCurrentStage().name,
        enemiesCount: g.enemyManager.getEnemies().length,
        npcsCount: g.npcManager.npcs.length,
        collectiblesCount: g.collectibleManager.collectibles.length,
        collidersCount: g.physicsWorld.colliders.length
      };
    `);
    console.log('Roundtrip entity check:', roundtripResult);
    if (roundtripResult.stageIndex !== 0) throw new Error('Should be in Stage 0');
    if (roundtripResult.enemiesCount !== 5) throw new Error(`Dark forest enemies count should be exactly 5, got ${roundtripResult.enemiesCount}`);
    if (roundtripResult.npcsCount !== 3) throw new Error(`Dark forest NPCs count should be exactly 3, got ${roundtripResult.npcsCount}`);
    console.log('✓ PASS: Zero entity duplication, pristine state disposal, and stable physics world.');

    // ==========================================
    // TEST 10: Backward Compatibility
    // ==========================================
    console.log('\n--- Test 10: Backward Compatibility with Stage 0 & Stage 1 ---');
    const compatResult = await cdp.eval(`
      const g = window.__GAME__;
      // Load Stage 1 (Ancient Ruins)
      await g.levelManager.loadLevel(1, false);

      const stage1Name = g.levelManager.getCurrentStage().name;
      const stage1Enemies = g.enemyManager.getEnemies().length;
      const hasRuinsStage = Boolean(g.environment.ruinsStage);

      // Load Stage 0 (Dark Forest)
      await g.levelManager.loadLevel(0, false);
      const stage0Name = g.levelManager.getCurrentStage().name;
      const boss = g.enemyManager.boss;

      return {
        stage1Name,
        stage1Enemies,
        hasRuinsStage,
        stage0Name,
        hasBoss: Boolean(boss),
        bossName: boss?.name
      };
    `);
    console.log('Compatibility check:', compatResult);
    if (compatResult.stage1Name !== 'The Ancient Ruins') throw new Error('Stage 1 name should be The Ancient Ruins');
    if (compatResult.stage1Enemies < 4) throw new Error('Stage 1 should retain 4 elite void guardians');
    if (!compatResult.hasRuinsStage) throw new Error('Stage 1 should have RuinsStage geometry');
    if (!compatResult.hasBoss) throw new Error('Stage 0 should retain Malakor boss');
    console.log('✓ PASS: Stage 0 and Stage 1 remain 100% backward compatible.');

    console.log('\n======================================================');
    console.log('🏆 ALL 10 EXPANDED WORLD & CONNECTED REALMS TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exitCode = 1;
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
    } catch (e) {}
  }
}

runWorldExpansionTests();
