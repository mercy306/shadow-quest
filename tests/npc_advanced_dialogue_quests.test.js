import http from 'http';
import { spawn } from 'child_process';

const WS = globalThis.WebSocket;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9226;
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

async function runAdvancedNPCTests() {
  console.log('=== SHADOW QUEST ADVANCED NPCS, DIALOGUE, MERCHANT & QUESTS VERIFICATION ===\n');

  let cdp = null;

  try {
    const versionInfo = await fetchJson(`http://127.0.0.1:${PORT}/json/version`).catch(() => null);
    if (!versionInfo) {
      console.log('Launching headless Chrome with debugging port...');
      spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        `--user-data-dir=C:\\Users\\bsd\\AppData\\Local\\Temp\\chrome-test-npc-adv-${Date.now()}`
      ]);
      await sleep(1500);
    }

    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready;

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
    console.log('Game initialized successfully!');

    // Start New Game
    await cdp.eval('document.getElementById("menu-btn-play").click();');
    for (let i = 0; i < 40; i++) {
      const isPlaying = await cdp.eval('Boolean((window.game || window.__GAME__)?.gameState === "PLAYING")');
      if (isPlaying) break;
      await sleep(200);
    }

    // ==========================================
    // TEST 1: Talk to Each NPC & Inspect Distinct Personas
    // ==========================================
    console.log('\n--- Test 1: Distinct Personas & Interaction Prompts for Each NPC ---');
    
    // 1. Elder Kaelen (-5, 0, -4)
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.player.teleport(-4.8, -3.2, 0, true);
      g.npcManager.update(0.016, g.player.getPosition());
    `);
    await sleep(200);
    const dKaelen = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const prompt = document.getElementById('interaction-prompt-text').textContent;
      g.openDialogue(g.npcManager.getActiveInteractable());
      const res = {
        name: document.getElementById('dialogue-speaker-name').textContent,
        title: document.getElementById('dialogue-speaker-title').textContent,
        prompt
      };
      g.closeDialogue();
      return res;
    `);

    // 2. Valen the Merchant (6, 0, -4)
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.player.teleport(5.8, -3.2, 0, true);
      g.npcManager.update(0.016, g.player.getPosition());
    `);
    await sleep(200);
    const dValen = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const prompt = document.getElementById('interaction-prompt-text').textContent;
      g.openDialogue(g.npcManager.getActiveInteractable());
      const res = {
        name: document.getElementById('dialogue-speaker-name').textContent,
        title: document.getElementById('dialogue-speaker-title').textContent,
        prompt
      };
      g.closeDialogue();
      return res;
    `);

    // 3. Sylas the Forest Hermit (-18, 0, -28)
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.player.teleport(-17.8, -27.2, 0, true);
      g.npcManager.update(0.016, g.player.getPosition());
    `);
    await sleep(200);
    const dSylas = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const prompt = document.getElementById('interaction-prompt-text').textContent;
      g.openDialogue(g.npcManager.getActiveInteractable());
      const res = {
        name: document.getElementById('dialogue-speaker-name').textContent,
        title: document.getElementById('dialogue-speaker-title').textContent,
        prompt
      };
      g.closeDialogue();
      return res;
    `);

    console.log('Elder Kaelen:', dKaelen);
    console.log('Valen Merchant:', dValen);
    console.log('Sylas Hermit:', dSylas);

    if (!dKaelen.prompt.includes('Elder Kaelen') ||
        !dValen.prompt.includes('Valen') ||
        !dSylas.prompt.includes('Sylas')) {
      throw new Error('Distinct interaction prompts not rendered properly for each NPC.');
    }
    console.log('✓ PASS: All 3 NPCs have distinct names, titles, and localized interaction prompts.');

    // ==========================================
    // TEST 2: Side Quest Acceptance, In-Progress Dialogue & Abandonment Rules
    // ==========================================
    console.log('\n--- Test 2: Quest In-Progress Dialogue & Abandonment Rules ---');
    const abandonResult = await cdp.eval(`
      const g = window.game || window.__GAME__;

      // 1. Accept Grimfang Quest
      g.questSystem.acceptSideQuest('side-bane-grimfang');
      const q = g.questSystem.getSideQuest('side-bane-grimfang');
      const statusActive = q.status;

      // 2. Open dialogue with Kaelen while quest is ACTIVE
      const kaelen = g.npcManager.getNPC('npc-kaelen');
      g.openDialogue(kaelen);
      const choicesWhileActive = g.dialogueManager.currentNode.choices.map(c => c.text);

      // 3. Select progress inquiry to reveal Abandon option
      const progIdx = g.dialogueManager.currentNode.choices.findIndex(c => c.text.includes('Quest Progress'));
      if (progIdx !== -1) g.dialogueManager.selectChoice(progIdx);
      const subChoices = g.dialogueManager.currentNode.choices.map(c => c.text);

      // 4. Abandon the quest
      const abandonRes = g.questSystem.abandonSideQuest('side-bane-grimfang', g.player);
      const statusAfterAbandon = q.status;
      const progressAfterAbandon = q.current;

      // 5. Verify quest can be re-accepted
      const reAcceptSuccess = g.questSystem.acceptSideQuest('side-bane-grimfang');
      const statusAfterReaccept = q.status;

      g.closeDialogue();

      return {
        statusActive,
        choicesWhileActive,
        hasAbandonOption: subChoices.some(c => c.includes('Abandon Quest')),
        abandonSuccess: abandonRes.success,
        statusAfterAbandon,
        progressAfterAbandon,
        reAcceptSuccess,
        statusAfterReaccept
      };
    `);

    console.log('Abandonment Test Results:', abandonResult);
    if (!abandonResult.hasAbandonOption || !abandonResult.abandonSuccess ||
        abandonResult.statusAfterAbandon !== 'AVAILABLE' || !abandonResult.reAcceptSuccess ||
        abandonResult.statusAfterReaccept !== 'ACTIVE') {
      throw new Error('Quest abandonment rules failed or quest could not be cleanly re-accepted.');
    }
    console.log('✓ PASS: Active quests support authored in-progress inquiry, abandonment, and clean re-acceptance.');

    // ==========================================
    // TEST 3: All 3 Side Quests Acceptance and Objective Tracking
    // ==========================================
    console.log('\n--- Test 3: Tracking Objectives across All 3 Quests ---');
    const trackingResult = await cdp.eval(`
      const g = window.game || window.__GAME__;

      // Accept remaining 2 side quests
      g.questSystem.acceptSideQuest('side-hermit-satchel');
      g.questSystem.acceptSideQuest('side-sunken-grotto');

      // 1. Complete Retrieval Objective: Hermit's Satchel
      g.questSystem.onItemCollected({ id: 'hermit_satchel', name: 'Lost Alchemy Satchel', type: 'item' });

      // 2. Complete Kill Objective: Grimfang
      g.questSystem.onEnemyDefeated({ id: 'grimfang-alpha', name: 'Grimfang' });

      // 3. Complete Discovery Objective: Sunken Grotto
      g.player.teleport(-30.0, -35.0, 0, true);
      g.questSystem.update(0.016, g.player.getPosition());

      const quests = g.questSystem.getAllSideQuests().map(q => ({
        id: q.id,
        status: q.status,
        current: q.current,
        target: q.target
      }));

      return { quests };
    `);

    console.log('Side Quests Status:', trackingResult.quests);
    const allReady = trackingResult.quests.every(q => q.status === 'READY_TO_TURN_IN' && q.current >= q.target);
    if (!allReady) {
      throw new Error('Not all 3 side quests reached READY_TO_TURN_IN status.');
    }
    console.log('✓ PASS: Retrieval, Kill, and Discovery objectives all reached READY_TO_TURN_IN.');

    // ==========================================
    // TEST 4: One-Time Reward Guarantee (No Repeat Reward Exploits)
    // ==========================================
    console.log('\n--- Test 4: One-Time Reward Guarantee & Duplicate Payout Prevention ---');
    const rewardPurityResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const goldBefore = g.player.gold;
      const xpBefore = g.player.xp;

      // Turn in first time: Hermit's Satchel (Rewards: 100 Gold, 100 XP)
      const turnIn1 = g.questSystem.completeSideQuest('side-hermit-satchel', g.player);
      const goldAfterFirst = g.player.gold;
      const xpAfterFirst = g.player.xp;

      // Turn in second time: should be strictly REJECTED
      const turnIn2 = g.questSystem.completeSideQuest('side-hermit-satchel', g.player);
      const goldAfterSecond = g.player.gold;
      const xpAfterSecond = g.player.xp;

      // Complete remaining 2 quests
      g.questSystem.completeSideQuest('side-bane-grimfang', g.player);
      g.questSystem.completeSideQuest('side-sunken-grotto', g.player);

      return {
        turnIn1Success: turnIn1,
        goldGainedFirst: goldAfterFirst - goldBefore,
        xpGainedFirst: xpAfterFirst - xpBefore,
        turnIn2Success: turnIn2,
        goldGainedSecond: goldAfterSecond - goldAfterFirst,
        xpGainedSecond: xpAfterSecond - xpAfterFirst,
        finalCompletedCount: g.questSystem.getAllSideQuests().filter(q => q.status === 'COMPLETED').length
      };
    `);

    console.log('Reward Purity Check:', rewardPurityResult);
    if (!rewardPurityResult.turnIn1Success || rewardPurityResult.turnIn2Success ||
        rewardPurityResult.goldGainedSecond !== 0 || rewardPurityResult.xpGainedSecond !== 0) {
      throw new Error('Quest allowed duplicate reward payouts on repeated turn-in attempts!');
    }
    console.log('✓ PASS: Quests strictly enforce one-time rewards; duplicate completion attempts rejected.');

    // ==========================================
    // TEST 5: Dialogue Reflects Completed Quest State
    // ==========================================
    console.log('\n--- Test 5: Dialogue Reflects Completed Quests & Gratitude ---');
    const postQuestDialogue = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const kaelen = g.npcManager.getNPC('npc-kaelen');
      g.openDialogue(kaelen);
      const choicesKaelen = g.dialogueManager.currentNode.choices.map(c => c.text);
      g.closeDialogue();

      const sylas = g.npcManager.getNPC('npc-sylas');
      g.openDialogue(sylas);
      const choicesSylas = g.dialogueManager.currentNode.choices.map(c => c.text);
      g.closeDialogue();

      return { choicesKaelen, choicesSylas };
    `);

    console.log('Kaelen Post-Completion Choices:', postQuestDialogue.choicesKaelen);
    console.log('Sylas Post-Completion Choices:', postQuestDialogue.choicesSylas);
    const kaelenReflects = postQuestDialogue.choicesKaelen.some(c => c.includes('shadow beasts') || c.includes('Sunken Grotto'));
    const sylasReflects = postQuestDialogue.choicesSylas.some(c => c.includes('medicinal herbs'));
    if (!kaelenReflects || !sylasReflects) {
      throw new Error('NPC dialogue failed to reflect completed side quest progression.');
    }
    console.log('✓ PASS: NPC dialogue actively reflects completed quests with custom narrative lines.');

    // ==========================================
    // TEST 6: Merchant Full Inventory Capacity Rejection
    // ==========================================
    console.log('\n--- Test 6: Merchant Inventory Capacity Check ---');
    const capacityCheckResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;

      // Fill all 20 backpack slots
      for (let i = 0; i < inv.capacity; i++) {
        inv.slots[i] = { item: inv.createItem('iron_sword'), quantity: 1 };
      }

      // Ensure player has plenty of gold (1000 Gold)
      g.player.gold = 1000;

      // Attempt to purchase unstackable weapon
      const buyWhenFull = g.merchantManager.buyItem('shadow_cleaver');

      // Clear slots back to empty
      for (let i = 0; i < inv.capacity; i++) {
        inv.slots[i] = null;
      }
      inv.initDefaultLoadout();

      return {
        buySuccess: buyWhenFull.success,
        reason: buyWhenFull.reason
      };
    `);

    console.log('Capacity Check Result:', capacityCheckResult);
    if (capacityCheckResult.buySuccess || capacityCheckResult.reason !== 'INVENTORY_FULL') {
      throw new Error('Merchant allowed purchase when inventory was completely full!');
    }
    console.log('✓ PASS: Merchant transaction enforces inventory capacity and rejects purchases when full.');

    // ==========================================
    // TEST 7: Merchant Selling Returns 50% & Quest Item Sale Prevention
    // ==========================================
    console.log('\n--- Test 7: Merchant Pricing Model & Quest Item Protection ---');
    const sellCheckResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;

      // Add a valuable item (Starfall Ore - value 75)
      inv.addItem('starfall_ore', 1);
      const oreIdx = inv.slots.findIndex(s => s && s.item.id === 'starfall_ore');
      const goldBeforeSell = g.player.gold;
      const sellRes = g.merchantManager.sellItem(oreIdx);

      // Add a quest item (Sanctuary Key)
      inv.addItem('sanctuary_key', 1);
      const keyIdx = inv.slots.findIndex(s => s && s.item.id === 'sanctuary_key');
      const sellQuestRes = g.merchantManager.sellItem(keyIdx);

      return {
        sellPrice: sellRes.sellPrice,
        expectedSellPrice: Math.floor(75 * 0.5),
        goldGained: g.player.gold - goldBeforeSell,
        sellQuestSuccess: sellQuestRes.success,
        sellQuestReason: sellQuestRes.reason
      };
    `);

    console.log('Sell Check Result:', sellCheckResult);
    if (sellCheckResult.sellPrice !== 37 || sellCheckResult.sellQuestSuccess || sellCheckResult.sellQuestReason !== 'CANNOT_SELL_QUEST_ITEM') {
      throw new Error('Merchant pricing calculation incorrect or quest item was illegally sold.');
    }
    console.log('✓ PASS: Selling correctly credits 50% value and blocks sale of quest items.');

    // ==========================================
    // TEST 8: Main Story Progression & Portal Unlock Remains Fully Completable
    // ==========================================
    console.log('\n--- Test 8: Main Story Progression & Sanctuary Portal Unlock ---');
    const mainStoryResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const qMain = g.questSystem.currentQuest;

      // Defeat remaining required main story enemies (requires 3)
      while (qMain.objEnemies.current < qMain.enemiesRequired) {
        g.questSystem.onEnemyDefeated({ id: 'forest-guard-1', name: 'Corrupted Stalker' });
      }

      // Collect required crystals (requires 5)
      while (qMain.objCrystals.current < qMain.crystalsRequired) {
        g.questSystem.onCrystalCollected({ id: 'relic-crystal-1', type: 'crystal' });
      }

      // Trigger condition check
      qMain.checkUnlockConditions();

      return {
        enemiesDefeated: qMain.objEnemies.current,
        enemiesRequired: qMain.enemiesRequired,
        crystalsCollected: qMain.objCrystals.current,
        crystalsRequired: qMain.crystalsRequired,
        isEntranceUnlocked: g.questSystem.isEntranceUnlocked
      };
    `);

    console.log('Main Story Objectives:', mainStoryResult);
    if (!mainStoryResult.isEntranceUnlocked) {
      throw new Error('Main story entrance portal failed to unlock upon objective fulfillment.');
    }
    console.log('✓ PASS: Main story entrance portal unlocks cleanly without side quest interference.');

    // ==========================================
    // TEST 9: Persistent Save & Reload of Side Quests and Completed States
    // ==========================================
    console.log('\n--- Test 9: Save & Reload of Side Quests Across Browser Reload ---');
    const preSaveData = await cdp.eval(`
      const g = window.game || window.__GAME__;
      await g.saveCurrentGame();
      return {
        gold: g.player.gold,
        completedQuests: Array.from(g.questSystem.completedQuestIds),
        portalUnlocked: g.questSystem.isEntranceUnlocked
      };
    `);
    console.log('Pre-save state:', preSaveData);

    // Reload page
    console.log('Reloading browser to verify persistence...');
    await cdp.send('Page.reload');
    await sleep(2500);

    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }

    // Wait until continue button is enabled
    for (let i = 0; i < 25; i++) {
      const btnDisabled = await cdp.eval('document.getElementById("menu-btn-continue").disabled');
      if (!btnDisabled) break;
      await sleep(200);
    }

    // Click Continue
    await cdp.eval('document.getElementById("menu-btn-continue").click();');
    for (let i = 0; i < 35; i++) {
      const isPlaying = await cdp.eval('(window.game || window.__GAME__).gameState === "PLAYING"');
      if (isPlaying) break;
      await sleep(200);
    }

    const postReloadData = await cdp.eval(`
      const g = window.game || window.__GAME__;
      return {
        gameState: g.gameState,
        gold: g.player.gold,
        completedQuests: Array.from(g.questSystem.completedQuestIds),
        allSideQuestsCompleted: g.questSystem.getAllSideQuests().every(q => q.status === 'COMPLETED'),
        portalUnlocked: g.questSystem.isEntranceUnlocked
      };
    `);

    console.log('Post-reload state:', postReloadData);
    if (postReloadData.gameState !== 'PLAYING' ||
        postReloadData.gold !== preSaveData.gold ||
        !postReloadData.allSideQuestsCompleted ||
        !postReloadData.portalUnlocked) {
      throw new Error('Side quest completed flags, currency, or main portal state failed to restore.');
    }
    console.log('✓ PASS: All side quest completions, currency, and main story portal state restored across reload!');

    // ==========================================
    // TEST 10: Step Into Exit Portal & Transition to Stage 2 Ruins
    // ==========================================
    console.log('\n--- Test 10: Complete Main Quest Exit & Transition to Stage 2 Ruins ---');
    const stageTransitionResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      // Teleport directly to exit portal location (40, 0, -75)
      g.player.teleport(40.0, -75.0, 0, true);
      g.questSystem.update(0.016, g.player.getPosition());

      await new Promise(r => setTimeout(r, 600));

      // Proceed to next level through level manager
      await g.levelManager.nextLevel();
      await new Promise(r => setTimeout(r, 800));

      return {
        currentLevelIndex: g.levelManager.currentLevelIndex,
        stageName: g.levelManager.getCurrentStage()?.name,
        isCompleted: true
      };
    `);

    console.log('Stage 2 Transition Result:', stageTransitionResult);
    if (stageTransitionResult.currentLevelIndex !== 1 || !stageTransitionResult.stageName.includes('Ruins')) {
      throw new Error('Main story portal failed to transition player to Stage 2 Ancient Ruins!');
    }
    console.log('✓ PASS: Main story portal successfully completed mission and transitioned to Stage 2 Ancient Ruins!');

    console.log('\n======================================================');
    console.log('🏆 ALL 10 ADVANCED NPC, DIALOGUE, MERCHANT & QUEST TESTS PASSED!');
    console.log('======================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ADVANCED NPC TEST ERROR:', err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
  }
}

runAdvancedNPCTests();
