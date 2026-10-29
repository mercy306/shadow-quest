/**
 * InventorySystem.js - Complete Inventory and Equipment System for Shadow Quest
 * Supports stacking, unique equipment items, rarity tiers, stat calculation,
 * consumable usage, and persistent state serialization.
 */

export const ItemType = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  TRINKET: 'trinket',
  CONSUMABLE: 'consumable',
  POTION: 'consumable',
  MATERIAL: 'material',
  QUEST: 'quest',
  COLLECTIBLE: 'collectible'
};

export const ItemRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

export const RARITY_CONFIG = {
  [ItemRarity.COMMON]: { name: 'Common', color: '#94a3b8', border: '#64748b' },
  [ItemRarity.UNCOMMON]: { name: 'Uncommon', color: '#22c55e', border: '#16a34a' },
  [ItemRarity.RARE]: { name: 'Rare', color: '#38bdf8', border: '#0284c7' },
  [ItemRarity.EPIC]: { name: 'Epic', color: '#c084fc', border: '#9333ea' },
  [ItemRarity.LEGENDARY]: { name: 'Legendary', color: '#fbbf24', border: '#d97706' }
};

export const ITEM_DATABASE = {
  // --- WEAPONS (የኢትዮጵያ ሾተልና ጦር) ---
  iron_sword: {
    id: 'iron_sword',
    name: 'ሾተል (Axumite Steel Shotel)',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    icon: '⚔️',
    description: 'Iconic curved Ethiopian sickle sword forged by Axumite masters. Curves past enemy defenses.',
    stats: { damage: 35 },
    value: 50,
    stackable: false
  },
  shadow_cleaver: {
    id: 'shadow_cleaver',
    name: 'የነብር ሾተል (Simien Shadow Shotel)',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    icon: '🗡️',
    description: 'Forged from Simien obsidian and tempered in mountain springs. Slices through armor like a phantom.',
    stats: { damage: 55 },
    value: 180,
    stackable: false
  },
  void_reaver: {
    id: 'void_reaver',
    name: 'የሰለሞን ሾተል (Imperial Shotel of Sheba)',
    type: ItemType.WEAPON,
    rarity: ItemRarity.EPIC,
    icon: '⚡',
    description: 'Ancient royal curved blade inscribed with Ge’ez runes. Inflicts thunderous damage upon evil.',
    stats: { damage: 80 },
    value: 350,
    stackable: false
  },

  // --- ARMOR & SHIELDS (የኢትዮጵያ ካባና ጋሻ) ---
  adventurer_tunic: {
    id: 'adventurer_tunic',
    name: 'የጥበብ ካባ (Tibeb Warrior Shamma)',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    icon: '🥋',
    description: 'Traditional Ethiopian woven white cotton robe with hand-embroidered green, yellow, and red borders.',
    stats: { defense: 10, maxHealth: 20 },
    value: 60,
    stackable: false
  },
  shadow_plate: {
    id: 'shadow_plate',
    name: 'የነሐስ ጋሻ (Embossed Bronze Gasha)',
    type: ItemType.ARMOR,
    rarity: ItemRarity.RARE,
    icon: '🛡️',
    description: 'Conical hardened ox-hide warrior shield reinforced with concentric bronze rings and raised Kubet boss.',
    stats: { defense: 25, maxHealth: 50 },
    value: 220,
    stackable: false
  },
  sanctuary_aegis: {
    id: 'sanctuary_aegis',
    name: 'የንጉሥ ጋሻ (Imperial Axumite Gold Gasha)',
    type: ItemType.ARMOR,
    rarity: ItemRarity.EPIC,
    icon: '⚜️',
    description: 'Consecrated royal warrior shield plated with pure Axumite gold filigree and crimson velvet backing.',
    stats: { defense: 45, maxHealth: 100 },
    value: 400,
    stackable: false
  },
  verdant_colossus_aegis: {
    id: 'verdant_colossus_aegis',
    name: 'የአርዌ ጋሻ (Dragon Scale Gasha of Arwe)',
    type: ItemType.ARMOR,
    rarity: ItemRarity.EPIC,
    icon: '🛡️',
    description: 'Forged from the mythical serpent scales and ancient core of the legendary Arwe. Grants +40 Max HP and +20 Defense.',
    stats: { defense: 20, maxHealth: 40 },
    value: 300,
    stackable: false
  },
  lion_gofere_headdress: {
    id: 'lion_gofere_headdress',
    name: 'የአንበሳ ጎፈሬ (Imperial Lion Mane Gofere)',
    type: ItemType.ARMOR,
    rarity: ItemRarity.LEGENDARY,
    icon: '🦁',
    description: 'Regal Ethiopian warrior headdress crafted from the mane of a black-maned Abyssinian lion, worn exclusively by victorious champions. Grants +30 Defense, +20 Damage, and +60 Max HP.',
    stats: { defense: 30, damage: 20, maxHealth: 60 },
    value: 550,
    stackable: false
  },

  // --- TRINKETS / RELICS (የኢትዮጵያ ቅርሶችና ክታቦች) ---
  meskel_cross_relic: {
    id: 'meskel_cross_relic',
    name: 'የብር መስቀል (Axumite Silver Hand Cross)',
    type: ItemType.TRINKET,
    rarity: ItemRarity.EPIC,
    icon: '✝️',
    description: 'Intricately filigreed Axumite silver blessing cross with sacred Ge’ez inscriptions. Grants +25 Defense and +40 Max HP.',
    stats: { defense: 25, maxHealth: 40 },
    value: 320,
    stackable: false
  },
  void_talisman: {
    id: 'void_talisman',
    name: 'የክታብ ሐብል (Axumite Kitab Talisman)',
    type: ItemType.TRINKET,
    rarity: ItemRarity.RARE,
    icon: '🧿',
    description: 'Traditional protective leather talisman scroll inscribed with ancestral warding blessings. Grants +15 Defense.',
    stats: { defense: 15 },
    value: 150,
    stackable: false
  },
  radiant_crystal_heart: {
    id: 'radiant_crystal_heart',
    name: 'Radiant Crystal Heart',
    type: ItemType.TRINKET,
    rarity: ItemRarity.LEGENDARY,
    icon: '💎',
    description: 'A pure pulsating crystalline core. Grants +20 Attack Damage and +35 Max HP.',
    stats: { damage: 20, maxHealth: 35 },
    value: 500,
    stackable: false
  },

  // --- CONSUMABLES & TRADITIONAL ETHIOPIAN CUISINE (የኢትዮጵያ ባህላዊ ምግቦችና መጠጦች) ---
  injera_doro_wat: {
    id: 'injera_doro_wat',
    name: 'እንጀራ በዶሮ ወጥ (Injera with Doro Wat)',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.EPIC,
    icon: '🍲',
    description: 'Iconic Ethiopian feast: sourdough teff flatbread with slow-simmered chicken and spicy berbere sauce. Restores 90 HP and grants +15 Attack Damage for 60s.',
    stats: { heal: 90, damageBoost: 15, duration: 60 },
    value: 75,
    stackable: true,
    maxStack: 5
  },
  tej_honey_mead: {
    id: 'tej_honey_mead',
    name: 'ንጉሣዊ ጠጅ (Imperial Tej Honey Mead)',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.RARE,
    icon: '🍯',
    description: 'Ancient royal honey mead brewed with gesho leaves, served in a glass Berle flask. Restores 65 HP and grants +30% Sprint Speed for 35s.',
    stats: { heal: 65, speedBoost: 1.30, duration: 35 },
    value: 45,
    stackable: true,
    maxStack: 10
  },
  ethiopian_bunna: {
    id: 'ethiopian_bunna',
    name: 'የሐበሻ ቡና (Traditional Highland Bunna)',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    icon: '☕',
    description: 'Freshly roasted highland coffee poured from a clay Jebena with fragrant Tena Adam rue. Grants +40% Swift Sprint speed for 25s.',
    stats: { speedBoost: 1.40, duration: 25 },
    value: 30,
    stackable: true,
    maxStack: 15
  },
  kolo_snack: {
    id: 'kolo_snack',
    name: 'ቆሎ (Roasted Highland Kolo)',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    icon: '🌾',
    description: 'Nutritious roasted barley, chickpeas, and peanuts. Restores 35 HP instantly.',
    stats: { heal: 35 },
    value: 15,
    stackable: true,
    maxStack: 20
  },
  healing_potion: {
    id: 'healing_potion',
    name: 'የስሜን መድኃኒት (Simien Healing Elixir)',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    icon: '🧪',
    description: 'Brewed from wild mountain sage and aloe. Restores 45 Health Points immediately.',
    stats: { heal: 45 },
    value: 25,
    stackable: true,
    maxStack: 10
  },
  greater_healing_potion: {
    id: 'greater_healing_potion',
    name: 'የቅዱስ ጸበል ጠል (Consecrated Tsebel Nectar)',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.RARE,
    icon: '🏺',
    description: 'Sacred holy spring water from Lalibela. Fully restores 100 Health Points.',
    stats: { heal: 100 },
    value: 60,
    stackable: true,
    maxStack: 5
  },
  stamina_potion: {
    id: 'stamina_potion',
    name: 'የዋላ ብርታት (Highland Walia Tonic)',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    icon: '🍶',
    description: 'Increases sprint speed by 25% for 20 seconds.',
    stats: { speedBoost: 1.25, duration: 20 },
    value: 35,
    stackable: true,
    maxStack: 10
  },

  // --- CRAFTING MATERIALS ---
  shadow_essence: {
    id: 'shadow_essence',
    name: 'Shadow Essence',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.UNCOMMON,
    icon: '🔮',
    description: 'Volatile magical residue harvested from vanquished shadow guardians.',
    value: 50,
    stackable: true,
    maxStack: 99
  },
  starfall_ore: {
    id: 'starfall_ore',
    name: 'Starfall Ore',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.RARE,
    icon: '🪨',
    description: 'Dense glowing meteorite ore required for sacred weapon forging.',
    value: 75,
    stackable: true,
    maxStack: 99
  },
  ruin_shard: {
    id: 'ruin_shard',
    name: 'Sanctum Stone Shard',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    icon: '🧱',
    description: 'Ancient masonry carved with celestial motifs. Useful for crafting.',
    value: 30,
    stackable: true,
    maxStack: 99
  },

  // --- QUEST ITEMS ---
  hermit_satchel: {
    id: 'hermit_satchel',
    name: 'Lost Alchemy Satchel',
    type: ItemType.QUEST,
    rarity: ItemRarity.RARE,
    icon: '👝',
    description: 'Sylas the Hermit’s leather satchel containing rare curative mosses and notes.',
    value: 0,
    stackable: false
  },
  sanctuary_keystone: {
    id: 'sanctuary_keystone',
    name: 'Sanctuary Keystone',
    type: ItemType.QUEST,
    rarity: ItemRarity.LEGENDARY,
    icon: '🗝️',
    description: 'An ancient pulsating heart stone left behind by Malakor. Resonates with the Altar Portal.',
    value: 0,
    stackable: false
  },
  sanctuary_key: {
    id: 'sanctuary_key',
    name: 'Ancient Sanctuary Key',
    type: ItemType.QUEST,
    rarity: ItemRarity.RARE,
    icon: '🗝️',
    description: 'An ornate bronze key carved with sunburst glyphs. Unlocks the sanctum vault.',
    value: 0,
    stackable: false
  },
  sealed_scroll: {
    id: 'sealed_scroll',
    name: 'Elder Glyphs Scroll',
    type: ItemType.QUEST,
    rarity: ItemRarity.UNCOMMON,
    icon: '📜',
    description: 'Sacred parchment containing translations of the ancient ruins architecture.',
    value: 0,
    stackable: false
  },

  // --- COLLECTIBLES ---
  shadow_crystal_shard: {
    id: 'shadow_crystal_shard',
    name: 'Shadow Crystal Shard',
    type: ItemType.COLLECTIBLE,
    rarity: ItemRarity.RARE,
    icon: '💠',
    description: 'A pure extracted facet of ancient shadow crystal. Highly sought after by collectors and merchants.',
    value: 120,
    stackable: true,
    maxStack: 10
  },
  ancient_celestial_sigil: {
    id: 'ancient_celestial_sigil',
    name: 'Celestial Guardian Sigil',
    type: ItemType.COLLECTIBLE,
    rarity: ItemRarity.LEGENDARY,
    icon: '🔯',
    description: 'A pristine golden token carried by the high archons of the Ancient Sanctum.',
    value: 300,
    stackable: true,
    maxStack: 5
  }
};

