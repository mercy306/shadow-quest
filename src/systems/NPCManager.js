import * as THREE from 'three';
import { NPC } from '../entities/NPC.js';

export class NPCManager {
  constructor(scene, physicsWorld = null, uiManager = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.uiManager = uiManager;

    this.npcs = [];
    this.activeInteractable = null;
    this.onInteractCallbacks = [];
  }

  setManagers({ physicsWorld, uiManager }) {
    if (physicsWorld) this.physicsWorld = physicsWorld;
    if (uiManager) this.uiManager = uiManager;
  }

  async init(levelIndex = 0) {
    this.clear();

    const npcConfigs = levelIndex === 0 ? [
      // STAGE 1: THE DARK FOREST
      {
        id: 'npc-kaelen',
        name: 'Elder Kaelen',
        title: 'Village Elder & Quest Giver',
        role: 'quest_giver',
        modelPath: '/models/Soldier.glb',
        avatar: '🧙‍♂️',
        x: -5.0,
        y: 0,
        z: -4.0,
        rotY: 0.8,
        interactionRadius: 3.5
      },
      {
        id: 'npc-valen',
        name: 'Valen',
        title: 'Wandering Trader & Merchant',
        role: 'merchant',
        modelPath: '/models/Xbot.glb',
        avatar: '🎒',
        x: 6.0,
        y: 0,
        z: -4.0,
        rotY: -0.7,
        interactionRadius: 3.5
      },
      {
        id: 'npc-sylas',
        name: 'Sylas',
        title: 'Forest Hermit & Herbalist',
        role: 'forest_hermit',
        modelPath: '/models/Soldier.glb',
        avatar: '🌿',
        x: -18.0,
        y: 0,
        z: -28.0,
        rotY: 1.2,
        interactionRadius: 3.5
      }
    ] : [
      // STAGE 2: THE ANCIENT RUINS
      {
        id: 'npc-valen-ruins',
        name: 'Valen',
        title: 'Sanctum Outpost Trader',
        role: 'merchant',
        modelPath: '/models/Xbot.glb',
        avatar: '🎒',
        x: 8.0,
        y: 0,
        z: 24.0,
        rotY: -1.0,
        interactionRadius: 3.5
      }
    ];

    for (const cfg of npcConfigs) {
      const npc = new NPC(this.scene, this.physicsWorld, cfg);
      await npc.init();
      this.npcs.push(npc);
    }

    console.log(`[NPCManager] Loaded ${this.npcs.length} NPCs for Stage ${levelIndex + 1}`);
  }

  getNPC(id) {
    return this.npcs.find(n => n.id === id);
  }

  getActiveInteractable() {
    return this.activeInteractable;
  }

  update(deltaTime, playerPosition) {
    let closestNPC = null;
    let closestDist = Infinity;

    for (const npc of this.npcs) {
      npc.update(deltaTime, playerPosition);

      if (playerPosition && npc.isPlayerInRange(playerPosition)) {
        const dist = Math.hypot(playerPosition.x - npc.position.x, playerPosition.z - npc.position.z);
        if (dist < closestDist) {
          closestDist = dist;
          closestNPC = npc;
        }
      }
    }

    this.activeInteractable = closestNPC;
  }

  clear() {
    for (const npc of this.npcs) {
      npc.dispose();
    }
    this.npcs = [];
    this.activeInteractable = null;
  }
}
