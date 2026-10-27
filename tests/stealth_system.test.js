/**
 * Automated Verification Test Suite for Shadow Quest: Stealth Gameplay Mechanics
 * Tests:
 * 1. Crouch movement mode (speed, profile height, stance toggle)
 * 2. Movement noise propagation across stances & surfaces
 * 3. Enemy vision field-of-view (FOV cone)
 * 4. Line-of-sight obstruction blocking detection
 * 5. Foliage/cover concealment
 * 6. Awareness meter progression (UNAWARE -> SUSPICIOUS -> ALERTED -> ENGAGED)
 * 7. Noise investigation & last known position
 * 8. Breaking LOS & search-to-patrol return
 * 9. Stealth takedown execution & rewards
 * 10. Normal combat engagement from front
 */

import http from 'http';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const WS = globalThis.WebSocket;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9232;
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
    const wrapped = expr.trim().startsWith('(()') || !expr.includes('return')
      ? expr
      : `(() => {\n${expr}\n})()`;
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

async function runStealthTests() {
  console.log('=== SHADOW QUEST STEALTH GAMEPLAY VERIFICATION ===\n');

  const tempUserDataDir = path.join(os.tmpdir(), `sq-stealth-test-${Date.now()}`);
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
    let list = null;
    for (let i = 0; i < 40; i++) {
      try {
        list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
        if (list && list.length > 0) break;
      } catch (e) {}
      await sleep(200);
    }

    const page = list.find(p => p.type === 'page' && p.url.includes('5173'));
    if (!page) throw new Error('Could not find active game page');

    const cdp = new CDPClient(page.webSocketDebuggerUrl);
    await cdp.waitReady();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    let isReady = false;
    for (let i = 0; i < 60; i++) {
      isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }
    if (!isReady) throw new Error('Game failed to initialize within timeout');
    console.log('Game initialized!');

    // Start New Adventure
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      if (g && typeof g.startNewGame === 'function') {
        g.startNewGame();
      }
    `);
    await sleep(1500);

    // ==========================================
    // TEST 1: Crouch Movement Mode & Profile
    // ==========================================
    console.log('\n--- Test 1: Crouch Movement Mode & Profile ---');
    const crouchResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;

      const initialHeight = player.height;
      const initialCrouch = player.isCrouching;

      // Toggle crouch
      player.toggleCrouch(true);
      const crouchHeight = player.height;
      const isCrouched = player.isCrouching;
      const crouchSpeed = player.crouchSpeed;

      // Toggle back to standing
      player.toggleCrouch(false);
      const restoredHeight = player.height;

      return {
        initialHeight,
        initialCrouch,
        crouchHeight,
        isCrouched,
        crouchSpeed,
        restoredHeight
      };
    `);
    console.log('Crouch test result:', crouchResult);
    if (crouchResult.initialHeight !== 1.8) throw new Error('Player initial height should be 1.8');
    if (crouchResult.crouchHeight !== 1.2) throw new Error('Player crouched height should be 1.2');
    if (!crouchResult.isCrouched) throw new Error('Player should be crouching');
    if (crouchResult.crouchSpeed > 3.0) throw new Error('Crouch speed should be reduced stealth pace');
    if (crouchResult.restoredHeight !== 1.8) throw new Error('Player height should restore to 1.8');
    console.log('✓ PASS: Crouch mode correctly reduces player height profile and movement speed.');

    // ==========================================
    // TEST 2: Movement Noise Propagation
    // ==========================================
    console.log('\n--- Test 2: Movement Noise Propagation ---');
    const noiseResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;

      // 1. Stationary noise
      player.keys.forward = false;
      player.update(0.016);
      const stationaryNoise = player.getNoiseRadius();

      // 2. Crouch moving noise
      player.toggleCrouch(true);
      player.keys.forward = true;
      player.update(0.016);
      const crouchMovingNoise = player.getNoiseRadius();

      // 3. Walk moving noise
      player.toggleCrouch(false);
      player.isRunMode = false;
      player.keys.shift = false;
      player.keys.forward = true;
      player.update(0.016);
      const walkNoise = player.getNoiseRadius();

      // 4. Run moving noise
      player.isRunMode = true;
      player.keys.shift = false;
      player.keys.forward = true;
      player.update(0.016);
      const runNoise = player.getNoiseRadius();

      // 5. Sprint moving noise
      player.keys.shift = true;
      player.update(0.016);
      const sprintNoise = player.getNoiseRadius();

      // Reset keys and update to clear noise
      player.keys.forward = false;
      player.keys.shift = false;
      player.update(0.016);

      return {
        stationaryNoise,
        crouchMovingNoise,
        walkNoise,
        runNoise,
        sprintNoise
      };
    `);
    console.log('Movement noise metrics (meters):', noiseResult);
    if (noiseResult.stationaryNoise !== 0) throw new Error('Stationary noise should be 0');
    if (noiseResult.crouchMovingNoise > 1.2) throw new Error('Crouch moving should be very quiet (< 1.2m)');
    if (noiseResult.walkNoise < noiseResult.crouchMovingNoise) throw new Error('Walk noise should exceed crouch noise');
    if (noiseResult.runNoise < noiseResult.walkNoise) throw new Error('Run noise should exceed walk noise');
    if (noiseResult.sprintNoise < noiseResult.runNoise) throw new Error('Sprint noise should exceed run noise');
    console.log('✓ PASS: Movement noise dynamically scales with movement speed and stance.');

    // ==========================================
    // TEST 3: Enemy Vision FOV Cone Check
    // ==========================================
    console.log('\n--- Test 3: Enemy Vision FOV Cone Check ---');
    const fovResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const enemy = g.enemyManager.getEnemies()[0];
      const player = g.player;

      // Reset enemy to unaware IDLE facing +Z (towards Z = 30)
      enemy.awareness = 0;
      enemy.setState('IDLE');
      enemy.idleTimer = 0;
      enemy.position.set(20, 0, 20);
      enemy.groundToTerrain();
      enemy.rotateTowards(20, 30, 10.0);

      // Place player BEHIND enemy (at Z = 12, distance 8m behind)
      player.position.set(20, 0, 12);
      player.groundToTerrain();
      player.keys.forward = false;
      player.keys.shift = false;
      player.toggleCrouch(false);
      player.update(0.016);
      enemy.update(0.5, player);

      const awarenessBehind = enemy.awareness;

      // Now place player in FRONT of enemy (at Z = 28, distance 8m in front cone)
      player.position.set(20, 0, 28);
      player.groundToTerrain();
      player.update(0.016);
      enemy.idleTimer = 0;
      enemy.update(0.5, player);

      const awarenessFront = enemy.awareness;

      return {
        awarenessBehind,
        awarenessFront,
        fovAngleDeg: Math.round(enemy.fovAngle * 180 / Math.PI)
      };
    `);
    console.log('FOV vision result:', fovResult);
    if (fovResult.awarenessBehind > 0.05) throw new Error('Enemy should not visually detect player behind outside FOV cone');
    if (fovResult.awarenessFront <= fovResult.awarenessBehind) throw new Error('Enemy should detect player in front FOV cone');
    console.log('✓ PASS: Enemy forward vision cone accurately detects front targets while blind to rear.');

    // ==========================================
    // TEST 4: Line of Sight (LOS) Obstruction
    // ==========================================
    console.log('\n--- Test 4: Line of Sight (LOS) Obstruction ---');
    const losResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const pw = g.physicsWorld;

      // Test open line of sight along clear forest path
      const fromY = pw.getGroundHeight(0, 0) + 1.6;
      const toY = pw.getGroundHeight(0, -8) + 1.6;
      const from = { x: 0, y: fromY, z: 0 };
      const toOpen = { x: 0, y: toY, z: -8 };
      const openLOS = pw.hasLineOfSight(from, toOpen);

      // Add a test obstacle wall collider between from and toOpen at (0, -4)
      const col = new pw.colliders[0].constructor(0, -4, 2.0, fromY - 5, fromY + 5, 'wall');
      pw.addCollider(col);

      const blockedLOS = pw.hasLineOfSight(from, toOpen);

      return {
        openLOS,
        blockedLOS
      };
    `);
    console.log('Line of sight check result:', losResult);
    if (!losResult.openLOS) throw new Error('Open path should have clear line of sight');
    if (losResult.blockedLOS) throw new Error('Obstacle should block line of sight');
    console.log('✓ PASS: Solid obstacles and ruins accurately obstruct enemy sightline.');

    // ==========================================
    // TEST 5: Cover & Vegetation Concealment
    // ==========================================
    console.log('\n--- Test 5: Cover & Vegetation Concealment ---');
    const coverResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const veg = g.environment.vegetation;
      const player = g.player;

      // Find first bush location
      const firstBush = veg.coverZones[0];
      player.position.set(firstBush.x, 0, firstBush.z);
      player.update(0.016);
      const isNearCover = g.environment.isNearCover(firstBush.x, firstBush.z);
      const playerHiding = player.isHidingInFoliage;

      // Move out into open field
      player.position.set(0, 0, 0);
      player.update(0.016);
      const openHiding = player.isHidingInFoliage;

      return {
        isNearCover,
        playerHiding,
        openHiding
      };
    `);
    console.log('Vegetation cover result:', coverResult);
    if (!coverResult.isNearCover) throw new Error('Environment should detect proximity to bush cover zone');
    if (!coverResult.playerHiding) throw new Error('Player should be hiding when near vegetation');
    if (coverResult.openHiding) throw new Error('Player should not be hiding in open terrain');
    console.log('✓ PASS: Vegetation and bushes conceal player profile from enemy detection.');

    // ==========================================
    // TEST 6: Awareness States Progression
    // ==========================================
    console.log('\n--- Test 6: Awareness States Progression ---');
    const awarenessProgression = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const enemy = g.enemyManager.getEnemies()[0];
      const player = g.player;

      enemy.awareness = 0;
      enemy.setState('IDLE');
      enemy.idleTimer = 0;
      enemy.position.set(0, 0, 0);
      enemy.groundToTerrain();
      enemy.rotateTowards(0, 10, 10.0);

      // Place player in front of enemy
      player.position.set(0, 0, 6);
      player.groundToTerrain();
      player.keys.forward = false;

      // Frame 1: Unaware -> Suspicious
      enemy.update(0.25, player);
      const state1 = { awareness: enemy.awareness, state: enemy.awarenessState };

      // Frame 2: Suspicious -> Alerted
      enemy.update(0.4, player);
      const state2 = { awareness: enemy.awareness, state: enemy.awarenessState };

      // Frame 3: Alerted -> Engaged
      enemy.update(0.8, player);
      const state3 = { awareness: enemy.awareness, state: enemy.awarenessState, enemyState: enemy.state };

      return { state1, state2, state3 };
    `);
    console.log('Awareness progression states:', awarenessProgression);
    if (awarenessProgression.state1.awareness <= 0) throw new Error('Awareness should rise when in sight');
    if (awarenessProgression.state2.awareness <= awarenessProgression.state1.awareness) throw new Error('Awareness should continue rising');
    if (awarenessProgression.state3.awareness < 1.0) throw new Error('Awareness should max out at 1.0');
    if (awarenessProgression.state3.state !== 'ENGAGED') throw new Error('Awareness state should be ENGAGED');
    if (awarenessProgression.state3.enemyState !== 'CHASE') throw new Error('Enemy should enter CHASE state');
    console.log('✓ PASS: Awareness rises progressively through SUSPICIOUS -> ALERTED -> ENGAGED.');

    // ==========================================
    // TEST 7: Noise Investigation & Last Known Position
    // ==========================================
    console.log('\n--- Test 7: Noise Investigation & Last Known Position ---');
    const noiseInvestigateResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const enemy = g.enemyManager.getEnemies()[1];
      const player = g.player;

      enemy.awareness = 0;
      enemy.setState('IDLE');
      enemy.idleTimer = 0;
      enemy.position.set(30, 0, 30);
      enemy.groundToTerrain();
      enemy.rotateTowards(30, 40, 10.0);

      // Player sprints behind enemy (within 10m noise range)
      player.position.set(30, 0, 22);
      player.groundToTerrain();
      player.currentNoiseRadius = 15.0; // Sprinting noise
      enemy.update(0.2, player);

      const heardAwareness = enemy.awareness;
      const targetPos = { x: enemy.investigationTarget.x, z: enemy.investigationTarget.z };
      const hasTarget = enemy.hasInvestigationTarget;

      return {
        heardAwareness,
        targetPos,
        hasTarget
      };
    `);
    console.log('Noise investigation result:', noiseInvestigateResult);
    if (noiseInvestigateResult.heardAwareness <= 0) throw new Error('Enemy should hear sprint noise');
    if (!noiseInvestigateResult.hasTarget) throw new Error('Enemy should set investigation target to noise source');
    if (Math.abs(noiseInvestigateResult.targetPos.z - 22) > 0.1) throw new Error('Target coordinates should match noise position');
    console.log('✓ PASS: Movement noises alert nearby enemies and trigger location investigation.');

    // ==========================================
    // TEST 8: Breaking LOS & Searching Return to Patrol
    // ==========================================
    console.log('\n--- Test 8: Breaking LOS & Searching Return to Patrol ---');
    const searchResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const enemy = g.enemyManager.getEnemies()[0];
      const player = g.player;

      // Force enemy into chase
      enemy.awareness = 1.0;
      enemy.setState('CHASE');
      enemy.position.set(0, 0, 0);

      // Player teleports far away behind cover
      player.position.set(100, 0, 100);
      enemy.update(0.1, player);

      const stateAfterEscape = enemy.state;
      const awarenessState = enemy.awarenessState;

      // Fast forward search timer
      enemy.update(4.5, player);
      const stateAfterSearch = enemy.state;

      return {
        stateAfterEscape,
        awarenessState,
        stateAfterSearch
      };
    `);
    console.log('Search & escape result:', searchResult);
    if (searchResult.stateAfterEscape !== 'SEARCH') throw new Error('Enemy should transition to SEARCH when player escapes');
    if (searchResult.awarenessState !== 'SEARCHING') throw new Error('Awareness state should be SEARCHING');
    if (searchResult.stateAfterSearch !== 'RETURN' && searchResult.stateAfterSearch !== 'PATROL') {
      throw new Error(`Enemy should return to patrol after searching, got: ${searchResult.stateAfterSearch}`);
    }
    console.log('✓ PASS: Breaking line of sight triggers searching and clean return to patrol.');

    // ==========================================
    // TEST 9: Stealth Takedown Execution & Bonus
    // ==========================================
    console.log('\n--- Test 9: Stealth Takedown Execution & Bonus ---');
    const takedownResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const enemy = g.enemyManager.getEnemies()[2];
      const player = g.player;

      // Setup enemy unaware, facing +Z
      enemy.health = 100;
      enemy.awareness = 0;
      enemy.setState('IDLE');
      enemy.idleTimer = 0;
      enemy.position.set(40, 0, 40);
      enemy.groundToTerrain();
      enemy.rotateTowards(40, 50, 10.0);

      // Place player directly behind enemy within 1.6m
      player.position.set(40, 0, 38.5);
      player.groundToTerrain();
      player.toggleCrouch(true);
      enemy.update(0.016, player);

      const isEligibleBefore = enemy.isEligibleForTakedown;

      // Execute attack swing through combat system
      player.triggerAttack();
      g.combatSystem.update(0.016);

      const enemyHealthAfter = enemy.health;
      const enemyStateAfter = enemy.state;
      const scoreAfter = g.questSystem?.currentQuest?.score || 0;

      return {
        isEligibleBefore,
        enemyHealthAfter,
        enemyStateAfter,
        scoreAfter
      };
    `);
    console.log('Stealth takedown result:', takedownResult);
    if (!takedownResult.isEligibleBefore) throw new Error('Enemy should be eligible for takedown when player is behind');
    if (takedownResult.enemyHealthAfter > 0) throw new Error('Stealth takedown should instantly eliminate enemy');
    if (takedownResult.enemyStateAfter !== 'DEAD') throw new Error('Enemy should enter DEAD state after takedown');
    if (takedownResult.scoreAfter < 500) throw new Error('Stealth takedown should award at least +500 points');
    console.log('✓ PASS: Stealth takedown successfully executes from behind with instant kill and bonus score.');

    // ==========================================
    // TEST 10: Normal Combat Engagement from Front
    // ==========================================
    console.log('\n--- Test 10: Normal Combat Engagement from Front ---');
    const combatResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const enemy = g.enemyManager.getEnemies()[3]; // Grimfang
      const player = g.player;

      enemy.health = 130;
      enemy.awareness = 0;
      enemy.setState('IDLE');
      enemy.idleTimer = 0;
      enemy.position.set(-20, 0, -40);
      enemy.groundToTerrain();
      enemy.rotateTowards(-20, -30, 10.0);

      // Player stands in front of enemy
      player.position.set(-20, 0, -35);
      player.groundToTerrain();
      player.toggleCrouch(false);

      // Enemy spots player
      for (let i = 0; i < 5; i++) {
        enemy.update(0.2, player);
      }

      const enemyState = enemy.state;
      const awareness = enemy.awareness;
      const takedownEligible = enemy.isEligibleForTakedown;

      return {
        enemyState,
        awareness,
        takedownEligible
      };
    `);
    console.log('Normal combat engagement result:', combatResult);
    if (combatResult.awareness < 1.0) throw new Error('Awareness should max out when in front');
    if (combatResult.enemyState !== 'CHASE' && combatResult.enemyState !== 'ATTACK') {
      throw new Error('Enemy should enter active combat (CHASE/ATTACK)');
    }
    if (combatResult.takedownEligible) throw new Error('Takedown should NOT be eligible in front combat');
    console.log('✓ PASS: Frontal encounter properly initiates standard combat state machine.');

    // ==========================================
    // TEST 11: Boss Stealth Takedown & Balancing
    // ==========================================
    console.log('\n--- Test 11: Boss Stealth Balancing & Stagger ---');
    const bossStealthResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getEnemies()[3]; // Grimfang Alpha
      const player = g.player;

      // Set boss unaware facing +Z
      boss.health = 250;
      boss.maxHealth = 250;
      boss.awareness = 0;
      boss.setState('IDLE');
      boss.idleTimer = 0;
      boss.position.set(-20, 0, -40);
      boss.groundToTerrain();
      boss.rotateTowards(-20, -30, 10.0);

      // Reset player attack cooldown & stance from previous tests
      player.isAttacking = false;
      player.attackCooldownTimer = 0;
      player.hasDealtDamageThisSwing = false;

      // Place player behind boss within 1.6m, facing towards the boss (+Z)
      player.position.set(-20, 0, -41.5);
      player.groundToTerrain();
      player.toggleCrouch(true);
      if (player.model) player.model.rotation.y = 0;
      boss.update(0.016, player);

      const isEligibleBefore = boss.isEligibleForTakedown;
      const isBoss = boss.isBoss;

      // Execute attack swing
      player.triggerAttack();
      const isAttackingAfterTrigger = player.isAttacking;
      const attackTimerAfterTrigger = player.attackCooldownTimer;
      const fwd = player.getForwardVector();
      const pPos = player.getPosition();
      const bPos = boss.position;
      const dist = Math.hypot(bPos.x - pPos.x, bPos.z - pPos.z);
      const dot = fwd.x * ((bPos.x - pPos.x) / dist) + fwd.z * ((bPos.z - pPos.z) / dist);

      g.combatSystem.update(0.016);

      const healthAfter = boss.health;
      const stateAfter = boss.state;
      const awarenessAfter = boss.awareness;

      return {
        isBoss,
        isEligibleBefore,
        isAttackingAfterTrigger,
        attackTimerAfterTrigger,
        fwd: { x: fwd.x, z: fwd.z },
        dist,
        dot,
        healthAfter,
        damageTaken: 250 - healthAfter,
        stateAfter,
        awarenessAfter
      };
    `);
    console.log('Boss stealth strike result:', bossStealthResult);
    if (!bossStealthResult.isBoss) throw new Error('Grimfang Alpha should be flagged as boss');
    if (!bossStealthResult.isEligibleBefore) throw new Error('Boss should be eligible for backstab takedown');
    if (bossStealthResult.healthAfter <= 0) throw new Error('Boss should NOT be eliminated in one hit (cannot bypass boss mechanics)');
    if (bossStealthResult.damageTaken < 100) throw new Error('Boss should take heavy critical bonus damage');
    if (bossStealthResult.stateAfter !== 'STUNNED' && bossStealthResult.stateAfter !== 'CHASE') {
      throw new Error(`Boss should enter STUNNED or CHASE state after stealth strike, got: ${bossStealthResult.stateAfter}`);
    }
    console.log('✓ PASS: Boss stealth attack deals critical bonus damage without bypassing boss encounter.');

    console.log('\n======================================================');
    console.log('🏆 ALL 11 STEALTH GAMEPLAY TEST SUITES PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

    cdp.ws.close();
  } finally {
    chromeProcess.kill('SIGKILL');
  }
}

runStealthTests().catch(err => {
  console.error('\n❌ STEALTH TEST SUITE FAILED:', err);
  process.exit(1);
});
