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

    let npcConfigs = [];
    if (levelIndex === 0) {
      // STAGE 1: THE SIMIEN HIGHLANDS
      npcConfigs = [
        {
          id: 'npc-kaelen',
          name: 'አባ ካሌብ • Abba Kaleb',
          title: 'የስሜን ሽማግሌ • Simien Elder & Sage',
          role: 'quest_giver',
          modelPath: './models/Soldier.glb',
          avatar: '👴🏾',
          x: -5.0,
          y: 0,
          z: -4.0,
          rotY: 0.8,
          interactionRadius: 3.5
        },
        {
          id: 'npc-valen',
          name: 'ተክሌ • Tekle',
          title: 'የአክሱም ነጋዴ • Axumite Caravaneer',
          role: 'merchant',
          modelPath: './models/Xbot.glb',
          avatar: '🐪',
          x: 6.0,
          y: 0,
          z: -4.0,
          rotY: -0.7,
          interactionRadius: 3.5
        },
        {
          id: 'npc-sylas',
          name: 'ዮናታን • Yonatan',
          title: 'የተራራው ባሕታዊ • Highland Hermit & Healer',
          role: 'forest_hermit',
          modelPath: './models/Soldier.glb',
          avatar: '🌿',
          x: -18.0,
          y: 0,
          z: -28.0,
          rotY: 1.2,
          interactionRadius: 3.5
        }
      ];
    } else if (levelIndex === 1) {
      // STAGE 2: AXUMITE SANCTUARY
      npcConfigs = [
        {
          id: 'npc-valen-ruins',
          name: 'ተክሌ • Tekle',
          title: 'የአክሱም ነጋዴ • Axum Sanctuary Caravaneer',
          role: 'merchant',
          modelPath: './models/Xbot.glb',
          avatar: '🐪',
          x: 8.0,
          y: 0,
          z: 24.0,
          rotY: -1.0,
          interactionRadius: 3.5
        }
      ];
    } else if (levelIndex === 2) {
      // STAGE 3: RAS DASHEN PASS
      npcConfigs = [
        {
          id: 'npc-torvald',
          name: 'ዘውዱ • Zewdu',
          title: 'የራስ ዳሸን አዳኝ • Ras Dashen Scout',
          role: 'mountaineer',
          modelPath: './models/Soldier.glb',
          avatar: '🏹',
          x: 20.0,
          y: 0,
          z: 20.0,
          rotY: -0.8,
          interactionRadius: 3.5
        }
      ];
    } else if (levelIndex === 3) {
      // STAGE 4: GONDAR IMPERIAL CITY & BAZAAR
      npcConfigs = [
        {
          id: 'npc-mara',
          name: 'ወይዘሮ ማርታ • Weyzero Marta',
          title: 'የጎንደር ከተማ ጠባቂ • Guardian of Gondar',
          role: 'village_survivor',
          modelPath: './models/Xbot.glb',
          avatar: '🕯️',
          x: -2.0,
          y: 0,
          z: -10.0,
          rotY: 0.2,
          interactionRadius: 3.5
        },
        {
          id: 'npc-azmari',
          name: 'አዝማሪው ብርሃኑ • Azmari Berhanu',
          title: 'የከተማው ዘማሪ • Gondar Imperial Minstrel',
          role: 'forest_hermit',
          modelPath: './models/Soldier.glb',
          avatar: '🎻',
          x: -8.0,
          y: 0,
          z: -7.0,
          rotY: 0.6,
          interactionRadius: 3.5
        },
        {
          id: 'npc-taytu',
          name: 'ወይዘሮ ታዬች • Taytu',
          title: 'የቡና እናት • Coffee Ceremony Maiden',
          role: 'merchant',
          modelPath: './models/Xbot.glb',
          avatar: '☕',
          x: 6.0,
          y: 0,
          z: -7.0,
          rotY: -0.6,
          interactionRadius: 3.5
        },
        {
          id: 'npc-qesis',
          name: 'ቀሲስ ገብረ ማርያም • Qesis Gebre Maryam',
          title: 'የደብረ ብርሃን ካህን • Priest of Debre Berhan',
          role: 'quest_giver',
          modelPath: './models/Soldier.glb',
          avatar: '✝️',
          x: 16.0,
          y: 0,
          z: 10.0,
          rotY: 0.0,
          interactionRadius: 3.5
        }
      ];
    } else if (levelIndex === 4) {
      // STAGE 5: SOF OMAR CAVERNS
      npcConfigs = [
        {
          id: 'npc-gideon',
          name: 'መርዕድ • Mered',
          title: 'የሶፍ ዑመር መሪ • Sof Omar Cave Guide',
          role: 'cartographer',
          modelPath: './models/Soldier.glb',
          avatar: '🗺️',
          x: -20.0,
          y: 0,
          z: 22.0,
          rotY: 0.3,
          interactionRadius: 3.5
        }
      ];
    }

    const npcs = npcConfigs.map(cfg => new NPC(this.scene, this.physicsWorld, cfg));
    await Promise.all(npcs.map(npc => npc.init()));
    this.npcs.push(...npcs);

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
