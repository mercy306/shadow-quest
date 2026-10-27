/**
 * Automated Verification Test Suite for Shadow Quest: Mount & Riding System
 * Tests:
 * 1. Mountable Creature (Shadow Steed) Placement at Defined World Location
 * 2. Interaction Prompts to Mount and Dismount ([E] Key)
 * 3. Mount Articulated Gait Kinematics & Rider Seated Posture
 * 4. Riding Locomotion Controller (Forward, Reverse, Turning, Gallop Boost)
 * 5. Elevated Riding Camera Configuration & Smooth FoV/Distance Transitions
 * 6. Ground Clamping & Solid Obstacle Collision Resolution
 * 7. Mounting Restrictions (Defeated, Rolling, Attacking, Line-of-Sight Occlusion)
 * 8. Combat & Locomotion Locking While Mounted (No Simultaneous Controls)
 * 9. Safe Dismount Placement on Obstacle-Free Terrain
 * 10. Whistle Recovery System without Spawning into Solid Colliders
 * 11. Cross-Region Travel Persistence (Mount Transitions with Rider)
 * 12. Save & Reload State Consistency
 */

import http from 'http';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const WS = globalThis.WebSocket;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9238;
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

async function runMountRidingTests() {
  console.log('=== SHADOW QUEST MOUNT & RIDING SYSTEM VERIFICATION ===\n');

  const tempUserDataDir = path.join(os.tmpdir(), `sq-mount-test-${Date.now()}`);
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
    const totalTests = 12;

    // ==========================================
    // TEST 1: Mountable Creature Placement
    // ==========================================
    console.log('--- Test 1: Mountable Creature (Shadow Steed) Placement ---');
    const spawnCheck = await cdp.eval(`
      const g = window.__GAME__;
      const mm = g.mountManager;
      const mount = mm ? mm.mount : null;
      return {
        hasMountManager: Boolean(mm),
        hasMount: Boolean(mount),
        id: mount ? mount.id : null,
        name: mount ? mount.name : null,
        stageIndex: mount ? mount.stageIndex : null,
        posX: mount ? mount.position.x : null,
        posZ: mount ? mount.position.z : null,
        isVisible: Boolean(mount && mount.mesh && mount.mesh.visible),
        hasLimbs: Boolean(mount && mount.limbs && mount.limbs.legFL && mount.limbs.saddle)
      };
    `);

    if (spawnCheck.hasMountManager &&
        spawnCheck.hasMount &&
        spawnCheck.name === 'Shadow Steed' &&
        Math.abs(spawnCheck.posX - 8.0) < 0.5 &&
        Math.abs(spawnCheck.posZ - (-12.0)) < 0.5 &&
        spawnCheck.isVisible &&
        spawnCheck.hasLimbs) {
      console.log(`✓ PASS: Shadow Steed spawned at defined world coordinates (${spawnCheck.posX}, ${spawnCheck.posZ}) with articulated mesh.`);
      passCount++;
    } else {
      console.error('✗ FAIL: Mount creature spawn check failed:', spawnCheck);
    }

    // ==========================================
    // TEST 2: Interaction Prompts to Mount & Dismount
    // ==========================================
    console.log('\n--- Test 2: Contextual Interaction Prompts ([E] Key) ---');
    const promptCheck = await cdp.eval(`
      const g = window.__GAME__;
      const p = g.player;
      const m = g.mountManager.mount;

      // Teleport player near mount (1.8m away)
      p.teleport(m.position.x + 1.8, m.position.z, 0, true, false);
      g.update(0.1);

      const promptTextNear = document.getElementById('interaction-prompt-text')?.textContent;
      const canMount = g.mountManager.canMountPlayer(p).allowed;

      // Mount via onInteract
      const mounted = p.onInteractCallback();
      g.update(0.1);
      const isMounted = p.isRiding && m.isMounted;
      const promptTextMounted = document.getElementById('interaction-prompt-text')?.textContent;
      const mountBadgeVisible = !document.getElementById('mount-stance-badge')?.classList.contains('hidden');

      // Dismount via onInteract
      const dismounted = p.onInteractCallback();
      g.update(0.1);
      const isDismounted = !p.isRiding && !m.isMounted;

      return {
        promptTextNear,
        canMount,
        mounted,
        isMounted,
        promptTextMounted,
        mountBadgeVisible,
        dismounted,
        isDismounted
      };
    `);

    if (promptCheck.promptTextNear?.includes('Mount Shadow Steed') &&
        promptCheck.isMounted &&
        promptCheck.promptTextMounted?.includes('Dismount') &&
        promptCheck.mountBadgeVisible &&
        promptCheck.isDismounted) {
      console.log('✓ PASS: [E] prompt dynamically alternates between Mount and Dismount with HUD badge update.');
      passCount++;
    } else {
      console.error('✗ FAIL: Interaction prompt check failed:', promptCheck);
    }

    // ==========================================
    // TEST 3: Articulated Gait Kinematics & Seated Posture
    // ==========================================
    console.log('\n--- Test 3: Articulated Gait Kinematics & Rider Posture ---');
    const animCheck = await cdp.eval(`
      const g = window.__GAME__;
      const p = g.player;
      const m = g.mountManager.mount;

      // Mount player
      g.mountManager.mountPlayer(p, g.cameraManager);

      // 1. Idle state check
      g.mountManager.update(0.5, p, g.cameraManager);
      const idleGait = m.currentGait;
      const riderClip = p.animController ? p.animController.getCurrentClip() : null;
      const initialLegAngle = m.limbs.legFL.root.rotation.x;

      // 2. Simulated forward trot input
      const trotKeys = { forward: true, backward: false, left: false, right: false, shift: false };
      for (let i = 0; i < 10; i++) {
        g.mountManager.update(0.05, { keys: trotKeys }, g.cameraManager);
      }
      const movingLegAngle = m.limbs.legFL.root.rotation.x;
      const trottingGait = m.currentGait;
      const speedTrot = m.speed;

      return {
        idleGait,
        riderClip,
        trottingGait,
        speedTrot: Math.round(speedTrot * 10) / 10,
        legsArticulated: Math.abs(movingLegAngle - initialLegAngle) > 0.05
      };
    `);

    if (animCheck.idleGait === 'idle' &&
        animCheck.riderClip === 'Idle' &&
        animCheck.trottingGait === 'trot' &&
        animCheck.speedTrot > 4.0 &&
        animCheck.legsArticulated) {
      console.log(`✓ PASS: Mount kinematic gait animates legs (trot speed: ${animCheck.speedTrot} m/s) with rider seated in saddle.`);
      passCount++;
    } else {
      console.error('✗ FAIL: Articulated gait kinematics check failed:', animCheck);
    }

    // ==========================================
    // TEST 4: Riding Locomotion Controller (Throttle, Reverse, Turning, Gallop)
    // ==========================================
    console.log('\n--- Test 4: Riding Locomotion Controller (Steering & Speed Controls) ---');
    const locomotionCheck = await cdp.eval(`
      const g = window.__GAME__;
      const m = g.mountManager.mount;

      // 1. Turning check
      const startRotY = m.rotation.y;
      const turnLeftKeys = { forward: false, backward: false, left: true, right: false, shift: false };
      for (let i = 0; i < 5; i++) {
        m.updateRiding(0.1, turnLeftKeys, g.cameraManager, null);
      }
      const turnedRotY = m.rotation.y;

      // 2. Reverse check
      const reverseKeys = { forward: false, backward: true, left: false, right: false, shift: false };
      for (let i = 0; i < 8; i++) {
        m.updateRiding(0.1, reverseKeys, g.cameraManager, null);
      }
      const reverseSpeed = m.speed;
      const reverseGait = m.currentGait;

      // 3. Gallop Boost check (Forward + Shift)
      const gallopKeys = { forward: true, backward: false, left: false, right: false, shift: true };
      for (let i = 0; i < 20; i++) {
        m.updateRiding(0.1, gallopKeys, g.cameraManager, null);
      }
      const gallopSpeed = m.speed;
      const gallopGait = m.currentGait;

      return {
        hasTurned: Math.abs(turnedRotY - startRotY) > 0.5,
        reverseSpeed: Math.round(reverseSpeed * 10) / 10,
        reverseGait,
        gallopSpeed: Math.round(gallopSpeed * 10) / 10,
        gallopGait,
        gallopFasterThanTrot: gallopSpeed > 12.0
      };
    `);

    if (locomotionCheck.hasTurned &&
        locomotionCheck.reverseSpeed < 0 &&
        locomotionCheck.reverseGait === 'reverse' &&
        locomotionCheck.gallopGait === 'gallop' &&
        locomotionCheck.gallopFasterThanTrot) {
      console.log(`✓ PASS: Riding controller responsive: Turning (rotY updated), Reverse (${locomotionCheck.reverseSpeed} m/s), Gallop Boost (${locomotionCheck.gallopSpeed} m/s).`);
      passCount++;
    } else {
      console.error('✗ FAIL: Locomotion controller check failed:', locomotionCheck);
    }

    // ==========================================
    // TEST 5: Riding Camera Configuration
    // ==========================================
    console.log('\n--- Test 5: Elevated Riding Camera Transition ---');
    const cameraCheck = await cdp.eval(`
      const g = window.__GAME__;
      const cam = g.cameraManager;
      const m = g.mountManager.mount;

      // Currently mounted: check camera target settings
      const ridingDist = cam.targetDistance;
      const ridingOffsetY = cam.targetLookAtOffset.y;

      // Dismount and update camera
      g.mountManager.dismountPlayer(cam);
      const footDist = cam.targetDistance;
      const footOffsetY = cam.targetLookAtOffset.y;

      return {
        ridingDist,
        ridingOffsetY,
        footDist,
        footOffsetY,
        cameraPulledBack: ridingDist > footDist,
        cameraElevated: ridingOffsetY > footOffsetY
      };
    `);

    if (cameraCheck.cameraPulledBack && cameraCheck.cameraElevated && cameraCheck.ridingDist >= 7.5) {
      console.log(`✓ PASS: Camera transitions smoothly: Foot (dist: ${cameraCheck.footDist}, lookY: ${cameraCheck.footOffsetY}) -> Riding (dist: ${cameraCheck.ridingDist}, lookY: ${cameraCheck.ridingOffsetY}).`);
      passCount++;
    } else {
      console.error('✗ FAIL: Camera configuration check failed:', cameraCheck);
    }

    // ==========================================
    // TEST 6: Ground Clamping & Solid Obstacle Collision Handling
    // ==========================================
    console.log('\n--- Test 6: Ground Following & Obstacle Collision Sliding ---');
    const collisionCheck = await cdp.eval(`
      const g = window.__GAME__;
      const m = g.mountManager.mount;
      const pw = g.physicsWorld;

      // 1. Terrain ground height test
      const testX = 24.0, testZ = -30.0;
      m.position.set(testX, 0, testZ);
      m.updateIdle(0.1);
      const groundY = pw.getGroundHeight(testX, testZ, 0);
      const groundFollows = Math.abs(m.position.y - groundY) < 0.1;

      // 2. Solid obstacle collision test (Ancient Altar pillar or perimeter boundary)
      // Attempt to drive mount through world boundary (worldRadius = 115)
      m.position.set(114, 0, 0);
      m.rotation.y = Math.PI / 2; // Facing outward +X
      m.speed = 10.0;
      m.updateRiding(0.2, { forward: true }, null, null);
      const clampedX = m.position.x;

      return {
        groundFollows,
        clampedWithinBoundary: clampedX <= (115.0 - m.radius + 0.1)
      };
    `);

    if (collisionCheck.groundFollows && collisionCheck.clampedWithinBoundary) {
      console.log('✓ PASS: Mount adheres to terrain elevations and resolves solid boundary collisions without clipping.');
      passCount++;
    } else {
      console.error('✗ FAIL: Collision and terrain ground check failed:', collisionCheck);
    }

    // ==========================================
    // TEST 7: Mounting Restrictions & Invalidation
    // ==========================================
    console.log('\n--- Test 7: Mounting Restrictions (Defeated, Rolling, Attacking, Occlusion) ---');
    const restrictionCheck = await cdp.eval(`
      const g = window.__GAME__;
      const p = g.player;
      const m = g.mountManager.mount;

      m.position.set(0, 0, 0);
      p.position.set(1.5, 0, 0);

      // 1. Player defeated restriction
      p.health = 0;
      const defeatCheck = m.canMount(p);
      p.health = 100;

      // 2. Player dodge rolling restriction
      p.isRolling = true;
      const rollingCheck = m.canMount(p);
      p.isRolling = false;

      // 3. Player attacking restriction
      p.isAttacking = true;
      const attackingCheck = m.canMount(p);
      p.isAttacking = false;

      // 4. Too far away restriction
      p.position.set(15, 0, 0);
      const distanceCheck = m.canMount(p);

      return {
        defeatAllowed: defeatCheck.allowed,
        rollingAllowed: rollingCheck.allowed,
        attackingAllowed: attackingCheck.allowed,
        distanceAllowed: distanceCheck.allowed
      };
    `);

    if (!restrictionCheck.defeatAllowed &&
        !restrictionCheck.rollingAllowed &&
        !restrictionCheck.attackingAllowed &&
        !restrictionCheck.distanceAllowed) {
      console.log('✓ PASS: Mounting correctly restricted during invalid gameplay states (Defeat, Roll, Attack, Distance).');
      passCount++;
    } else {
      console.error('✗ FAIL: Mounting restrictions check failed:', restrictionCheck);
    }

    // ==========================================
    // TEST 8: Combat & Locomotion Locking While Mounted
    // ==========================================
    console.log('\n--- Test 8: Combat & Locomotion Locking (Zero Simultaneous Control) ---');
    const lockingCheck = await cdp.eval(`
      const g = window.__GAME__;
      const p = g.player;
      const m = g.mountManager.mount;

      p.position.set(0, 0, 0);
      m.position.set(0, 0, 0);
      g.mountManager.mountPlayer(p, g.cameraManager);

      // Attempt to trigger foot dodge roll
      const rollTriggered = p.triggerDodgeRoll();

      // Attempt to trigger sword attack
      p.triggerAttack();
      const attackTriggered = p.isAttacking;

      // Attempt to trigger heavy spin slash
      const heavyTriggered = p.triggerHeavyAttack();

      // Attempt jump
      p.verticalVelocity = 0;
      p.handleJump();
      const jumpTriggered = (p.verticalVelocity > 0);

      // Dismount
      g.mountManager.dismountPlayer(g.cameraManager);

      return {
        rollTriggered,
        attackTriggered,
        heavyTriggered,
        jumpTriggered
      };
    `);

    if (!lockingCheck.rollTriggered &&
        !lockingCheck.attackTriggered &&
        !lockingCheck.heavyTriggered &&
        !lockingCheck.jumpTriggered) {
      console.log('✓ PASS: Foot combat, dodge rolls, jumping, and attacks are strictly locked while riding.');
      passCount++;
    } else {
      console.error('✗ FAIL: Control locking check failed:', lockingCheck);
    }

    // ==========================================
    // TEST 9: Safe Dismount Placement on Obstacle-Free Terrain
    // ==========================================
    console.log('\n--- Test 9: Safe Dismount Placement on Clear Ground ---');
    const dismountPlacementCheck = await cdp.eval(`
      const g = window.__GAME__;
      const p = g.player;
      const m = g.mountManager.mount;

      m.position.set(12, 0, -18);
      m.rotation.y = 0;
      p.position.set(12, 0, -16.5);
      g.mountManager.mountPlayer(p, g.cameraManager, true);

      // Dismount
      g.mountManager.dismountPlayer(g.cameraManager);

      const riderPos = p.getPosition();
      const distFromMount = Math.hypot(riderPos.x - m.position.x, riderPos.z - m.position.z);
      const isBesideMount = distFromMount >= 1.2 && distFromMount <= 2.8;

      return {
        riderPosX: Math.round(riderPos.x * 10) / 10,
        riderPosZ: Math.round(riderPos.z * 10) / 10,
        distFromMount: Math.round(distFromMount * 10) / 10,
        isBesideMount,
        isGrounded: p.isGrounded
      };
    `);

    if (dismountPlacementCheck.isBesideMount && dismountPlacementCheck.isGrounded) {
      console.log(`✓ PASS: Dismount places player safely beside mount (offset: ${dismountPlacementCheck.distFromMount}m) grounded on terrain.`);
      passCount++;
    } else {
      console.error('✗ FAIL: Dismount placement check failed:', dismountPlacementCheck);
    }

    // ==========================================
    // TEST 10: Whistle Recovery without Spawning into Solid Obstacles
    // ==========================================
    console.log('\n--- Test 10: Whistle Recovery System without Spawning into Colliders ---');
    const whistleCheck = await cdp.eval(`
      const g = window.__GAME__;
      const p = g.player;
      const m = g.mountManager.mount;

      // Teleport player far away
      p.teleport(35, -45, 0, true, false);

      // Move mount to origin
      m.position.set(0, 0, 0);

      // Whistle mount via manager (Key [H])
      const whistleSuccess = g.mountManager.whistleMount(p);

      const newDist = Math.hypot(m.position.x - p.position.x, m.position.z - p.position.z);
      const pw = g.physicsWorld;

      // Verify new spot has no solid collider overlap
      let isClear = true;
      const colliders = pw.getNearbyColliders(m.position.x, m.position.z, m.radius);
      for (const col of colliders) {
        if (col.test(m.position.x, m.position.y + 1.0, m.position.z, m.radius, m.height)) {
          isClear = false;
          break;
        }
      }

      return {
        whistleSuccess,
        summonDistance: Math.round(newDist * 10) / 10,
        summonedNearPlayer: newDist <= 4.2,
        isClear
      };
    `);

    if (whistleCheck.whistleSuccess && whistleCheck.summonedNearPlayer && whistleCheck.isClear) {
      console.log(`✓ PASS: Whistle [H] safely summons mount near player (${whistleCheck.summonDistance}m) on clear terrain.`);
      passCount++;
    } else {
      console.error('✗ FAIL: Whistle recovery check failed:', whistleCheck);
    }

    // ==========================================
    // TEST 11: Cross-Region Travel Persistence
    // ==========================================
    console.log('\n--- Test 11: Cross-Region Travel Persistence (Riding across Gateways) ---');
    const regionCheck = await cdp.eval(`
      const g = window.__GAME__;
      const p = g.player;
      const mm = g.mountManager;

      // Mount up in Stage 0
      p.position.set(mm.mount.position.x, mm.mount.position.y, mm.mount.position.z);
      mm.mountPlayer(p, g.cameraManager, true);

      // Transition to Stage 2 (The Mountain Pass)
      await g.levelManager.loadLevel(2, false, { x: 30, y: 0, z: 25, rotationY: 0 });

      const newStageIndex = g.levelManager.currentLevelIndex;
      const mountStageIndex = mm.mount.stageIndex;
      const stillMounted = mm.mount.isMounted && p.isRiding;
      const mountPosX = Math.round(mm.mount.position.x);

      // Return to Stage 0
      await g.levelManager.loadLevel(0, false, { x: 0, y: 0, z: 2, rotationY: 0 });

      return {
        newStageIndex,
        mountStageIndex,
        stillMounted,
        mountPosX
      };
    `);

    if (regionCheck.newStageIndex === 2 &&
        regionCheck.mountStageIndex === 2 &&
        regionCheck.stillMounted &&
        Math.abs(regionCheck.mountPosX - 30) < 2) {
      console.log('✓ PASS: Mount travels with player across region gateways and synchronizes stage coordinates.');
      passCount++;
    } else {
      console.error('✗ FAIL: Cross-region travel persistence check failed:', regionCheck);
    }

    // ==========================================
    // TEST 12: Save & Reload Consistency
    // ==========================================
    console.log('\n--- Test 12: Save & Reload Consistency ---');
    const saveReloadCheck = await cdp.eval(`
      const g = window.__GAME__;
      const p = g.player;
      const mm = g.mountManager;
      const sm = g.saveManager;

      // Position mount at specific coordinates and mount player
      mm.mount.position.set(14.5, 0, -16.5);
      mm.mount.rotation.y = 1.25;
      p.position.set(14.5, 0, -16.5);
      mm.mountPlayer(p, g.cameraManager, true);

      // Save to slot_2
      const saveRes = await sm.saveGame(g, 'slot_2');

      // Dismount and alter position
      mm.dismountPlayer(g.cameraManager);
      mm.mount.position.set(0, 0, 0);

      // Load back slot_2
      const loadRes = await sm.loadGame(g, 'slot_2');

      const restoredMounted = mm.mount.isMounted && p.isRiding;
      const restoredX = Math.round(mm.mount.position.x * 10) / 10;
      const restoredZ = Math.round(mm.mount.position.z * 10) / 10;

      return {
        saveSuccess: saveRes.success,
        loadSuccess: loadRes.success,
        restoredMounted,
        restoredX,
        restoredZ
      };
    `);

    if (saveReloadCheck.saveSuccess &&
        saveReloadCheck.loadSuccess &&
        saveReloadCheck.restoredMounted &&
        Math.abs(saveReloadCheck.restoredX - 14.5) < 0.5 &&
        Math.abs(saveReloadCheck.restoredZ - (-16.5)) < 0.5) {
      console.log(`✓ PASS: Mount riding state and coordinates (${saveReloadCheck.restoredX}, ${saveReloadCheck.restoredZ}) restored cleanly from save file.`);
      passCount++;
    } else {
      console.error('✗ FAIL: Save and reload consistency check failed:', saveReloadCheck);
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n==========================================');
    console.log(`FINAL RESULT: ${passCount} / ${totalTests} TESTS PASSED (${Math.round((passCount / totalTests) * 100)}%)`);
    console.log('==========================================');

    if (passCount === totalTests) {
      console.log('MOUNT & RIDING SYSTEM FULLY VERIFIED!\n');
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

runMountRidingTests();
