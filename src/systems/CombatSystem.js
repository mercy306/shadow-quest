import * as THREE from 'three';

export class CombatSystem {
  constructor(player, enemyManager, questSystem = null, audioManager = null, uiManager = null, vfxManager = null) {
    this.player = player;
    this.enemyManager = enemyManager;
    this.questSystem = questSystem;
    this.audioManager = audioManager;
    this.uiManager = uiManager;
    this.vfxManager = vfxManager;
    this.npcManager = null;
  }

  setNPCManager(npcManager) {
    this.npcManager = npcManager;
  }

  setManagers({ questSystem, audioManager, uiManager, vfxManager }) {
    if (questSystem) this.questSystem = questSystem;
    if (audioManager) this.audioManager = audioManager;
    if (uiManager) this.uiManager = uiManager;
    if (vfxManager) this.vfxManager = vfxManager;
  }

  init() {
    if (this.player && this.uiManager) {
      this.uiManager.updatePlayerHealth(this.player.health, this.player.maxHealth);
    }
  }

  update(deltaTime) {
    if (!this.player || !this.enemyManager) return;

    // 1. Check player melee swing hitbox against nearby enemies
    if (this.player.isAttacking && !this.player.hasDealtDamageThisSwing) {
      const playerPos = this.player.getPosition();
      const forward = this.player.getForwardVector();
      const attackReach = 2.6;
      const enemies = this.enemyManager.getEnemies();

      let hitAny = false;

      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy.isAlive()) continue;

        const dx = enemy.position.x - playerPos.x;
        const dz = enemy.position.z - playerPos.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= attackReach) {
          // Angle check: enemy must be in front cone of player
          const dirX = dx / dist;
          const dirZ = dz / dist;
          const dot = forward.x * dirX + forward.z * dirZ;

          if (dot > 0.2) { // ~78-degree forward cone
            hitAny = true;
            const wasAlive = enemy.isAlive();
            const isTakedown = Boolean(enemy.isEligibleForTakedown);
            const isBoss = Boolean(enemy.isBoss || enemy.id === 'grimfang-alpha' || enemy.id === 'ruins-colossus-boss' || (enemy.name && (enemy.name.toLowerCase().includes('boss') || enemy.name.toLowerCase().includes('alpha') || enemy.name.toLowerCase().includes('colossus'))));

            // Standard enemies are defeated instantly via stealth takedown (9999 damage).
            // Bosses/elites (e.g. Grimfang Alpha, Ancient Colossus) take critical bonus damage (250%) and are stunned, preventing stealth from unintentionally trivializing or bypassing multi-phase boss mechanics.
            let damageToDeal = this.player.damage;
            if (isTakedown) {
              if (isBoss) {
                damageToDeal = Math.max(120, Math.round(this.player.damage * 2.5));
              } else {
                damageToDeal = Math.max(9999, enemy.health * 2);
              }
            }

            enemy.takeDamage(damageToDeal);

            // Audio feedback
            if (this.audioManager && typeof this.audioManager.playSwordHit === 'function') {
              this.audioManager.playSwordHit();
            }

            // Visual feedback: impact sparks, damage numbers, and enemy damage flash
            if (this.vfxManager) {
              const hitPos = new THREE.Vector3(
                playerPos.x + dx * 0.6,
                enemy.position.y + 1.2,
                playerPos.z + dz * 0.6
              );
              const sparkColor = isTakedown ? (isBoss ? 0xf43f5e : 0xc084fc) : 0xffbb33;
              const sparkCount = isTakedown ? 40 : 22;
              this.vfxManager.spawnImpactSparks(hitPos, sparkCount, sparkColor);
              this.vfxManager.flashEnemyHit(enemy);
              this.vfxManager.spawnDamageNumber(enemy.position, isTakedown ? (isBoss ? `CRIT STRIKE -${damageToDeal}` : 'CRIT TAKEDOWN!') : this.player.damage, isTakedown);
            }

            if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
              if (isTakedown) {
                if (isBoss) {
                  this.uiManager.showCollectNotification(`🗡️ CRITICAL STEALTH STRIKE on ${enemy.name}! -${damageToDeal} HP (+500 PTS)`);
                } else {
                  this.uiManager.showCollectNotification(`🗡️ STEALTH TAKEDOWN on ${enemy.name}! +500 PTS`);
                }
                if (this.questSystem && this.questSystem.currentQuest) {
                  this.questSystem.currentQuest.score = (this.questSystem.currentQuest.score || 0) + 500;
                }
              } else {
                this.uiManager.showCollectNotification(`Hit ${enemy.name}! -${this.player.damage} HP`);
              }
            }

            // If enemy died from this blow
            if (wasAlive && !enemy.isAlive()) {
              this.handleEnemyDefeat(enemy, isTakedown);
            }
          }
        }
      }

      if (hitAny) {
        this.player.hasDealtDamageThisSwing = true;
      }
    }

    // 1b. Check player Heavy Spin Slash hitbox against surrounding enemies (360-degree, 3.6m reach)
    if (this.player.isHeavyAttacking && !this.player.hasDealtDamageThisHeavyAttack) {
      const playerPos = this.player.getPosition();
      const heavyReach = 3.6;
      const enemies = this.enemyManager.getEnemies();
      const skillBonuses = this.player.skillTree ? this.player.skillTree.getBonuses() : {};
      const mult = skillBonuses.heavyDamageMult || 2.2;
      const heavyDamage = Math.round(this.player.damage * mult);

      let hitAny = false;

      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy.isAlive()) continue;

        const dx = enemy.position.x - playerPos.x;
        const dz = enemy.position.z - playerPos.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= heavyReach) {
          hitAny = true;
          const wasAlive = enemy.isAlive();
          enemy.takeDamage(heavyDamage);

          if (this.audioManager && typeof this.audioManager.playSwordHit === 'function') {
            this.audioManager.playSwordHit();
          }

          if (this.vfxManager) {
            const hitPos = new THREE.Vector3(
              playerPos.x + dx * 0.7,
              enemy.position.y + 1.2,
              playerPos.z + dz * 0.7
            );
            this.vfxManager.spawnImpactSparks(hitPos, 35, 0x38bdf8);
            this.vfxManager.flashEnemyHit(enemy);
            this.vfxManager.spawnDamageNumber(enemy.position, `HEAVY -${heavyDamage}`, true);
          }

          if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
            this.uiManager.showCollectNotification(`🌀 Spin Slash hit ${enemy.name}! -${heavyDamage} HP`);
          }

          if (wasAlive && !enemy.isAlive()) {
            this.handleEnemyDefeat(enemy, false);
          }
        }
      }

      if (hitAny) {
        this.player.hasDealtDamageThisHeavyAttack = true;
      }
    }

    // 2. Check enemies attacking the player
    const enemies = this.enemyManager.getEnemies();
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.isAlive()) continue;

      if (enemy.isAttacking) {
        // Strike window at ~40% of attack duration
        if (!enemy.hasStruckThisAttack && enemy.attackElapsedTime >= enemy.attackDuration * 0.4) {
          enemy.hasStruckThisAttack = true;

          if (this.audioManager && typeof this.audioManager.playEnemyAttack === 'function') {
            this.audioManager.playEnemyAttack();
          }

          const playerPos = this.player.getPosition();
          const dist = Math.hypot(enemy.position.x - playerPos.x, enemy.position.z - playerPos.z);

          if (dist <= enemy.attackRange + 0.4) {
            // Player takes damage!
            this.player.takeDamage(enemy.damage);

            if (this.vfxManager) {
              this.vfxManager.triggerPlayerDamageFlash();
              this.vfxManager.spawnImpactSparks(playerPos, 16, 0xef4444);
              this.vfxManager.spawnDamageNumber(playerPos, enemy.damage, true);
            }

            if (this.uiManager && typeof this.uiManager.updatePlayerHealth === 'function') {
              this.uiManager.updatePlayerHealth(this.player.health, this.player.maxHealth);
            }
          }
        }
      } else {
        enemy.hasStruckThisAttack = false;
      }
    }

    // 3. Update active sword trail
    if (this.vfxManager && this.player) {
      const tipPos = this.player.getSwordTipPosition();
      const basePos = this.player.getSwordBasePosition();
      this.vfxManager.updateSwordTrail(this.player.isAttacking, tipPos, basePos);
    }

    // 4. Update Targeted Enemy HUD (Closest hostile within 16m or engaging in combat)
    if (this.uiManager && this.player) {
      const playerPos = this.player.getPosition();
      let closestEnemy = null;
      let closestDist = 16.0;

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.isAlive()) continue;
        const d = Math.hypot(e.position.x - playerPos.x, e.position.z - playerPos.z);
        if (d < closestDist) {
          closestDist = d;
          closestEnemy = e;
        }
      }

      if (closestEnemy) {
        this.uiManager.updateTargetedEnemy(closestEnemy);
      } else {
        this.uiManager.hideTargetedEnemy();
      }

      // 5. Contextual Interaction Prompts
      const quest = this.questSystem ? this.questSystem.getCurrentQuest() : null;
      const hasNPCPrompt = this.npcManager && this.npcManager.getActiveInteractable();
      if (!hasNPCPrompt) {
        if (quest && quest.isEntranceUnlocked && this.questSystem.exitLocation) {
          const exitDist = Math.hypot(
            playerPos.x - this.questSystem.exitLocation.x,
            playerPos.z - this.questSystem.exitLocation.z
          );
          if (exitDist <= 8.0) {
            this.uiManager.showInteractionPrompt('Ancient Altar Portal is UNLOCKED — Step into the light to ascend!');
          } else if (closestEnemy && closestEnemy.isEligibleForTakedown) {
            this.uiManager.showInteractionPrompt('[F / Left Click] 🗡️ STEALTH TAKEDOWN');
          } else if (closestEnemy && closestDist <= 3.5) {
            this.uiManager.showInteractionPrompt('[Left Click / F] Strike Guardian');
          } else {
            this.uiManager.hideInteractionPrompt();
          }
        } else if (closestEnemy && closestEnemy.isEligibleForTakedown) {
          this.uiManager.showInteractionPrompt('[F / Left Click] 🗡️ STEALTH TAKEDOWN');
        } else if (closestEnemy && closestDist <= 3.5) {
          this.uiManager.showInteractionPrompt('[Left Click / F] Strike Guardian');
        } else {
          this.uiManager.hideInteractionPrompt();
        }
      }

      // 6. Live Score Calculation
      if (quest) {
        const enemiesScore = (quest.objEnemies?.current || 0) * 300;
        const crystalsScore = (quest.objCrystals?.current || 0) * 200;
        this.uiManager.updateScore(enemiesScore + crystalsScore);
      }
    }
  }

  handleEnemyDefeat(enemy, isTakedown = false) {
    if (!enemy) return;

    if (this.audioManager && typeof this.audioManager.playEnemyDeath === 'function') {
      this.audioManager.playEnemyDeath();
    }
    if (this.vfxManager) {
      this.vfxManager.spawnImpactSparks(enemy.position, 45, 0xa855f7);
    }
    if (this.questSystem) {
      this.questSystem.onEnemyDefeated(enemy);
    }

    // Award XP to player based on enemy grade & takedown bonus
    if (this.player && typeof this.player.addXP === 'function') {
      const isBoss = enemy.isBoss || enemy.id === 'grimfang-alpha';
      const baseXP = isBoss ? 150 : 60;
      const bonusXP = isTakedown ? 40 : 0;
      const totalXP = baseXP + bonusXP;
      this.player.addXP(totalXP);

      if (this.uiManager && typeof this.uiManager.showCollectNotification === 'function') {
        this.uiManager.showCollectNotification(`⚔️ ${enemy.name || 'Foe'} Defeated! +${totalXP} XP`);
      }
    }

    // Adrenaline Surge skill: restore 35 stamina on kill
    if (this.player && this.player.skillTree) {
      const bonuses = this.player.skillTree.getBonuses();
      if (bonuses.staminaOnKill > 0) {
        this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + bonuses.staminaOnKill);
        if (this.uiManager && typeof this.uiManager.updatePlayerStamina === 'function') {
          this.uiManager.updatePlayerStamina(this.player.stamina, this.player.maxStamina);
        }
      }
    }
  }
}
