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

async function runInventoryTests() {
  console.log('=== SHADOW QUEST INVENTORY & EQUIPMENT VERIFICATION ===\n');

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--user-data-dir=C:\\Users\\bsd\\AppData\\Local\\Temp\\chrome-test-inv-${Date.now()}`
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

    console.log(`Navigating to ${TARGET_URL}...`);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2500);

    // Wait for engine initialization
    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }
    console.log('Game initialized!');

    // Start New Game
    await cdp.eval('document.getElementById("menu-btn-play").click();');
    for (let i = 0; i < 40; i++) {
      const isPlaying = await cdp.eval('Boolean((window.game || window.__GAME__)?.gameState === "PLAYING")');
      if (isPlaying) break;
      await sleep(200);
    }

    // ==========================================
    // TEST 1: Initial Loadout & Inventory Screen
    // ==========================================
    console.log('\n--- Test 1: Initial Loadout & UI Screen Opening ---');
    const loadout = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      const eq = inv.equipment;
      return ({
        weapon: eq.weapon ? eq.weapon.name : null,
        armor: eq.armor ? eq.armor.name : null,
        potionSlot: inv.slots[0] ? { name: inv.slots[0].item.name, qty: inv.slots[0].quantity } : null,
        staminaSlot: inv.slots[1] ? { name: inv.slots[1].item.name, qty: inv.slots[1].quantity } : null
      });
    `);
    console.log('Initial loadout:', loadout);
    if (!loadout.weapon || !loadout.armor || !loadout.potionSlot) {
      throw new Error('Initial loadout failed to initialize properly.');
    }
    console.log('✓ PASS: Initial starter loadout correctly equipped and stocked.');

    // Open Inventory Screen with 'I' Key
    console.log('Testing Inventory screen opening...');
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.toggleInventory(true);
    `);
    await sleep(300);

    const invModalState = await cdp.eval(`
      const modal = document.getElementById('modal-inventory');
      const g = window.game || window.__GAME__;
      return ({
        visible: !modal.classList.contains('hidden'),
        isPaused: g.isInventoryOpen,
        playerEnabled: g.player.isEnabled
      });
    `);
    console.log('Inventory open state:', invModalState);
    if (!invModalState.visible || !invModalState.isPaused || invModalState.playerEnabled) {
      throw new Error('Inventory screen must open and pause player gameplay.');
    }
    console.log('✓ PASS: Inventory modal opened and gameplay paused.');

    // Close Inventory
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.toggleInventory(false);
    `);
    await sleep(200);

    // ==========================================
    // TEST 2: Stacking Mechanics
    // ==========================================
    console.log('\n--- Test 2: Item Stacking ---');
    const stackResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      // Add 3 more healing potions (should stack into slot 0)
      const res = inv.addItem('healing_potion', 3);
      return ({
        addSuccess: res.success,
        slot0Qty: inv.slots[0].quantity,
        slot0Id: inv.slots[0].item.id
      });
    `);
    console.log('Stack result:', stackResult);
    if (stackResult.slot0Qty !== 5) {
      throw new Error(`Expected stacked quantity of 5, got: ${stackResult.slot0Qty}`);
    }
    console.log('✓ PASS: Consumable stacked cleanly into existing slot.');

    // ==========================================
    // TEST 3: Unique Items (Weapons & Armor)
    // ==========================================
    console.log('\n--- Test 3: Unique Unstackable Equipment Items ---');
    const uniqueResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      // Add two weapons of the same type
      inv.addItem('shadow_cleaver', 1);
      inv.addItem('shadow_cleaver', 1);

      // Find indices of shadow_cleaver
      const indices = [];
      inv.slots.forEach((s, idx) => {
        if (s && s.item.id === 'shadow_cleaver') indices.push(idx);
      });

      return ({
        count: indices.length,
        slotAUnique: inv.slots[indices[0]].item.uniqueId,
        slotBUnique: inv.slots[indices[1]].item.uniqueId,
        areDistinct: inv.slots[indices[0]].item.uniqueId !== inv.slots[indices[1]].item.uniqueId
      });
    `);
    console.log('Unique items result:', uniqueResult);
    if (uniqueResult.count !== 2 || !uniqueResult.areDistinct) {
      throw new Error('Weapons must not stack and must possess unique instance IDs.');
    }
    console.log('✓ PASS: Weapons occupy separate unique slots as expected.');

    // ==========================================
    // TEST 4: Duplicate Collection Prevention
    // ==========================================
    console.log('\n--- Test 4: Prevent Duplicate Pickups on Rapid Trigger ---');
    const dupResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const cm = g.collectibleManager;
      // Find a world item pickup
      const pickup = cm.collectibles.find(c => c.type === 'item');
      if (!pickup) return ({ found: false });

      // Trigger collect 5 times concurrently
      const r1 = pickup.collect();
      const r2 = pickup.collect();
      const r3 = pickup.collect();
      const r4 = pickup.collect();
      const r5 = pickup.collect();

      return ({
        found: true,
        r1, r2, r3, r4, r5,
        totalSuccesses: [r1, r2, r3, r4, r5].filter(Boolean).length
      });
    `);
    console.log('Duplicate test result:', dupResult);
    if (!dupResult.found || dupResult.totalSuccesses !== 1) {
      throw new Error(`Item was collected ${dupResult.totalSuccesses} times! Duplicate prevention failed.`);
    }
    console.log('✓ PASS: Item pickup prevented duplicate collection on concurrent triggers.');

    // ==========================================
    // TEST 5 & 6: Equipment Swapping & Dynamic Stat System
    // ==========================================
    console.log('\n--- Test 5 & 6: Equipping, Unequipping & Character Stat System ---');
    const statChangeResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;
      const inv = player.inventorySystem;

      const baseDamage = player.baseDamage;
      const baseDefense = player.baseDefense;

      // Stats before equipping high-tier gear
      const initialStats = {
        damage: player.damage,
        defense: player.defense,
        maxHealth: player.maxHealth
      };

      // Add Void Reaver (Weapon, +80 DMG) & Sanctuary Aegis (Armor, +45 DEF, +100 HP)
      inv.addItem('void_reaver', 1);
      inv.addItem('sanctuary_aegis', 1);

      const reaverSlot = inv.slots.findIndex(s => s && s.item.id === 'void_reaver');
      const aegisSlot = inv.slots.findIndex(s => s && s.item.id === 'sanctuary_aegis');

      // Equip them!
      inv.equipItem(reaverSlot, player);
      inv.equipItem(aegisSlot, player);

      const equippedStats = {
        damage: player.damage,
        defense: player.defense,
        maxHealth: player.maxHealth,
        equippedWeapon: inv.equipment.weapon.name,
        equippedArmor: inv.equipment.armor.name
      };

      // Unequip weapon
      inv.unequipItem('weapon', player);

      const afterUnequipStats = {
        damage: player.damage,
        weapon: inv.equipment.weapon
      };

      return ({
        initialStats,
        equippedStats,
        afterUnequipStats,
        damageGained: equippedStats.damage - initialStats.damage,
        defenseGained: equippedStats.defense - initialStats.defense,
        healthGained: equippedStats.maxHealth - initialStats.maxHealth
      });
    `);
    console.log('Stat change results:', statChangeResult);
    if (statChangeResult.equippedStats.equippedWeapon !== 'Void Reaver') {
      throw new Error('Void Reaver was not equipped.');
    }
    if (statChangeResult.equippedStats.equippedArmor !== 'Sanctuary Aegis') {
      throw new Error('Sanctuary Aegis was not equipped.');
    }
    if (statChangeResult.defenseGained <= 0 || statChangeResult.healthGained <= 0) {
      throw new Error('Armor stats were not applied to character stats.');
    }
    if (statChangeResult.afterUnequipStats.damage >= statChangeResult.equippedStats.damage) {
      throw new Error('Unequipping weapon must lower attack damage back to baseline.');
    }
    console.log('✓ PASS: Character stats recalculate dynamically on equip and unequip.');

    // ==========================================
    // TEST 7: Consumable Usage (Health & Stamina Potion)
    // ==========================================
    console.log('\n--- Test 7: Consumable Usage (Healing & Buffs) ---');
    const consumableResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;
      const inv = player.inventorySystem;

      // Damage player
      player.health = 50;

      // Find healing potion slot
      const potSlot = inv.slots.findIndex(s => s && s.item.id === 'healing_potion');
      const qtyBefore = inv.slots[potSlot].quantity;

      // Drink potion
      const useResult = inv.useConsumable(potSlot, player);

      const healthAfter = player.health;
      const qtyAfter = inv.slots[potSlot] ? inv.slots[potSlot].quantity : 0;

      // Test Stamina Potion
      inv.addItem('stamina_potion', 1);
      const stamSlot = inv.slots.findIndex(s => s && s.item.id === 'stamina_potion');
      const baseRunSpeed = player.runSpeed;
      inv.useConsumable(stamSlot, player);
      const boostedRunSpeed = player.runSpeed;

      return ({
        useSuccess: useResult.success,
        healthAfter,
        qtyBefore,
        qtyAfter,
        qtyDecremented: (qtyBefore - qtyAfter) === 1,
        boostedRunSpeed,
        isSpeedHigher: boostedRunSpeed > baseRunSpeed
      });
    `);
    console.log('Consumable result:', consumableResult);
    if (!consumableResult.useSuccess || consumableResult.healthAfter <= 50 || !consumableResult.qtyDecremented) {
      throw new Error('Healing potion did not restore health or decrement stack count.');
    }
    if (!consumableResult.isSpeedHigher) {
      throw new Error('Stamina potion speed buff was not applied.');
    }
    console.log('✓ PASS: Consumable items apply gameplay effects and decrement stack properly.');

    // ==========================================
    // TEST 8: Inventory Limits & Capacity Feedback
    // ==========================================
    console.log('\n--- Test 8: Inventory Limits & Full Capacity Feedback ---');
    const capacityResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;

      // Fill all empty slots with material shards
      for (let i = 0; i < inv.capacity; i++) {
        if (inv.slots[i] === null) {
          inv.slots[i] = {
            item: inv.createItem('ruin_shard'),
            quantity: 1
          };
        }
      }

      const isFull = inv.isFull();
      const canFitNewWeapon = inv.canAddItem('shadow_cleaver', 1);

      // Try to add an unstackable weapon to full inventory
      const addAttempt = inv.addItem('shadow_cleaver', 1);

      return ({
        capacity: inv.capacity,
        isFull,
        canFitNewWeapon,
        addAttemptSuccess: addAttempt.success,
        reason: addAttempt.reason
      });
    `);
    console.log('Capacity result:', capacityResult);
    if (!capacityResult.isFull || capacityResult.canFitNewWeapon || capacityResult.addAttemptSuccess) {
      throw new Error('Inventory did not properly enforce capacity limit.');
    }
    console.log('✓ PASS: Configurable inventory limit enforced and rejected excess items.');

    // ==========================================
    // TEST 9: Quest Items & Crystal Collection Integrity
    // ==========================================
    console.log('\n--- Test 9: Quest Items & Crystal Objective Preservation ---');
    const questItemResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      const cm = g.collectibleManager;
      const qs = g.questSystem;

      // Free one slot and add quest item
      inv.slots[0] = null;
      inv.addItem('sanctuary_key', 1);

      const hasKey = inv.slots.some(s => s && s.item.id === 'sanctuary_key');

      // Verify crystal objective tracking still works 100%
      const crystal = cm.collectibles.find(c => c.type === 'crystal' && !c.isCollected);
      let crystalCollected = false;
      let questCrystalCountBefore = qs.currentQuest.objCrystals.current;
      if (crystal) {
        crystal.collect();
        cm.collectedIds.add(crystal.id);
        qs.onCrystalCollected(crystal);
        crystalCollected = true;
      }
      let questCrystalCountAfter = qs.currentQuest.objCrystals.current;

      return ({
        hasKey,
        crystalCollected,
        questCrystalCountBefore,
        questCrystalCountAfter,
        questProgressed: (questCrystalCountAfter - questCrystalCountBefore) === 1
      });
    `);
    console.log('Quest item & crystal result:', questItemResult);
    if (!questItemResult.hasKey || !questItemResult.questProgressed) {
      throw new Error('Quest item or crystal collection mechanics were broken.');
    }
    console.log('✓ PASS: Quest items stored cleanly; crystal and objective systems fully preserved.');

    // ==========================================
    // TEST 10: Persistent Saving & Reload Verification
    // ==========================================
    console.log('\n--- Test 10: Saving & Loading Inventory/Equipment Across Reload ---');
    // Re-equip a known weapon and armor before saving
    await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;

      // Clear slot 1 & 2
      inv.slots[1] = null;
      inv.slots[2] = null;
      inv.slots[3] = null;

      inv.addItem('shadow_cleaver', 1);
      inv.addItem('shadow_plate', 1);
      inv.addItem('void_talisman', 1);

      const cleaverIdx = inv.slots.findIndex(s => s && s.item.id === 'shadow_cleaver');
      const plateIdx = inv.slots.findIndex(s => s && s.item.id === 'shadow_plate');
      const talismanIdx = inv.slots.findIndex(s => s && s.item.id === 'void_talisman');

      inv.equipItem(cleaverIdx, g.player);
      inv.equipItem(plateIdx, g.player);
      inv.equipItem(talismanIdx, g.player);

      // Save game
      return g.saveCurrentGame();
    `);
    await sleep(500);

    // Reload browser page
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
    for (let i = 0; i < 30; i++) {
      const isPlaying = await cdp.eval('(window.game || window.__GAME__).gameState === "PLAYING"');
      if (isPlaying) break;
      await sleep(200);
    }

    // Verify restored equipment, inventory, and stats
    const restoredData = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const player = g.player;
      const inv = player.inventorySystem;
      return ({
        gameState: g.gameState,
        weapon: inv.equipment.weapon ? inv.equipment.weapon.name : null,
        armor: inv.equipment.armor ? inv.equipment.armor.name : null,
        trinket: inv.equipment.trinket ? inv.equipment.trinket.name : null,
        hasKey: inv.slots.some(s => s && s.item.id === 'sanctuary_key'),
        damage: player.damage,
        defense: player.defense,
        maxHealth: player.maxHealth
      });
    `);
    console.log('Restored inventory & equipment after reload:', restoredData);

    if (restoredData.weapon !== 'Shadow Cleaver') {
      throw new Error(`Weapon not restored properly: ${restoredData.weapon}`);
    }
    if (restoredData.armor !== 'Rune Guard Plate') {
      throw new Error(`Armor not restored properly: ${restoredData.armor}`);
    }
    if (restoredData.trinket !== 'Shadow Veil Talisman') {
      throw new Error(`Trinket not restored properly: ${restoredData.trinket}`);
    }
    if (!restoredData.hasKey) {
      throw new Error('Quest item was not restored in inventory.');
    }
    if (restoredData.damage < 60 || restoredData.defense < 30) {
      throw new Error('Equipped item stats were not recalculated upon load.');
    }

    console.log('✓ PASS: All equipment, backpack slots, quest items, and recalculated stats restored across reload!');

    console.log('\n======================================================');
    console.log('🏆 ALL 10 INVENTORY & EQUIPMENT TEST SUITES PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ INVENTORY TEST RUNNER ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill('SIGKILL');
  }
}

runInventoryTests();
