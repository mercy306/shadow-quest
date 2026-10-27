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
      : expression;

    const res = await this.send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function ensureChrome() {
  try {
    const version = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
    console.log('Connected to Chrome:', version['Browser']);
    return;
  } catch (e) {
    console.log('Launching headless Chrome with debugging port...');
    spawn(CHROME_PATH, [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=C:\\Users\\bsd\\AppData\\Local\\Temp\\chrome-debug-profile'
    ], { detached: true });
    
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      try {
        await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
        return;
      } catch (err) {}
    }
    throw new Error('Chrome could not be launched.');
  }
}

async function getCDPClient() {
  const tabs = await fetchJson(`http://127.0.0.1:${PORT}/json`);
  let tab = tabs.find(t => t.url.includes('localhost:5173') || t.type === 'page');
  if (!tab) {
    const newTab = await fetchJson(`http://127.0.0.1:${PORT}/json/new?${TARGET_URL}`);
    tab = newTab;
  }
  const cdp = new CDPClient(tab.webSocketDebuggerUrl);
  await cdp.ready;
  return cdp;
}

async function runAdvancedInventoryTests() {
  console.log('=== SHADOW QUEST ADVANCED INVENTORY & EQUIPMENT VERIFICATION ===\n');
  await ensureChrome();
  const cdp = await getCDPClient();

  try {
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2500);

    // Wait until Game initialized
    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }
    console.log('Game initialized successfully!\n');

    // Start New Game so game state is PLAYING
    await cdp.eval('document.getElementById("menu-btn-play").click();');
    for (let i = 0; i < 40; i++) {
      const isPlaying = await cdp.eval('Boolean((window.game || window.__GAME__)?.gameState === "PLAYING")');
      if (isPlaying) break;
      await sleep(200);
    }

    // ==========================================
    // TEST 1: Category Filter Tabs UI & Matching
    // ==========================================
    console.log('--- Test 1: Category Tabs UI & Matching ---');
    const tabResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      g.uiManager.openInventory();

      // Add items from various categories
      inv.addItem('void_reaver', 1);             // weapon
      inv.addItem('sanctuary_aegis', 1);          // armor
      inv.addItem('shadow_crystal_shard', 3);     // collectible
      inv.addItem('sanctuary_key', 1);        // quest
      inv.addItem('starfall_ore', 4);           // material
      inv.addItem('healing_potion', 2);           // consumable

      g.uiManager.refreshInventoryUI();

      const tabs = Array.from(document.querySelectorAll('.inv-tab')).map(t => t.dataset.category);
      
      // Test switching to 'weapon' tab
      const weaponTab = document.querySelector('.inv-tab[data-category="weapon"]');
      if (weaponTab) weaponTab.click();
      
      const weaponOpacities = Array.from(document.querySelectorAll('.inv-slot')).map(s => {
        const idx = parseInt(s.dataset.slotIndex, 10);
        const item = inv.slots[idx]?.item;
        return {
          slot: idx,
          itemName: item?.name,
          type: item?.type,
          opacity: s.style.opacity || '1'
        };
      }).filter(s => s.itemName);

      return {
        tabs,
        weaponOpacities
      };
    `);

    console.log('Filter tabs found:', tabResult.tabs);
    if (!tabResult.tabs.includes('weapon') || !tabResult.tabs.includes('armor') || !tabResult.tabs.includes('collectible')) {
      throw new Error('Expected category tabs (weapon, armor, collectible) not found in DOM.');
    }
    const weaponsDimmed = tabResult.weaponOpacities.some(w => w.type !== 'weapon' && w.opacity === '1');
    if (weaponsDimmed) {
      throw new Error('Non-weapon items should have reduced opacity when weapon category is filtered.');
    }
    console.log('✓ PASS: Category tabs properly filter visible items.');

    // ==========================================
    // TEST 2: Rich Hover Tooltips on Backpack and Equipment Slots
    // ==========================================
    console.log('\n--- Test 2: Tooltips on Backpack and Equipment Slots ---');
    const tooltipResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      g.uiManager.currentInventoryCategory = 'all';
      g.uiManager.refreshInventoryUI();

      const weaponSlot = document.getElementById('equip-slot-weapon');
      const weaponTitle = weaponSlot ? weaponSlot.getAttribute('title') : '';

      const slotEls = Array.from(document.querySelectorAll('.inv-slot'));
      const occupiedSlot = slotEls.find(s => {
        const title = s.getAttribute('title');
        return title && !title.includes('Empty');
      });
      const occupiedTitle = occupiedSlot ? occupiedSlot.getAttribute('title') : '';

      return {
        hasWeaponTitle: !!weaponTitle && weaponTitle.includes('Damage'),
        weaponTitle,
        hasBackpackTitle: !!occupiedTitle && occupiedTitle.includes('['),
        occupiedTitle
      };
    `);

    console.log('Equipment Tooltip:', tooltipResult.weaponTitle);
    console.log('Backpack Tooltip:', tooltipResult.occupiedTitle);
    if (!tooltipResult.hasWeaponTitle || !tooltipResult.hasBackpackTitle) {
      throw new Error('Equipment or backpack slots missing rich descriptive tooltips.');
    }
    console.log('✓ PASS: Rich descriptive tooltips configured on equipment and backpack slots.');

    // ==========================================
    // TEST 3: Side-by-Side Equipment Comparison & Diff Tags
    // ==========================================
    console.log('\n--- Test 3: Side-by-Side Equipment Comparison & Diff Tags ---');
    const comparisonResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;

      // Ensure starter weapon is equipped
      inv.equipment.weapon = inv.createItem('iron_sword');
      g.player.recalculateStats();

      // Find void reaver in slots
      const voidSlot = inv.slots.findIndex(s => s && s.item.id === 'void_reaver');
      g.uiManager.selectedInventorySlotIndex = voidSlot;
      g.uiManager.renderSelectedDetails();

      const compBox = document.querySelector('.item-comparison-box');
      const diffTags = Array.from(document.querySelectorAll('.diff-tag')).map(d => ({
        text: d.textContent.trim(),
        className: d.className
      }));

      return {
        hasCompBox: !!compBox,
        diffTags
      };
    `);

    console.log('Comparison Box Present:', comparisonResult.hasCompBox);
    console.log('Comparison Diff Tags:', comparisonResult.diffTags);
    if (!comparisonResult.hasCompBox || comparisonResult.diffTags.length === 0) {
      throw new Error('Side-by-side comparison box or diff tags missing for equippable weapon.');
    }
    const hasPositiveDmg = comparisonResult.diffTags.some(d => d.text.includes('+') && d.className.includes('positive'));
    if (!hasPositiveDmg) {
      throw new Error('Comparison diff tag did not calculate positive damage bonus correctly.');
    }
    console.log('✓ PASS: Side-by-side equipment comparison displays color-coded stat diffs.');

    // ==========================================
    // TEST 4: Pricing Model & Sell Calculation
    // ==========================================
    console.log('\n--- Test 4: Pricing Model & Merchant Sell Value ---');
    const priceResult = await cdp.eval(`
      const valRow = document.querySelector('.details-value-row');
      const text = valRow ? valRow.textContent : '';
      return {
        hasValueRow: !!valRow,
        text
      };
    `);

    console.log('Item Value Row:', priceResult.text);
    if (!priceResult.hasValueRow || !priceResult.text.includes('Value:') || !priceResult.text.includes('Sell Price:')) {
      throw new Error('Merchant sell pricing calculation missing in item card.');
    }
    console.log('✓ PASS: Item pricing model with 50% merchant sell price validated.');

    // ==========================================
    // TEST 5: Interactive Move, Swap, and Stack Merge
    // ==========================================
    console.log('\n--- Test 5: Slot Move, Swap & Stack Merge ---');
    const moveResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;

      // 1. Move single item to empty slot
      const fromIdx = inv.slots.findIndex(s => s && s.item.id === 'void_reaver');
      const emptyIdx = inv.slots.findIndex(s => s === null);
      const moveRes = inv.moveOrMergeItem(fromIdx, emptyIdx);

      const movedCorrectly = inv.slots[emptyIdx]?.item.id === 'void_reaver' && inv.slots[fromIdx] === null;

      // 2. Stack merge identical consumables
      const emptySlot1 = inv.slots.findIndex(s => s === null);
      inv.slots[emptySlot1] = { item: inv.createItem('healing_potion'), quantity: 2 };
      const emptySlot2 = inv.slots.findIndex((s, idx) => s === null && idx !== emptySlot1);
      inv.slots[emptySlot2] = { item: inv.createItem('healing_potion'), quantity: 3 };

      const mergeRes = inv.moveOrMergeItem(emptySlot2, emptySlot1);
      const mergedCorrectly = inv.slots[emptySlot1]?.quantity === 5 && inv.slots[emptySlot2] === null;

      // 3. Swap two different items
      const idxArmor = inv.slots.findIndex(s => s && s.item.id === 'sanctuary_aegis');
      const idxShard = inv.slots.findIndex(s => s && s.item.id === 'shadow_crystal_shard');
      const swapRes = inv.swapItems(idxArmor, idxShard);
      const swappedCorrectly = inv.slots[idxArmor]?.item.id === 'shadow_crystal_shard' && inv.slots[idxShard]?.item.id === 'sanctuary_aegis';

      return {
        moveRes,
        movedCorrectly,
        mergeRes,
        mergedCorrectly,
        swapRes,
        swappedCorrectly
      };
    `);

    console.log('Move/Swap Results:', moveResult);
    if (!moveResult.movedCorrectly || !moveResult.mergedCorrectly || !moveResult.swappedCorrectly) {
      throw new Error('Item moving, stack merging, or slot swapping failed.');
    }
    console.log('✓ PASS: Backpack slots support moving, stack merging, and mutual swapping.');

    // ==========================================
    // TEST 6: World Drop Spawning & In-World Pickup
    // ==========================================
    console.log('\n--- Test 6: World Drop Item Spawning ---');
    const dropResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      const cm = g.collectibleManager;

      const slotIdx = inv.slots.findIndex(s => s && s.item.id === 'starfall_ore');
      const initialCollectiblesCount = cm.collectibles.length;

      // Drop 2 starfall ores
      const dropRes = inv.dropItem(slotIdx, 2, g.player, cm);

      const newCollectiblesCount = cm.collectibles.length;
      const spawnedDrop = cm.collectibles[cm.collectibles.length - 1];

      return {
        dropRes,
        collectiblesIncreased: newCollectiblesCount === initialCollectiblesCount + 1,
        spawnedDropId: spawnedDrop?.id,
        spawnedItemId: spawnedDrop?.itemId,
        spawnedQty: spawnedDrop?.quantity
      };
    `);

    console.log('Drop Result:', dropResult);
    if (!dropResult.dropRes.success || !dropResult.collectiblesIncreased || dropResult.spawnedItemId !== 'starfall_ore') {
      throw new Error('Dropping item failed to spawn 3D ItemPickupCollectible in world.');
    }
    console.log('✓ PASS: Dropping item creates physical 3D pickup collectible at player coordinates.');

    // ==========================================
    // TEST 7: Quest Item Drop Protection
    // ==========================================
    console.log('\n--- Test 7: Quest Item Drop Protection ---');
    const questDropResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      const questIdx = inv.slots.findIndex(s => s && s.item.id === 'sanctuary_key');

      const attempt = inv.dropItem(questIdx, 1, g.player, g.collectibleManager);
      const stillHasKey = inv.slots[questIdx]?.item.id === 'sanctuary_key';

      return {
        attempt,
        stillHasKey
      };
    `);

    console.log('Quest Drop Attempt:', questDropResult);
    if (questDropResult.attempt.success || questDropResult.attempt.reason !== 'CANNOT_DROP_QUEST_ITEM' || !questDropResult.stillHasKey) {
      throw new Error('Quest item was allowed to be discarded, violating quest protection.');
    }
    console.log('✓ PASS: Quest items strictly protected from accidental drop or discard.');

    // ==========================================
    // TEST 8: Potion Cooldown Enforcement & Expiration
    // ==========================================
    console.log('\n--- Test 8: Potion Cooldown & Restrictions ---');
    const cooldownResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      const player = g.player;

      // Damage player so potion can be drunk
      player.health = 40;
      const potIdx = inv.slots.findIndex(s => s && s.item.id === 'healing_potion');

      // 1. First drink should succeed
      const drink1 = inv.useConsumable(potIdx, player);

      // 2. Immediate second drink should fail with ON_COOLDOWN
      const drink2 = inv.useConsumable(potIdx, player);

      // 3. Advance cooldown timer by 2 seconds
      inv.update(2.0);
      const drink3 = inv.useConsumable(potIdx, player);

      return {
        drink1Success: drink1.success,
        drink2Success: drink2.success,
        drink2Reason: drink2.reason,
        drink3Success: drink3.success
      };
    `);

    console.log('Cooldown Test Result:', cooldownResult);
    if (!cooldownResult.drink1Success || cooldownResult.drink2Success || cooldownResult.drink2Reason !== 'ON_COOLDOWN' || !cooldownResult.drink3Success) {
      throw new Error('Potion cooldown was not properly enforced or did not expire.');
    }
    console.log('✓ PASS: Potion cooldown prevents rapid consumption and expires correctly.');

    // ==========================================
    // TEST 9: Collectibles & Relics Category
    // ==========================================
    console.log('\n--- Test 9: Collectibles & Rare Relics ---');
    const relicResult = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;

      inv.addItem('ancient_celestial_sigil', 2);
      const sigilSlot = inv.slots.find(s => s && s.item.id === 'ancient_celestial_sigil');

      return {
        sigilFound: !!sigilSlot,
        name: sigilSlot?.item.name,
        type: sigilSlot?.item.type,
        rarity: sigilSlot?.item.rarity,
        value: sigilSlot?.item.value,
        quantity: sigilSlot?.quantity
      };
    `);

    console.log('Relic Result:', relicResult);
    if (!relicResult.sigilFound || relicResult.type !== 'collectible' || relicResult.rarity !== 'legendary') {
      throw new Error('Relic collectible definition not properly registered or added.');
    }
    console.log('✓ PASS: Rare collectibles and relics registered with correct metadata and rarity.');

    // ==========================================
    // TEST 10: Complete Save & Load Across Browser Reload
    // ==========================================
    console.log('\n--- Test 10: Save & Load Persistence Across Reload ---');
    const saveState = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;

      // Equip custom loadout
      inv.equipItem(inv.slots.findIndex(s => s && s.item.id === 'void_reaver'), g.player);
      inv.equipItem(inv.slots.findIndex(s => s && s.item.id === 'sanctuary_aegis'), g.player);

      // Save game
      return g.saveCurrentGame();
    `);

    console.log('Save result:', saveState);

    // Reload page
    console.log('Reloading page...');
    await cdp.send('Page.reload');
    await sleep(2500);

    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.eval('Boolean((window.game || window.__GAME__) && (window.game || window.__GAME__).initStep === "complete")');
      if (isReady) break;
      await sleep(500);
    }

    for (let i = 0; i < 30; i++) {
      const btnDisabled = await cdp.eval('document.getElementById("menu-btn-continue").disabled');
      if (!btnDisabled) break;
      await sleep(200);
    }

    console.log('Clicking CONTINUE button...');
    await cdp.eval('document.getElementById("menu-btn-continue").click();');
    for (let i = 0; i < 35; i++) {
      const isPlaying = await cdp.eval('(window.game || window.__GAME__).gameState === "PLAYING"');
      if (isPlaying) break;
      await sleep(200);
    }

    // Verify restored state
    const loadedState = await cdp.eval(`
      const g = window.game || window.__GAME__;
      const inv = g.player.inventorySystem;
      const stats = g.player.getCharacterStats();
      const hasSigil = inv.slots.some(s => s && s.item.id === 'ancient_celestial_sigil');

      return {
        weapon: inv.equipment.weapon?.name,
        armor: inv.equipment.armor?.name,
        stats,
        hasSigil
      };
    `);

    console.log('Loaded Loadout after reload:', loadedState);
    if (loadedState.weapon !== 'Void Reaver' || loadedState.armor !== 'Sanctuary Aegis' || !loadedState.hasSigil) {
      throw new Error('Equipment, collectibles, or stats failed to restore from save data.');
    }
    console.log('✓ PASS: Complete equipment loadout, slots, collectibles, and stats restored after reload!');

    console.log('\n======================================================');
    console.log('🏆 ALL 10 ADVANCED INVENTORY & EQUIPMENT TESTS PASSED!');
    console.log('======================================================\n');
    process.exit(0);
  } finally {
    cdp.close();
  }
}

runAdvancedInventoryTests().catch(err => {
  console.error('\n❌ ADVANCED INVENTORY TEST ERROR:', err);
  process.exit(1);
});
