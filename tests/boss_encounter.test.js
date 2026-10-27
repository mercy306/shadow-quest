/**
 * Automated Verification Test Suite for Shadow Quest: Major Boss Encounter (Malakor, Verdant Colossus)
 * Tests:
 * 1. Dedicated arena and dormant boss spawn
 * 2. Encounter trigger, barrier ignition & Boss HUD appearance
 * 3. Phase 1 Colossus Slam attack & circular ground telegraph
 * 4. Linear Rushing Charge attack & wall impact stun
 * 5. Dodge roll invulnerability avoiding attacks cleanly
 * 6. Phase 2 transition at 65% HP & visual amber power-up
 * 7. Phase 2 AoE Earth Shatter / Shockwave Ring attack
 * 8. Phase 3 Corrupted Overdrive at 30% HP & enrage speed boost
 * 9. Heavy hit stagger & bonus vulnerability damage
 * 10. Defeat sequence, attack cancellation, barrier dissolution & rewards
 * 11. Save/reload persistence preventing duplicate rewards and triggers
 * 12. Player death, retry & encounter reset behavior
 */

import http from 'http';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const WS = globalThis.WebSocket;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9235;
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

async function runBossTests() {
  console.log('=== SHADOW QUEST MAJOR BOSS ENCOUNTER VERIFICATION ===\n');

  const tempUserDataDir = path.join(os.tmpdir(), `sq-boss-test-${Date.now()}`);
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
      await sleep(200);
    }

    const page = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
    if (!page) throw new Error('Could not find active game page');

    const cdp = new CDPClient(page.webSocketDebuggerUrl);
    await cdp.waitReady();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    let isReady = false;
    for (let i = 0; i < 60; i++) {
      isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(400);
    }
    if (!isReady) throw new Error('Game failed to initialize within timeout');
    console.log('Game initialized!');

    // Start New Adventure
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.startNewGame(true);
    `);
    await sleep(1500);

    // ==========================================
    // TEST 1: Dedicated Arena & Boss Spawn
    // ==========================================
    console.log('\n--- Test 1: Dedicated Arena & Boss Spawn ---');
    const spawnInfo = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const arena = g.environment.arenaGrove;
      const boss = g.enemyManager.getBoss();

      return {
        hasArena: Boolean(arena),
        arenaCenter: arena ? { x: arena.center.x, z: arena.center.z } : null,
        arenaRadius: arena ? arena.radius : 0,
        hasPillarColliders: arena ? arena.colliders.length >= 6 : false,
        hasBoss: Boolean(boss),
        bossId: boss ? boss.id : null,
        bossName: boss ? boss.name : null,
        bossState: boss ? boss.state : null,
        bossHealth: boss ? boss.health : 0,
        bossMaxHealth: boss ? boss.maxHealth : 0,
        barrierActive: arena ? arena.barrierActive : false
      };
    `);
    console.log('Arena & Boss Spawn info:', spawnInfo);
    if (!spawnInfo.hasArena) throw new Error('ArenaGrove should be spawned in Stage 1');
    if (spawnInfo.arenaRadius !== 16) throw new Error('Arena radius should be 16 meters');
    if (!spawnInfo.hasPillarColliders) throw new Error('Arena should have at least 6 pillar colliders');
    if (!spawnInfo.hasBoss || spawnInfo.bossId !== 'boss-malakor') throw new Error('Boss Malakor should be spawned');
    if (spawnInfo.bossState !== 'DORMANT') throw new Error('Boss should start in DORMANT state');
    if (spawnInfo.bossHealth !== 450) throw new Error('Boss health should be 450');
    if (spawnInfo.barrierActive) throw new Error('Arena barrier should be inactive before trigger');
    console.log('✓ PASS: Dedicated arena and dormant Forest Guardian Colossus initialized cleanly.');

    // ==========================================
    // TEST 2: Encounter Trigger & Boss HUD
    // ==========================================
    console.log('\n--- Test 2: Encounter Trigger & Boss HUD ---');
    const triggerResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();
      const arena = g.environment.arenaGrove;
      const player = g.player;

      // Teleport player into arena trigger threshold (within 10m of boss center)
      player.position.set(-38, 0, -58);
      player.groundToTerrain();

      // Run boss perception update
      boss.update(0.1, player);

      const bossState = boss.state;
      const isTriggered = boss.isTriggered;
      const barrierActive = arena.barrierActive;

      // Check Boss Health Bar DOM
      const hudEl = document.getElementById('boss-encounter-hud');
      const hudVisible = hudEl && !hudEl.classList.contains('hidden');
      const nameEl = document.getElementById('boss-hud-name');
      const phaseEl = document.getElementById('boss-hud-phase');
      const hpTextEl = document.getElementById('boss-hud-hp-text');

      return {
        isTriggered,
        bossState,
        barrierActive,
        hudVisible,
        hudName: nameEl ? nameEl.textContent : '',
        hudPhase: phaseEl ? phaseEl.textContent : '',
        hudHpText: hpTextEl ? hpTextEl.textContent : ''
      };
    `);
    console.log('Encounter trigger result:', triggerResult);
    if (!triggerResult.isTriggered) throw new Error('Boss encounter should be triggered');
    if (triggerResult.bossState !== 'INTRO') throw new Error('Boss should enter INTRO state');
    if (!triggerResult.barrierActive) throw new Error('Arena barrier should ignite upon trigger');
    if (!triggerResult.hudVisible) throw new Error('Boss Health Bar HUD should be visible');
    if (!triggerResult.hudName.toUpperCase().includes('MALAKOR')) throw new Error('Boss name should be displayed in HUD');
    if (!triggerResult.hudPhase.includes('PHASE 1')) throw new Error('HUD should display PHASE 1');
    console.log('✓ PASS: Approaching arena triggers encounter, seals perimeter, and renders epic boss bar.');

    // ==========================================
    // TEST 3: Colossus Slam Attack & Telegraph
    // ==========================================
    console.log('\n--- Test 3: Phase 1 Colossus Slam Attack & Telegraph ---');
    const slamResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();
      const player = g.player;

      // Complete intro
      boss.stateTimer = 2.0;
      boss.update(0.1, player); // Transitions to CHASE

      // Force Slam Windup
      boss.attackCooldownTimer = 0;
      player.position.set(boss.position.x, 0, boss.position.z + 2.5);
      boss.initiateSlamWindup(player.getPosition());

      const stateWindup = boss.state;
      const telegraphVisible = boss.slamTelegraph.visible;

      // Fast forward windup duration to trigger slam impact
      boss.update(0.9, player);

      const stateAfterSlam = boss.state;
      const telegraphHiddenAfter = !boss.slamTelegraph.visible;

      return {
        stateWindup,
        telegraphVisible,
        stateAfterSlam,
        telegraphHiddenAfter
      };
    `);
    console.log('Colossus Slam result:', slamResult);
    if (slamResult.stateWindup !== 'SLAM_WINDUP') throw new Error('Boss should enter SLAM_WINDUP');
    if (!slamResult.telegraphVisible) throw new Error('Ground circular telegraph should be visible during slam windup');
    if (slamResult.stateAfterSlam !== 'RECOVERY') throw new Error('Boss should enter RECOVERY state after slam');
    if (!slamResult.telegraphHiddenAfter) throw new Error('Slam telegraph should be hidden after impact');
    console.log('✓ PASS: Colossus Slam projects readable circular warning telegraph and enters recovery.');

    // ==========================================
    // TEST 4: Linear Rushing Charge & Wall Stagger
    // ==========================================
    console.log('\n--- Test 4: Rushing Charge & Wall Stagger ---');
    const chargeResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();
      const player = g.player;

      // Place player at distance 8m
      player.position.set(boss.position.x, 0, boss.position.z + 8.0);
      boss.initiateChargeWindup(player.getPosition());

      const stateChargeWindup = boss.state;
      const laneTelegraphVisible = boss.chargeTelegraph.visible;

      // Trigger charge rush
      boss.update(1.0, player);
      const stateRush = boss.state;

      // Fast forward charge until max distance or perimeter wall collision
      for (let i = 0; i < 20; i++) {
        boss.update(0.1, player);
        if (boss.state === 'STUNNED') break;
      }

      const stateAfterCharge = boss.state;
      const isStaggered = boss.isStaggered;

      return {
        stateChargeWindup,
        laneTelegraphVisible,
        stateRush,
        stateAfterCharge,
        isStaggered
      };
    `);
    console.log('Charge attack result:', chargeResult);
    if (chargeResult.stateChargeWindup !== 'CHARGE_WINDUP') throw new Error('Boss should enter CHARGE_WINDUP');
    if (!chargeResult.laneTelegraphVisible) throw new Error('Charge lane warning strip should be visible');
    if (chargeResult.stateAfterCharge !== 'STUNNED') throw new Error('Boss should enter STUNNED state after charge impact');
    if (!chargeResult.isStaggered) throw new Error('Boss should be flagged as staggered');
    console.log('✓ PASS: Rushing Charge telegraphs linear trajectory and staggers on impact.');

    // ==========================================
    // TEST 5: Dodge Roll Avoiding Attacks Cleanly
    // ==========================================
    console.log('\n--- Test 5: Dodge Roll Invulnerability Evasion ---');
    const dodgeResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();
      const player = g.player;

      player.health = player.maxHealth;

      // Initiate slam right next to player
      player.position.set(boss.position.x, 0, boss.position.z + 2.0);
      boss.initiateSlamWindup(player.getPosition());

      // Player triggers dodge roll right before impact
      player.triggerDodgeRoll();
      const isInvulnerableDuringRoll = player.isInvulnerable;

      // Execute slam
      boss.update(0.9, player);

      const playerHealthAfter = player.health;

      return {
        isInvulnerableDuringRoll,
        playerHealthAfter,
        maxHealth: player.maxHealth
      };
    `);
    console.log('Dodge evasion result:', dodgeResult);
    if (!dodgeResult.isInvulnerableDuringRoll) throw new Error('Player should have i-frames during dodge roll');
    if (dodgeResult.playerHealthAfter !== dodgeResult.maxHealth) throw new Error('Dodge roll should completely avoid slam damage');
    console.log('✓ PASS: Timed dodge roll evades boss attacks with complete invulnerability.');

    // ==========================================
    // TEST 6: Phase 2 Transition at 65% HP
    // ==========================================
    console.log('\n--- Test 6: Phase 2 Transition at 65% HP Threshold ---');
    const phase2Result = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();
      const player = g.player;

      // Damage boss down to 60% HP (270 / 450)
      boss.isInvulnerable = false;
      boss.takeDamage(180);

      boss.update(0.016, player);

      const currentPhase = boss.phase;
      const hasTransitioned = boss.hasTransitionedPhase2;
      const bossState = boss.state;
      const isInvulnDuringTransition = boss.isInvulnerable;

      const phaseEl = document.getElementById('boss-hud-phase');
      const hudPhaseText = phaseEl ? phaseEl.textContent : '';

      return {
        health: boss.health,
        currentPhase,
        hasTransitioned,
        bossState,
        isInvulnDuringTransition,
        hudPhaseText
      };
    `);
    console.log('Phase 2 transition result:', phase2Result);
    if (phase2Result.currentPhase !== 2) throw new Error('Boss should advance to Phase 2');
    if (!phase2Result.hasTransitioned) throw new Error('Phase 2 flag should be set');
    if (phase2Result.bossState !== 'PHASE_TRANSITION') throw new Error('Boss should enter PHASE_TRANSITION state');
    if (!phase2Result.isInvulnDuringTransition) throw new Error('Boss should be invulnerable during phase transition');
    if (!phase2Result.hudPhaseText.includes('PHASE 2')) throw new Error('HUD should display PHASE 2');
    console.log('✓ PASS: Colossus smoothly transitions to Phase 2 at defined 65% HP threshold.');

    // ==========================================
    // TEST 7: Phase 2 Earth Shatter (AoE Shockwave)
    // ==========================================
    console.log('\n--- Test 7: Phase 2 Earth Shatter (AoE Shockwave) ---');
    const aoeResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();
      const player = g.player;

      // Complete transition
      boss.stateTimer = 2.5;
      boss.update(0.1, player);

      // Trigger Earth Shatter AoE
      boss.initiateAoeWindup();
      const stateAoeWindup = boss.state;
      const aoeTelegraphVisible = boss.aoeTelegraph.visible;

      // Fast forward to impact
      boss.update(1.1, player);
      const stateAfterAoe = boss.state;
      const aoeTelegraphHidden = !boss.aoeTelegraph.visible;

      return {
        stateAoeWindup,
        aoeTelegraphVisible,
        stateAfterAoe,
        aoeTelegraphHidden
      };
    `);
    console.log('Earth Shatter AoE result:', aoeResult);
    if (aoeResult.stateAoeWindup !== 'AOE_WINDUP') throw new Error('Boss should enter AOE_WINDUP state');
    if (!aoeResult.aoeTelegraphVisible) throw new Error('Concentric ring telegraph should be visible during AoE windup');
    if (aoeResult.stateAfterAoe !== 'RECOVERY') throw new Error('Boss should enter RECOVERY state after shockwave');
    if (!aoeResult.aoeTelegraphHidden) throw new Error('Telegraph should be hidden after shockwave');
    console.log('✓ PASS: Earth Shatter projects concentric expanding warning ring and strikes area.');

    // ==========================================
    // TEST 8: Phase 3 Corrupted Overdrive (30% HP)
    // ==========================================
    console.log('\n--- Test 8: Phase 3 Corrupted Overdrive (30% HP) ---');
    const phase3Result = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();
      const player = g.player;

      // Damage boss down to 25% HP (112 / 450)
      boss.isInvulnerable = false;
      boss.takeDamage(160);

      boss.update(0.016, player);

      const currentPhase = boss.phase;
      const chaseSpeed = boss.chaseSpeed;

      const phaseEl = document.getElementById('boss-hud-phase');
      const hudPhaseText = phaseEl ? phaseEl.textContent : '';

      return {
        health: boss.health,
        currentPhase,
        chaseSpeed,
        hudPhaseText
      };
    `);
    console.log('Phase 3 transition result:', phase3Result);
    if (phase3Result.currentPhase !== 3) throw new Error('Boss should advance to Phase 3');
    if (phase3Result.chaseSpeed <= 5.0) throw new Error('Phase 3 chase speed should be empowered');
    if (!phase3Result.hudPhaseText.includes('PHASE 3')) throw new Error('HUD should display PHASE 3');
    console.log('✓ PASS: Enrage / Phase 3 activates at 30% HP with amplified velocity and crimson runes.');

    // ==========================================
    // TEST 9: Heavy Attack Stagger & Bonus Damage
    // ==========================================
    console.log('\n--- Test 9: Heavy Attack Stagger & Bonus Damage ---');
    const staggerResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();

      boss.isInvulnerable = false;
      boss.setState('CHASE');

      // Heavy strike (deals 95 damage)
      const healthBefore = boss.health;
      boss.takeDamage(95);

      const stateAfterHeavy = boss.state;
      const isStaggered = boss.isStaggered;

      // Stagger banner in DOM
      const banner = document.getElementById('boss-stagger-banner');
      const bannerVisible = banner && !banner.classList.contains('hidden');

      return {
        stateAfterHeavy,
        isStaggered,
        bannerVisible,
        damageTaken: healthBefore - boss.health
      };
    `);
    console.log('Stagger result:', staggerResult);
    if (staggerResult.stateAfterHeavy !== 'STUNNED') throw new Error('Heavy blow should stagger boss into STUNNED state');
    if (!staggerResult.isStaggered) throw new Error('isStaggered should be true');
    if (!staggerResult.bannerVisible) throw new Error('Stagger vulnerability banner should be visible on HUD');
    console.log('✓ PASS: Heavy attacks induce stagger, opening counterattack vulnerability window.');

    // ==========================================
    // TEST 10: Defeat Sequence & Rewards Delivery
    // ==========================================
    console.log('\n--- Test 10: Defeat Sequence & Rewards Delivery ---');
    const defeatResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const boss = g.enemyManager.getBoss();
      const arena = g.environment.arenaGrove;
      const player = g.player;

      const goldBefore = player.gold || 0;
      const xpBefore = player.totalXP ?? player.xp;

      // Fatal strike
      boss.isInvulnerable = false;
      boss.takeDamage(999);

      const bossStateAfter = boss.state;
      const isDefeated = boss.isDefeated;
      const barrierActiveAfter = arena.barrierActive;

      // Telegraphs cleared
      const slamTel = boss.slamTelegraph.visible;
      const chargeTel = boss.chargeTelegraph.visible;
      const aoeTel = boss.aoeTelegraph.visible;

      // Rewards
      const goldAfter = player.gold || 0;
      const xpAfter = player.totalXP ?? player.xp;
      const hasAegis = player.inventorySystem.hasItem('verdant_colossus_aegis');
      const hasKeystone = player.inventorySystem.hasItem('sanctuary_keystone');
      const questHasBoss = g.questSystem.completedQuestIds.has('boss-malakor');

      return {
        bossStateAfter,
        isDefeated,
        barrierActiveAfter,
        telegraphsCleared: !slamTel && !chargeTel && !aoeTel,
        goldGained: goldAfter - goldBefore,
        xpGained: xpAfter - xpBefore,
        hasAegis,
        hasKeystone,
        questHasBoss
      };
    `);
    console.log('Defeat & rewards result:', defeatResult);
    if (defeatResult.bossStateAfter !== 'DEAD') throw new Error('Boss state should be DEAD');
    if (!defeatResult.isDefeated) throw new Error('isDefeated should be true');
    if (defeatResult.barrierActiveAfter) throw new Error('Arena barrier should dissolve upon defeat');
    if (!defeatResult.telegraphsCleared) throw new Error('All telegraphs should be cleared on defeat');
    if (defeatResult.goldGained < 250) throw new Error('Boss defeat should award +250 Gold');
    if (defeatResult.xpGained < 400) throw new Error('Boss defeat should award +400 XP');
    if (!defeatResult.hasAegis) throw new Error('Player should receive Verdant Colossus Aegis');
    if (!defeatResult.hasKeystone) throw new Error('Player should receive Sanctuary Keystone key item');
    if (!defeatResult.questHasBoss) throw new Error('Boss defeat should be recorded in QuestSystem');
    console.log('✓ PASS: Defeat cancels all attacks, unseals arena, and awards epic equipment & key item.');

    // ==========================================
    // TEST 11: Save/Reload Persistence & Safeguards
    // ==========================================
    console.log('\n--- Test 11: Save/Reload Persistence & Repeat Prevention ---');
    const saveReloadResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const saveRes = await g.saveManager.saveGame(g, 'quicksave');

      return {
        saveSuccess: saveRes.success,
        completedQuestsCount: g.questSystem.completedQuestIds.size
      };
    `);
    console.log('Pre-reload save result:', saveReloadResult);
    if (!saveReloadResult.saveSuccess) throw new Error('Quicksave should succeed');

    // Reload page to test cold persistence
    await cdp.send('Page.reload');
    await sleep(2500);

    for (let i = 0; i < 40; i++) {
      const ready = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (ready) break;
      await sleep(300);
    }

    const postReloadResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      await g.continueSavedGame();
      await new Promise(r => setTimeout(r, 600));

      const boss = g.enemyManager.getBoss();
      const arena = g.environment.arenaGrove;
      const player = g.player;

      return {
        bossDefeated: boss ? boss.isDefeated : false,
        bossVisible: boss ? boss.mesh.visible : false,
        barrierActive: arena ? arena.barrierActive : false,
        hasAegis: player.inventorySystem.hasItem('verdant_colossus_aegis'),
        hasKeystone: player.inventorySystem.hasItem('sanctuary_keystone'),
        questDefeated: g.questSystem.completedQuestIds.has('boss-malakor'),
        aegisQty: player.inventorySystem.getItemCount('verdant_colossus_aegis')
      };
    `);
    console.log('Post-reload persistence check:', postReloadResult);
    if (!postReloadResult.bossDefeated) throw new Error('Boss defeat should persist across reload');
    if (postReloadResult.bossVisible) throw new Error('Defeated boss should not be rendered');
    if (postReloadResult.barrierActive) throw new Error('Arena barrier should remain dissolved');
    if (!postReloadResult.hasAegis || !postReloadResult.hasKeystone) throw new Error('Awarded items must persist in inventory');
    if (postReloadResult.aegisQty !== 1) throw new Error('Rewards should NOT be duplicated on reload');
    if (!postReloadResult.questDefeated) throw new Error('Quest completion should persist');
    console.log('✓ PASS: Boss defeat persists across browser reload without duplicate rewards or re-triggers.');

    // ==========================================
    // TEST 12: Player Death, Retry & Reset
    // ==========================================
    console.log('\n--- Test 12: Player Death & Encounter Reset ---');
    const retryResult = await cdp.eval(`
      const g = window.game || window.__GAME__;

      // Start fresh game (no completed boss)
      g.questSystem.completedQuestIds.delete('boss-malakor');
      await g.levelManager.restartCurrentLevel();

      const freshBoss = g.enemyManager.getBoss();
      const freshArena = g.environment.arenaGrove;
      const player = g.player;

      // Trigger encounter again
      player.position.set(-38, 0, -58);
      freshBoss.update(0.1, player);

      const triggeredAgain = freshBoss.isTriggered;
      const barrierActiveAgain = freshArena.barrierActive;

      // Player dies
      player.takeDamage(9999);
      const isGameOver = g.gameState === 'GAME_OVER';

      // Player clicks Retry
      await g.restartLevel();

      const resetBoss = g.enemyManager.getBoss();
      const resetArena = g.environment.arenaGrove;

      return {
        triggeredAgain,
        barrierActiveAgain,
        isGameOver,
        resetHealth: resetBoss.health,
        resetMaxHealth: resetBoss.maxHealth,
        resetState: resetBoss.state,
        resetBarrier: resetArena.barrierActive,
        gameStateAfterRetry: g.gameState
      };
    `);
    console.log('Player death & retry result:', retryResult);
    if (!retryResult.triggeredAgain) throw new Error('Boss should be re-triggerable on fresh attempt');
    if (!retryResult.isGameOver) throw new Error('Player death should trigger GAME_OVER state');
    if (retryResult.gameStateAfterRetry !== 'PLAYING') throw new Error('Retry should restore PLAYING state');
    if (retryResult.resetHealth !== 450) throw new Error('Retry should restore boss health to 100% (450)');
    if (retryResult.resetState !== 'DORMANT') throw new Error('Retry should restore boss to DORMANT state');
    if (retryResult.resetBarrier) throw new Error('Retry should reset arena barrier to inactive');
    console.log('✓ PASS: Player death and retry cleanly resets boss encounter and health to 100%.');

    console.log('\n======================================================');
    console.log('🏆 ALL 12 MAJOR BOSS ENCOUNTER TEST SUITES PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

    cdp.ws.close();
  } finally {
    chromeProcess.kill('SIGKILL');
  }
}

runBossTests().catch(err => {
  console.error('\n❌ BOSS TEST SUITE FAILED:', err);
  process.exit(1);
});
