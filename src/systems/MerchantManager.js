import { ItemCatalog } from './InventorySystem.js';

export class MerchantManager {
  constructor(uiManager = null, audioManager = null) {
    this.uiManager = uiManager;
    this.audioManager = audioManager;

    this.activeNPC = null;
    this.player = null;
    this.isOpen = false;
    this.currentTab = 'buy'; // 'buy' | 'sell'

    // Merchant stock catalog
    this.merchantStock = [
      { id: 'healing_potion', name: 'Ancient Healing Elixir', price: 25 },
      { id: 'greater_healing_potion', name: 'Sacred Sanctuary Nectar', price: 60 },
      { id: 'stamina_potion', name: 'Windrunner Tonic', price: 35 },
      { id: 'shadow_cleaver', name: 'Shadow Cleaver', price: 180 },
      { id: 'shadow_plate', name: 'Rune Guard Plate', price: 220 },
      { id: 'void_talisman', name: 'Shadow Veil Talisman', price: 150 },
      { id: 'starfall_ore', name: 'Starfall Ore', price: 75 }
    ];
  }

  setManagers({ uiManager, audioManager }) {
    if (uiManager) this.uiManager = uiManager;
    if (audioManager) this.audioManager = audioManager;
  }

  isShopOpen() {
    return this.isOpen;
  }

  openShop(npc, player) {
    this.activeNPC = npc;
    this.player = player;
    this.isOpen = true;
    this.currentTab = 'buy';

    if (this.uiManager && typeof this.uiManager.openMerchantModal === 'function') {
      this.uiManager.openMerchantModal(this);
    }
  }

  closeShop() {
    this.isOpen = false;
    this.activeNPC = null;
    if (this.uiManager && typeof this.uiManager.closeMerchantModal === 'function') {
      this.uiManager.closeMerchantModal();
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    if (this.uiManager && typeof this.uiManager.refreshMerchantUI === 'function') {
      this.uiManager.refreshMerchantUI();
    }
  }

  buyItem(stockItemId) {
    if (!this.player || !this.player.inventorySystem) {
      return { success: false, reason: 'No player or inventory available.' };
    }

    const stockEntry = this.merchantStock.find(s => s.id === stockItemId);
    if (!stockEntry) {
      return { success: false, reason: 'Item not sold by merchant.' };
    }

    const inv = this.player.inventorySystem;
    const price = stockEntry.price;

    // 1. Validate Currency
    if (inv.getGold() < price) {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification(`⚠️ Not enough gold! Need ${price} Gold.`);
      }
      return { success: false, reason: 'INSUFFICIENT_FUNDS' };
    }

    // 2. Create item template and check capacity
    const item = inv.createItem(stockItemId);
    if (!item) {
      return { success: false, reason: 'ITEM_CREATION_FAILED' };
    }

    if (!inv.canAddItem(item, 1)) {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification(`⚠️ Inventory full! Free up a slot first.`);
      }
      return { success: false, reason: 'INVENTORY_FULL' };
    }

    // 3. Atomic Transaction: spend gold and add item
    const spendSuccess = inv.spendGold(price);
    if (!spendSuccess) {
      return { success: false, reason: 'TRANSACTION_REJECTED' };
    }

    const addResult = inv.addItem(item, 1);
    const addSuccess = Boolean(addResult && (addResult.success || addResult === true));
    if (!addSuccess) {
      // Rollback gold if unexpected inventory failure
      inv.addGold(price);
      return { success: false, reason: 'FAILED_TO_STORE' };
    }

    // Success feedback
    if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
      this.uiManager.showCollectNotification(`🪙 Purchased ${item.name} for ${price} Gold!`);
    }

    if (this.activeNPC && this.activeNPC.hasRiggedAnimations) {
      this.activeNPC.playAnimation('agree');
    }

    if (this.uiManager && typeof this.uiManager.refreshMerchantUI === 'function') {
      this.uiManager.refreshMerchantUI();
    }

    return { success: true, item, price };
  }

  sellItem(slotIndex) {
    if (!this.player || !this.player.inventorySystem) {
      return { success: false, reason: 'No player or inventory available.' };
    }

    const inv = this.player.inventorySystem;
    const slot = inv.slots[slotIndex];
    if (!slot || !slot.item) {
      return { success: false, reason: 'EMPTY_SLOT' };
    }

    const item = slot.item;
    const baseValue = (typeof item.value === 'number' && item.value > 0)
      ? item.value
      : (ItemCatalog[item.id]?.value || 10);

    // Quest items cannot be sold
    if (item.type === 'quest' || baseValue <= 0) {
      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification(`⚠️ Cannot sell unique quest artifacts.`);
      }
      return { success: false, reason: 'CANNOT_SELL_QUEST_ITEM' };
    }

    // Calculate sell price (50% of base item value, minimum 1)
    const sellPrice = Math.max(1, Math.floor(baseValue * 0.5));

    // Remove 1 unit from stack or clear slot
    if (slot.quantity > 1) {
      slot.quantity -= 1;
    } else {
      inv.slots[slotIndex] = null;
    }

    // Credit gold
    inv.addGold(sellPrice);

    if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
      this.uiManager.showCollectNotification(`🪙 Sold 1x ${item.name} for +${sellPrice} Gold!`);
    }

    if (this.uiManager && typeof this.uiManager.refreshMerchantUI === 'function') {
      this.uiManager.refreshMerchantUI();
    }

    return { success: true, item, sellPrice };
  }
}
