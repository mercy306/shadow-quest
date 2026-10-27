import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { BossGuardian } from './BossGuardian.js';

export class EnemyManager {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.enemies = [];
    this.boss = null;
  }

  setPhysicsWorld(physicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  async init(levelIndex = 0) {
    this.clear();

    const guardianConfigs = levelIndex === 0
      ? [
          // STAGE 1: THE DARK FOREST (3 Standard Guardians)
          {
            id: 'ruins-sentinel-1',
            name: 'Forest Sentinel',
            patrolCenter: new THREE.Vector3(16, 0, -32),
            patrolRadius: 6.0,
            health: 80,
            damage: 12,
            detectionRadius: 15.0,
            attackRange: 2.3
          },
          {
            id: 'ruins-sentinel-2',
            name: 'Ridge Guardian',
            patrolCenter: new THREE.Vector3(26, 0, -48),
            patrolRadius: 6.5,
            health: 100,
            damage: 15,
            detectionRadius: 16.0,
            attackRange: 2.3
          },
          {
            id: 'ruins-golem-3',
            name: 'Ruins Gatekeeper',
            patrolCenter: new THREE.Vector3(34, 0, -66),
            patrolRadius: 6.0,
            health: 110,
            damage: 18,
            detectionRadius: 16.0,
            attackRange: 2.4
          },
          {
            id: 'grimfang-alpha',
            name: 'Grimfang (Shadow Stalker)',
            patrolCenter: new THREE.Vector3(-22, 0, -45),
            patrolRadius: 5.0,
            health: 130,
            damage: 18,
            detectionRadius: 14.0,
            attackRange: 2.3
          }
        ]
      : [
          // STAGE 2: THE ANCIENT RUINS (4 Elite & Stronger Guardians)
          {
            id: 'elite-golem-1',
            name: 'Void Golem Alpha',
            patrolCenter: new THREE.Vector3(-14, 0, -14),
            patrolRadius: 5.5,
            health: 160,
            damage: 25,
            detectionRadius: 17.0,
            attackRange: 2.4,
            chaseSpeed: 5.2,
            attackCooldown: 1.3
          },
          {
            id: 'elite-golem-2',
            name: 'Void Golem Beta',
            patrolCenter: new THREE.Vector3(14, 0, -14),
            patrolRadius: 5.5,
            health: 160,
            damage: 25,
            detectionRadius: 17.0,
            attackRange: 2.4,
            chaseSpeed: 5.2,
            attackCooldown: 1.3
          },
          {
            id: 'elite-sentinel-3',
            name: 'Sanctuary Warden',
            patrolCenter: new THREE.Vector3(0, 0, 18),
            patrolRadius: 6.0,
            health: 190,
            damage: 28,
            detectionRadius: 18.0,
            attackRange: 2.5,
            chaseSpeed: 5.4,
            attackCooldown: 1.2
          },
          {
            id: 'ruins-colossus-boss',
            name: 'Ancient Colossus',
            patrolCenter: new THREE.Vector3(0, 0, -2),
            patrolRadius: 4.5,
            health: 240,
            damage: 35,
            detectionRadius: 20.0,
            attackRange: 2.6,
            chaseSpeed: 5.5,
            attackCooldown: 1.1
          }
        ];

    guardianConfigs.forEach(cfg => {
      const enemy = new Enemy(this.scene, this.physicsWorld, cfg);
      // Custom elite stats if provided
      if (cfg.chaseSpeed) enemy.chaseSpeed = cfg.chaseSpeed;
      if (cfg.attackCooldown) enemy.attackCooldown = cfg.attackCooldown;
      this.enemies.push(enemy);
    });

    // In Stage 1: The Dark Forest, spawn Malakor the Verdant Colossus in the Ancient Grove
    if (levelIndex === 0) {
      this.boss = new BossGuardian(this.scene, this.physicsWorld, {
        id: 'boss-malakor',
        name: 'Malakor, Verdant Colossus',
        center: new THREE.Vector3(-38, 0, -66),
        health: 450,
        maxHealth: 450,
        damage: 22
      });
      this.enemies.push(this.boss);
    }

    await Promise.all(this.enemies.map(e => e.init()));
  }

  update(deltaTime, playerOrPosition, isCombatActive = true) {
    const target = isCombatActive ? playerOrPosition : null;
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(deltaTime, target);
    }
  }

  getEnemies() {
    return this.enemies;
  }

  getBoss() {
    return this.boss;
  }

  clear() {
    this.enemies.forEach(enemy => {
      if (typeof enemy.dispose === 'function') {
        enemy.dispose();
      }
      if (enemy.mesh && enemy.mesh.parent) {
        enemy.mesh.parent.remove(enemy.mesh);
      }
    });
    this.enemies = [];
    this.boss = null;
  }
}
