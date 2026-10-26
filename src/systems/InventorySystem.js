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
  MATERIAL: 'material',
  QUEST: 'quest'
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
  // --- WEAPONS ---
  iron_sword: {
    id: 'iron_sword',
    name: 'Steel Broadsword',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    icon: '⚔️',
    description: 'A finely balanced steel blade forged by kingdom armorers. Reliable and sharp.',
    stats: { damage: 35 },
    stackable: false
  },
  shadow_cleaver: {
    id: 'shadow_cleaver',
    name: 'Shadow Cleaver',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    icon: '🗡️',
    description: 'Carved from dark abyssal glass. Cuts through enemy armor with ease.',
    stats: { damage: 55 },
    stackable: false
  },
  void_reaver: {
    id: 'void_reaver',
    name: 'Void Reaver',
    type: ItemType.WEAPON,
    rarity: ItemRarity.EPIC,
    icon: '⚡',
    description: 'An ancient relic blade pulsing with raw void thunder. Inflicts massive damage.',
    stats: { damage: 80 },
    stackable: false
  },

  // --- ARMOR ---
  adventurer_tunic: {
    id: 'adventurer_tunic',
    name: 'Adventurer Tunic',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    icon: '🥋',
    description: 'Sturdy leather garment providing foundational protection on the trails.',
    stats: { defense: 10, maxHealth: 20 },
    stackable: false
  },
  shadow_plate: {
    id: 'shadow_plate',
    name: 'Rune Guard Plate',
    type: ItemType.ARMOR,
    rarity: ItemRarity.RARE,
    icon: '🛡️',
    description: 'Tempered steel plate inscribed with protective defensive runes.',
    stats: { defense: 25, maxHealth: 50 },
    stackable: false
  },
  sanctuary_aegis: {
    id: 'sanctuary_aegis',
    name: 'Sanctuary Aegis',
    type: ItemType.ARMOR,
    rarity: ItemRarity.EPIC,
    icon: '⚜️',
    description: 'Consecrated armor once worn by high guardians of the sacred sanctum.',
    stats: { defense: 45, maxHealth: 100 },
    stackable: false
  },

  // --- TRINKETS / RELICS ---
  void_talisman: {
    id: 'void_talisman',
    name: 'Shadow Veil Talisman',
    type: ItemType.TRINKET,
    rarity: ItemRarity.RARE,
    icon: '🧿',
    description: 'Wards the wearer against malice, boosting physical defense by +15.',
    stats: { defense: 15 },
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
    stackable: false
  },

  // --- CONSUMABLES ---
  healing_potion: {
    id: 'healing_potion',
    name: 'Ancient Healing Elixir',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    icon: '🧪',
    description: 'Restores 45 Health Points immediately upon consumption.',
    stats: { heal: 45 },
    stackable: true,
    maxStack: 10
  },
  greater_healing_potion: {
    id: 'greater_healing_potion',
    name: 'Sacred Sanctuary Nectar',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.RARE,
    icon: '🏺',
    description: 'Consecrated nectar that fully restores 100 Health Points.',
    stats: { heal: 100 },
    stackable: true,
    maxStack: 5
  },
  stamina_potion: {
    id: 'stamina_potion',
    name: 'Windrunner Tonic',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    icon: '🍶',
    description: 'Increases sprint and run speed by 25% for 15 seconds.',
    stats: { speedBoost: 1.25, duration: 15 },
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
    stackable: true,
    maxStack: 99
  },

  // --- QUEST ITEMS ---
  sanctuary_key: {
    id: 'sanctuary_key',
    name: 'Ancient Sanctuary Key',
    type: ItemType.QUEST,
    rarity: ItemRarity.RARE,
    icon: '🗝️',
    description: 'An ornate bronze key carved with sunburst glyphs. Unlocks the sanctum vault.',
    stackable: false
  },
  sealed_scroll: {
    id: 'sealed_scroll',
    name: 'Elder Glyphs Scroll',
    type: ItemType.QUEST,
    rarity: ItemRarity.UNCOMMON,
    icon: '📜',
    description: 'Sacred parchment containing translations of the ancient ruins architecture.',
    stackable: false
  }
};

export class InventorySystem {
  constructor(options = {}) {
    this.capacity = options.capacity || 20;
    this.slots = new Array(this.capacity).fill(null);
    this.equipment = {
      weapon: null,
      armor: null,
      trinket: null
    };

    this.onChangeCallbacks = [];

    // Initialize with starter equipment and supplies if specified
    if (options.initializeDefaults !== false) {
      this.initDefaultLoadout();
    }
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

    this.addItem('healing_potion', 2);
    this.addItem('stamina_potion', 1);
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
      stackable: !!template.stackable,
      maxStack: template.maxStack || 1,
      uniqueId: template.stackable ? undefined : `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }

  getOccupiedSlotCount() {
    return this.slots.filter(s => s !== null).length;
  }

  isFull() {
    return this.getOccupiedSlotCount() >= this.capacity;
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

  useConsumable(slotIndex, player = null) {
    if (slotIndex < 0 || slotIndex >= this.capacity || !this.slots[slotIndex]) {
      return { success: false, reason: 'EMPTY_SLOT' };
    }

    const slot = this.slots[slotIndex];
    const item = slot.item;

    if (item.type !== ItemType.CONSUMABLE) {
      return { success: false, reason: 'NOT_CONSUMABLE' };
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