export const ItemCatalog = ITEM_DATABASE;

export class InventorySystem {
  constructor(options = {}) {
    this.capacity = options.capacity || 20;
    this.gold = typeof options.gold === 'number' ? options.gold : 150;
    this.slots = new Array(this.capacity).fill(null);
    this.equipment = {
      weapon: null,
      armor: null,
      trinket: null
    };

    this.potionCooldown = 0;
    this.potionCooldownDuration = 1.5;
    this.potionCooldowns = {
      heal: 0,
      stamina: 0
    };

    this.onChangeCallbacks = [];

    // Initialize with starter equipment and supplies if specified
    if (options.initializeDefaults !== false) {
      this.initDefaultLoadout();
    }
  }

  getGold() {
    return this.gold;
  }

  addGold(amount) {
    const val = Math.max(0, Math.floor(amount || 0));
    this.gold += val;
    this.notifyChange();
    return this.gold;
  }

  spendGold(amount) {
    const val = Math.max(0, Math.floor(amount || 0));
    if (val <= 0) return true;
    if (this.gold < val) return false;
    this.gold -= val;
    this.notifyChange();
    return true;
  }

  onChange(callback) {
    if (typeof callback === 'function') {
      this.onChangeCallbacks.push(callback);
    }
  }

  notifyChange() {
    for (let i = 0; i < this.onChangeCallbacks.length; i++) {
      try {
        this.onChangeCallbacks[i](this);
      } catch (err) {
        console.error('[InventorySystem] Listener error:', err);
      }
    }
  }

