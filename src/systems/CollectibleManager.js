import * as THREE from 'three';
import { CrystalCollectible, ItemPickupCollectible } from './Collectible.js';

export class CollectibleManager {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;

    this.collectibles = [];
    this.collectedCounts = new Map();
    this.totalCounts = new Map();
    this.collectedIds = new Set();
    this.onCollectCallbacks = [];
  }

  onCollect(callback) {
    if (typeof callback === 'function') {
      this.onCollectCallbacks.push(callback);
    }
  }

  setPhysicsWorld(physicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  init(levelIndex = 0) {
    this.clear();

    const crystalLocations = levelIndex === 0
      ? [
          // STAGE 1: THE DARK FOREST (5 Shadow Crystals)
          { id: 'crystal-1', x: 3.5, z: 8.0, desc: 'Forest Trailhead' },
          { id: 'crystal-2', x: -14.0, z: -16.0, desc: 'Boulder Clearing' },
          { id: 'crystal-3', x: 15.0, z: -32.0, desc: 'Fallen Log Glade' },
          { id: 'crystal-4', x: 23.0, z: -48.0, desc: 'Winding Trail Ridge' },
          { id: 'crystal-5', x: 34.0, z: -68.0, desc: 'Ancient Ruins Approach' }
        ]
      : [
          // STAGE 2: THE ANCIENT RUINS (3 Void Relic Orbs)
          { id: 'relic-1', x: -18.0, z: 18.0, desc: 'Western Catacomb Relic' },
          { id: 'relic-2', x: 18.0, z: 18.0, desc: 'Eastern Colonnade Relic' },
          { id: 'relic-3', x: 0.0, z: -21.0, desc: 'North Corridor Relic' }
        ];

    crystalLocations.forEach(loc => {
      this.spawnCrystal(loc.id, loc.x, loc.z, loc.desc);
    });

    // World Item Pickups (Weapons, Armor, Potions, Materials, Quest Items, Relics)
    const itemPickups = levelIndex === 0
      ? [
          { id: 'pickup-blade-1', itemId: 'shadow_cleaver', x: -8.0, z: -10.0, quantity: 1 },
          { id: 'pickup-armor-1', itemId: 'shadow_plate', x: 20.0, z: -40.0, quantity: 1 },
          { id: 'pickup-pot-1', itemId: 'healing_potion', x: 8.0, z: -5.0, quantity: 2 },
          { id: 'pickup-pot-2', itemId: 'stamina_potion', x: -12.0, z: -25.0, quantity: 2 },
          { id: 'pickup-mat-1', itemId: 'starfall_ore', x: 28.0, z: -55.0, quantity: 3 },
          { id: 'pickup-hermit-satchel', itemId: 'hermit_satchel', x: -12.0, z: -58.0, quantity: 1 },
          { id: 'pickup-quest-1', itemId: 'sealed_scroll', x: 38.0, z: -70.0, quantity: 1 }
        ]
      : [
          { id: 'pickup-void-blade', itemId: 'void_reaver', x: 0.0, z: -10.0, quantity: 1 },
          { id: 'pickup-sanct-armor', itemId: 'sanctuary_aegis', x: 0.0, z: 10.0, quantity: 1 },
          { id: 'pickup-trinket-heart', itemId: 'radiant_crystal_heart', x: -15.0, z: 0.0, quantity: 1 },
          { id: 'pickup-key', itemId: 'sanctuary_key', x: 15.0, z: 0.0, quantity: 1 },
          { id: 'pickup-great-pot', itemId: 'greater_healing_potion', x: 0.0, z: 25.0, quantity: 2 }
        ];

    itemPickups.forEach(p => {
      if (!this.collectedIds.has(p.id)) {
        this.spawnItemPickup(p.id, p.itemId, p.x, p.z, p.quantity);
      }
    });
  }

  spawnItemPickup(id, itemId, x, z, quantity = 1) {
    let groundY = 0;
    if (this.physicsWorld) {
      groundY = this.physicsWorld.getGroundHeight(x, z, 5.0);
    }
    const itemY = groundY + 0.8;

    const itemPickup = new ItemPickupCollectible(id, itemId, x, itemY, z, {
      quantity: quantity
    });

    this.collectibles.push(itemPickup);
    this.scene.add(itemPickup.mesh);
  }

  spawnCrystal(id, x, z, desc = '') {
    let groundY = 0;
    if (this.physicsWorld) {
      groundY = this.physicsWorld.getGroundHeight(x, z, 5.0);
    }
    const crystalY = groundY + 1.1;

    const crystal = new CrystalCollectible(id, x, crystalY, z, {
      name: desc || 'Shadow Crystal'
    });

    this.collectibles.push(crystal);
    this.scene.add(crystal.mesh);

    // Track totals
    const type = 'crystal';
    const currentTotal = this.totalCounts.get(type) || 0;
    this.totalCounts.set(type, currentTotal + 1);

    if (!this.collectedCounts.has(type)) {
      this.collectedCounts.set(type, 0);
    }
  }

  update(deltaTime, playerPosition, audioManager = null, uiManager = null, vfxManager = null, player = null) {
    for (let i = 0; i < this.collectibles.length; i++) {
      const item = this.collectibles[i];
      if (item.isDisposed) continue;

      item.update(deltaTime);

      if (!item.isCollected && playerPosition) {
        const dist = Math.hypot(
          playerPosition.x - item.baseX,
          playerPosition.z - item.baseZ
        );

        if (dist <= item.collectionRadius) {
          // World Item Pickup handling
          if (item.type === 'item') {
            if (player && player.inventorySystem) {
              const canFit = player.inventorySystem.canAddItem(item.itemId, item.quantity);
              if (!canFit) {
                if (uiManager && typeof uiManager.showCollectNotification === 'function') {
                  uiManager.showCollectNotification(`INVENTORY FULL! Cannot carry ${item.name}`, 'warning');
                }
                continue;
              }

              const success = item.collect();
              if (success) {
                this.collectedIds.add(item.id);
                player.inventorySystem.addItem(item.itemId, item.quantity);
                this.onCollectCallbacks.forEach(cb => cb(item));

                if (audioManager && typeof audioManager.playCrystalCollect === 'function') {
                  audioManager.playCrystalCollect();
                }
                if (vfxManager && typeof vfxManager.spawnCrystalBurst === 'function') {
                  vfxManager.spawnCrystalBurst(item.mesh.position, 0x38bdf8);
                }
                if (uiManager) {
                  if (typeof uiManager.showCollectNotification === 'function') {
                    uiManager.showCollectNotification(`+${item.quantity} ${item.name} (${item.rarity.toUpperCase()})`);
                  }
                  if (typeof uiManager.refreshInventoryUI === 'function') {
                    uiManager.refreshInventoryUI();
                  }
                }
              }
            }
            continue;
          }

          // Existing crystal collection logic (100% preserved)
          const success = item.collect();
          if (success) {
            this.collectedIds.add(item.id);
            const count = (this.collectedCounts.get(item.type) || 0) + item.value;
            this.collectedCounts.set(item.type, count);
            const total = this.totalCounts.get(item.type) || count;

            if (audioManager && typeof audioManager.playCrystalCollect === 'function') {
              audioManager.playCrystalCollect();
            }

            if (vfxManager && typeof vfxManager.spawnCrystalBurst === 'function') {
              const burstColor = item.type === 'crystal' ? 0x38bdf8 : 0xa855f7;
              vfxManager.spawnCrystalBurst(item.mesh.position, burstColor);
            }

            if (uiManager) {
              if (typeof uiManager.updateCrystalCount === 'function') {
                uiManager.updateCrystalCount(count, total);
              }
              if (typeof uiManager.showCollectNotification === 'function') {
                uiManager.showCollectNotification(`+${item.value} ${item.name}`);
              }
            }

            // Notify quest and other listeners
            for (let c = 0; c < this.onCollectCallbacks.length; c++) {
              this.onCollectCallbacks[c](item);
            }
          }
        }
      }
    }

    this.collectibles = this.collectibles.filter(item => !item.isDisposed);
  }

  getCollectedCount(type = 'crystal') {
    return this.collectedCounts.get(type) || 0;
  }

  getTotalCount(type = 'crystal') {
    return this.totalCounts.get(type) || 0;
  }

  isAllCollected(type = 'crystal') {
    const total = this.getTotalCount(type);
    return total > 0 && this.getCollectedCount(type) >= total;
  }

  getRemainingCount(type = 'crystal') {
    return Math.max(0, this.getTotalCount(type) - this.getCollectedCount(type));
  }

  getCollectedIds() {
    return Array.from(this.collectedIds);
  }

  restoreCollectedIds(ids = []) {
    if (!Array.isArray(ids)) return;

    this.collectedIds = new Set(ids);
    let crystalsRemoved = 0;

    for (let i = 0; i < this.collectibles.length; i++) {
      const item = this.collectibles[i];
      if (this.collectedIds.has(item.id)) {
        item.isCollected = true;
        item.isDisposed = true;
        item.dispose();
        crystalsRemoved++;
      }
    }

    this.collectibles = this.collectibles.filter(item => !item.isDisposed);
    this.collectedCounts.set('crystal', this.collectedIds.size);
  }

  clear() {
    this.collectibles.forEach(item => item.dispose());
    this.collectibles = [];
    this.collectedCounts.clear();
    this.totalCounts.clear();
    this.collectedIds.clear();
  }
}