  initDefaultLoadout() {
    this.equipment.weapon = this.createItem('iron_sword');
    this.equipment.armor = this.createItem('adventurer_tunic');
    this.equipment.trinket = null;

    this.addItem('injera_doro_wat', 1);
    this.addItem('ethiopian_bunna', 2);
    this.addItem('healing_potion', 2);
    this.addItem('stamina_potion', 1);
  }

  getItemDefinition(itemId) {
    return ITEM_DATABASE[itemId] || null;
  }

  createItem(itemId) {
    const template = ITEM_DATABASE[itemId];
    if (!template) {
      console.warn(`[InventorySystem] Item ID '${itemId}' not found in database.`);
      return null;
    }

    return {
      id: template.id,
      name: template.name,
      type: template.type,
      rarity: template.rarity,
      icon: template.icon,
      description: template.description,
      stats: template.stats ? { ...template.stats } : {},
      value: typeof template.value === 'number' ? template.value : 10,
      stackable: !!template.stackable,
      maxStack: template.maxStack || 1,
      uniqueId: template.stackable ? undefined : `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }

  getOccupiedSlotCount() {
    return this.slots.filter(s => s !== null).length;
  }

  hasItem(itemId) {
    return this.slots.some(s => s && s.item && s.item.id === itemId);
  }

  getItemCount(itemId) {
    return this.slots
      .filter(s => s && s.item && s.item.id === itemId)
      .reduce((sum, s) => sum + s.quantity, 0);
  }

  isFull() {
    return this.getOccupiedSlotCount() >= this.capacity;
  }

  canFitItem(item, quantity = 1) {
    return this.canAddItem(item, quantity);
  }

  canAddItem(itemId, quantity = 1) {
    const template = typeof itemId === 'string' ? ITEM_DATABASE[itemId] : itemId;
    if (!template) return false;

    if (template.stackable) {
      let remaining = quantity;
      for (let i = 0; i < this.capacity; i++) {
        const slot = this.slots[i];
        if (slot && slot.item.id === template.id) {
          const spaceInSlot = slot.item.maxStack - slot.quantity;
          remaining -= spaceInSlot;
          if (remaining <= 0) return true;
        }
      }
      // If still remaining, check if there's any empty slot
      return this.slots.some(s => s === null);
    } else {
      // Unstackable requires 1 empty slot per quantity
      const emptySlots = this.slots.filter(s => s === null).length;
      return emptySlots >= quantity;
    }
  }

  addItem(itemOrId, quantity = 1) {
    const itemData = typeof itemOrId === 'string' ? this.createItem(itemOrId) : { ...itemOrId };
    if (!itemData) {
      return { success: false, reason: 'INVALID_ITEM', added: 0 };
    }

    let remainingToAdd = quantity;

    // 1. Try to stack into existing slots if stackable
    if (itemData.stackable) {
      for (let i = 0; i < this.capacity; i++) {
        const slot = this.slots[i];
        if (slot && slot.item.id === itemData.id) {
          const space = slot.item.maxStack - slot.quantity;
          if (space > 0) {
            const addCount = Math.min(space, remainingToAdd);
            slot.quantity += addCount;
            remainingToAdd -= addCount;
            if (remainingToAdd <= 0) break;
          }
        }
      }
    }

    // 2. Put remaining into empty slots
    while (remainingToAdd > 0) {
      const emptyIndex = this.slots.findIndex(s => s === null);
      if (emptyIndex === -1) {
        // Inventory is full
        const added = quantity - remainingToAdd;
        if (added > 0) this.notifyChange();
        return {
          success: false,
          reason: 'INVENTORY_FULL',
          added: added,
          remaining: remainingToAdd
        };
      }

      const slotItem = itemData.stackable ? itemData : this.createItem(itemData.id) || itemData;
      const countForSlot = itemData.stackable ? Math.min(itemData.maxStack, remainingToAdd) : 1;

      this.slots[emptyIndex] = {
        item: slotItem,
        quantity: countForSlot
      };

      remainingToAdd -= countForSlot;
    }

    this.notifyChange();
    return { success: true, added: quantity, remaining: 0 };
  }

  removeItemAt(slotIndex, quantity = 1) {
    if (slotIndex < 0 || slotIndex >= this.capacity || !this.slots[slotIndex]) {
      return null;
    }

    const slot = this.slots[slotIndex];
    const removeCount = Math.min(slot.quantity, quantity);
    const removedItem = { ...slot.item };

    slot.quantity -= removeCount;
    if (slot.quantity <= 0) {
      this.slots[slotIndex] = null;
    }

    this.notifyChange();
    return { item: removedItem, quantity: removeCount };
  }

  update(deltaTime = 0.016) {
    if (this.potionCooldown > 0) {
      this.potionCooldown = Math.max(0, this.potionCooldown - deltaTime);
    }
    for (const key of Object.keys(this.potionCooldowns)) {
      if (this.potionCooldowns[key] > 0) {
        this.potionCooldowns[key] = Math.max(0, this.potionCooldowns[key] - deltaTime);
      }
    }
  }

  getRemainingPotionCooldown(item) {
    if (!item) return this.potionCooldown;
    const key = item.stats?.heal ? 'heal' : (item.stats?.speedBoost ? 'stamina' : item.id);
    return this.potionCooldowns[key] || 0;
  }

  moveOrMergeItem(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.capacity || toIndex < 0 || toIndex >= this.capacity || fromIndex === toIndex) {
      return { success: false, reason: 'INVALID_SLOTS' };
    }

    const sourceSlot = this.slots[fromIndex];
    if (!sourceSlot) {
      return { success: false, reason: 'SOURCE_EMPTY' };
    }

    const targetSlot = this.slots[toIndex];

    if (!targetSlot) {
      // Simple move to empty slot
      this.slots[toIndex] = sourceSlot;
      this.slots[fromIndex] = null;
      this.notifyChange();
      return { success: true, action: 'MOVED' };
    }

    // Merge stackable items if identical ID
    if (sourceSlot.item.id === targetSlot.item.id && sourceSlot.item.stackable) {
      const maxStack = targetSlot.item.maxStack || 99;
      const space = maxStack - targetSlot.quantity;
      if (space > 0) {
        const transfer = Math.min(space, sourceSlot.quantity);
        targetSlot.quantity += transfer;
        sourceSlot.quantity -= transfer;
        if (sourceSlot.quantity <= 0) {
          this.slots[fromIndex] = null;
        }
        this.notifyChange();
        return { success: true, action: 'MERGED', transferred: transfer };
      }
    }

    // Swap items between the two slots
    this.slots[toIndex] = sourceSlot;
    this.slots[fromIndex] = targetSlot;
    this.notifyChange();
    return { success: true, action: 'SWAPPED' };
  }

  swapItems(fromIndex, toIndex) {
    return this.moveOrMergeItem(fromIndex, toIndex);
  }

  dropItem(slotIndex, quantity = 1, player = null, collectibleManager = null) {
    if (slotIndex < 0 || slotIndex >= this.capacity || !this.slots[slotIndex]) {
      return { success: false, reason: 'EMPTY_SLOT' };
    }

    const slot = this.slots[slotIndex];
    const item = slot.item;

    if (item.type === ItemType.QUEST) {
      return { success: false, reason: 'CANNOT_DROP_QUEST_ITEM', message: 'Quest items cannot be discarded.' };
    }

    const dropQty = Math.min(slot.quantity, Math.max(1, quantity));
    const droppedItemId = item.id;

    slot.quantity -= dropQty;
    if (slot.quantity <= 0) {
      this.slots[slotIndex] = null;
    }

    // Spawn pickup in world at player position if managers available
    if (player && collectibleManager && typeof collectibleManager.spawnItemPickup === 'function') {
      const dropPos = player.getPosition ? player.getPosition() : player.position;
      const dropId = `dropped-${droppedItemId}-${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      collectibleManager.spawnItemPickup(dropId, droppedItemId, dropPos.x, dropPos.z, dropQty);
    }

    this.notifyChange();
    return { success: true, item: item, quantity: dropQty, message: `Dropped ${dropQty}x ${item.name}.` };
  }

  equipItem(slotIndex, player = null) {
    if (slotIndex < 0 || slotIndex >= this.capacity || !this.slots[slotIndex]) {
      return { success: false, reason: 'EMPTY_SLOT' };
    }

    const targetSlot = this.slots[slotIndex];
    const item = targetSlot.item;

    let equipSlotName = null;
    if (item.type === ItemType.WEAPON) equipSlotName = 'weapon';
    else if (item.type === ItemType.ARMOR) equipSlotName = 'armor';
    else if (item.type === ItemType.TRINKET) equipSlotName = 'trinket';
    else {
      return { success: false, reason: 'NOT_EQUIPPABLE' };
    }

    const previousEquipped = this.equipment[equipSlotName];

    // Remove from inventory slot
    this.slots[slotIndex] = null;

    // Equip the new item
    this.equipment[equipSlotName] = item;

    // If an item was previously equipped, put it back into inventory
    if (previousEquipped) {
      this.slots[slotIndex] = {
        item: previousEquipped,
        quantity: 1
      };
    }

    if (player && typeof player.recalculateStats === 'function') {
      player.recalculateStats();
    }

    this.notifyChange();
    return { success: true, equipped: item, previous: previousEquipped };
  }

  unequipItem(slotName, player = null) {
    if (!this.equipment[slotName]) {
      return { success: false, reason: 'NOTHING_EQUIPPED' };
    }

    if (this.isFull()) {
      return { success: false, reason: 'INVENTORY_FULL' };
    }

    const item = this.equipment[slotName];
    const emptyIndex = this.slots.findIndex(s => s === null);
    if (emptyIndex === -1) {
      return { success: false, reason: 'INVENTORY_FULL' };
    }

    this.slots[emptyIndex] = {
      item: item,
      quantity: 1
    };
    this.equipment[slotName] = null;

    if (player && typeof player.recalculateStats === 'function') {
      player.recalculateStats();
    }

    this.notifyChange();
    return { success: true, unequipped: item };
  }

  useConsumable(slotIndex, player = null, ignoreCooldown = false) {
    if (slotIndex < 0 || slotIndex >= this.capacity || !this.slots[slotIndex]) {
      return { success: false, reason: 'EMPTY_SLOT' };
    }

    const slot = this.slots[slotIndex];
    const item = slot.item;

    if (item.type !== ItemType.CONSUMABLE) {
      return { success: false, reason: 'NOT_CONSUMABLE' };
    }

    const cdKey = item.stats?.heal ? 'heal' : (item.stats?.speedBoost ? 'stamina' : item.id);
    const remainingCd = this.potionCooldowns[cdKey] || 0;

    if (!ignoreCooldown && remainingCd > 0) {
      return {
        success: false,
        reason: 'ON_COOLDOWN',
        message: `${item.name} is on cooldown (${remainingCd.toFixed(1)}s remaining).`
      };
    }

    let effectApplied = false;
    let message = '';

    // Healing Potion
    if (item.stats && typeof item.stats.heal === 'number') {
      if (player) {
        if (player.health >= player.maxHealth) {
          return { success: false, reason: 'HEALTH_ALREADY_FULL', message: 'Health is already full!' };
        }
        player.heal(item.stats.heal);
        effectApplied = true;
        message = `Consumed ${item.name}! Restored +${item.stats.heal} HP.`;

        // VFX & SFX
        if (player.audioManager && typeof player.audioManager.playCrystalCollect === 'function') {
          player.audioManager.playCrystalCollect();
        }
        if (player.vfxManager && typeof player.vfxManager.spawnCrystalBurst === 'function') {
          player.vfxManager.spawnCrystalBurst(player.getPosition(), 0x22c55e);
        }
      }
    }

    // Stamina Speed Potion
    if (item.stats && item.stats.speedBoost) {
      if (player) {
        const boost = item.stats.speedBoost;
        const duration = item.stats.duration || 15;
        player.applySpeedBuff(boost, duration);
        effectApplied = true;
        message = `Consumed ${item.name}! +${Math.round((boost - 1) * 100)}% Speed for ${duration}s!`;

        if (player.audioManager && typeof player.audioManager.playEntranceUnlocked === 'function') {
          player.audioManager.playEntranceUnlocked();
        }
        if (player.vfxManager && typeof player.vfxManager.spawnCrystalBurst === 'function') {
          player.vfxManager.spawnCrystalBurst(player.getPosition(), 0x38bdf8);
        }
      }
    }

    if (effectApplied) {
      this.potionCooldowns[cdKey] = this.potionCooldownDuration;
      this.potionCooldown = this.potionCooldownDuration;
      slot.quantity -= 1;
      if (slot.quantity <= 0) {
        this.slots[slotIndex] = null;
      }
      this.notifyChange();
      return { success: true, message: message };
    }

    return { success: false, reason: 'UNKNOWN_EFFECT' };
  }

  getEquipmentBonuses() {
    let damageBonus = 0;
    let defenseBonus = 0;
    let maxHealthBonus = 0;
    let speedBonus = 0;

    const equippedList = [this.equipment.weapon, this.equipment.armor, this.equipment.trinket];
    for (let i = 0; i < equippedList.length; i++) {
      const item = equippedList[i];
      if (item && item.stats) {
        if (typeof item.stats.damage === 'number') damageBonus += item.stats.damage;
        if (typeof item.stats.defense === 'number') defenseBonus += item.stats.defense;
        if (typeof item.stats.maxHealth === 'number') maxHealthBonus += item.stats.maxHealth;
        if (typeof item.stats.speedBoost === 'number') speedBonus += (item.stats.speedBoost - 1);
      }
    }

    return {
      damage: damageBonus,
      defense: defenseBonus,
      maxHealth: maxHealthBonus,
      speedBonus: speedBonus
    };
  }

  // ==================== PERSISTENCE SERIALIZATION ====================

  getSaveState() {
    return {
      capacity: this.capacity,
      gold: this.gold,
      slots: this.slots.map(s => {
        if (!s) return null;
        return {
          id: s.item.id,
          quantity: s.quantity,
          item: s.item
        };
      }),
      equipment: {
        weapon: this.equipment.weapon ? { ...this.equipment.weapon } : null,
        armor: this.equipment.armor ? { ...this.equipment.armor } : null,
        trinket: this.equipment.trinket ? { ...this.equipment.trinket } : null
      }
    };
  }

  restoreSaveState(state, player = null) {
    if (!state) return;

    if (typeof state.capacity === 'number') {
      this.capacity = state.capacity;
    }

    if (typeof state.gold === 'number') {
      this.gold = state.gold;
    }

    this.slots = new Array(this.capacity).fill(null);

    // Restore slots
    if (Array.isArray(state.slots)) {
      for (let i = 0; i < Math.min(this.capacity, state.slots.length); i++) {
        const slotData = state.slots[i];
        if (slotData) {
          const item = slotData.item || this.createItem(slotData.id);
          if (item) {
            this.slots[i] = {
              item: item,
              quantity: slotData.quantity || 1
            };
          }
        }
      }
    } else if (Array.isArray(state)) {
      // Legacy format where inventory was just an array of items
      state.forEach(entry => {
        const item = this.createItem(entry.id) || entry;
        this.addItem(item, entry.count || 1);
      });
    }

    // Restore equipment
    if (state.equipment && typeof state.equipment === 'object') {
      ['weapon', 'armor', 'trinket'].forEach(slotName => {
        const eq = state.equipment[slotName];
        if (eq) {
          if (typeof eq === 'string') {
            // String ID
            this.equipment[slotName] = this.createItem(eq);
          } else if (typeof eq === 'object' && eq.id) {
            this.equipment[slotName] = eq;
          }
        } else {
          this.equipment[slotName] = null;
        }
      });
    }

    if (player && typeof player.recalculateStats === 'function') {
      player.recalculateStats();
    }

    this.notifyChange();
  }
}
