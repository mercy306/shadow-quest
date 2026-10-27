/**
 * SkillTreeSystem.js
 * Implements the RPG skill-tree branches, prerequisites, point allocation,
 * respec system, and passive/active combat bonus calculations.
 */

export const SKILL_BRANCHES = {
  SWORD_MASTERY: 'sword_mastery',
  SURVIVAL: 'survival',
  MOBILITY: 'mobility'
};

export const SKILL_DEFINITIONS = {
  // ==================== BRANCH 1: SWORD MASTERY ====================
  sword_precision: {
    id: 'sword_precision',
    branch: SKILL_BRANCHES.SWORD_MASTERY,
    name: 'Sword Precision',
    icon: '⚔️',
    maxRank: 3,
    prerequisite: null,
    costPerRank: 1,
    description: 'Hones edge alignment and striking technique, substantially increasing melee attack damage.',
    rankBonuses: [
      { damageBonus: 12, text: '+12 Attack Damage' },
      { damageBonus: 25, text: '+25 Attack Damage' },
      { damageBonus: 40, text: '+40 Attack Damage' }
    ]
  },
  heavy_strike: {
    id: 'heavy_strike',
    branch: SKILL_BRANCHES.SWORD_MASTERY,
    name: 'Heavy Spin Slash',
    icon: '🌀',
    maxRank: 2,
    prerequisite: { skillId: 'sword_precision', rank: 1 },
    costPerRank: 1,
    description: 'Unlocks a devastating 360° whirlwind attack [Q or Right-Click] that strikes all surrounding foes.',
    rankBonuses: [
      { unlocksHeavyAttack: true, heavyDamageMult: 2.2, heavyCooldown: 4.5, text: 'Unlocks 360° Spin Slash (220% DMG, 4.5s CD, 30 Stamina)' },
      { unlocksHeavyAttack: true, heavyDamageMult: 2.6, heavyCooldown: 4.0, text: 'Empowered Spin Slash (260% DMG, 4.0s CD, 25 Stamina)' }
    ]
  },
  blade_flow: {
    id: 'blade_flow',
    branch: SKILL_BRANCHES.SWORD_MASTERY,
    name: 'Blade Flow',
    icon: '💫',
    maxRank: 1,
    prerequisite: { skillId: 'heavy_strike', rank: 1 },
    costPerRank: 1,
    description: 'Streamlines blade momentum, cutting swing recovery time and reducing Heavy Spin Slash cooldown.',
    rankBonuses: [
      { attackCooldownReduction: 0.12, heavyCooldownReduction: 1.5, text: '-1.5s Heavy Spin Cooldown & +15% Faster Normal Swings' }
    ]
  },

  // ==================== BRANCH 2: SURVIVAL ====================
  iron_constitution: {
    id: 'iron_constitution',
    branch: SKILL_BRANCHES.SURVIVAL,
    name: 'Iron Constitution',
    icon: '❤️',
    maxRank: 3,
    prerequisite: null,
    costPerRank: 1,
    description: 'Fortifies vital essence and bloodline vigor, significantly expanding maximum health pool.',
    rankBonuses: [
      { healthBonus: 30, text: '+30 Maximum Health' },
      { healthBonus: 65, text: '+65 Maximum Health' },
      { healthBonus: 105, text: '+105 Maximum Health' }
    ]
  },
  thick_skin: {
    id: 'thick_skin',
    branch: SKILL_BRANCHES.SURVIVAL,
    name: 'Thick Skin',
    icon: '🛡️',
    maxRank: 3,
    prerequisite: null,
    costPerRank: 1,
    description: 'Hardens flesh and armor reinforcement to mitigate incoming hostile strikes.',
    rankBonuses: [
      { defenseBonus: 12, text: '+12 Defense Rating' },
      { defenseBonus: 25, text: '+25 Defense Rating' },
      { defenseBonus: 42, text: '+42 Defense Rating' }
    ]
  },
  second_wind: {
    id: 'second_wind',
    branch: SKILL_BRANCHES.SURVIVAL,
    name: 'Second Wind',
    icon: '🌿',
    maxRank: 1,
    prerequisite: { skillId: 'iron_constitution', rank: 1 },
    costPerRank: 1,
    description: 'Channels nature vitality to gently mend flesh while resting out of active combat.',
    rankBonuses: [
      { outOfCombatRegen: 3.5, regenDelay: 4.0, text: 'Regenerate 3.5 HP/sec when out of combat for 4s' }
    ]
  },

  // ==================== BRANCH 3: MOBILITY ====================
  fleet_footed: {
    id: 'fleet_footed',
    branch: SKILL_BRANCHES.MOBILITY,
    name: 'Fleet Footed',
    icon: '⚡',
    maxRank: 3,
    prerequisite: null,
    costPerRank: 1,
    description: 'Increases sprint locomotion agility and mitigates continuous sprint stamina consumption.',
    rankBonuses: [
      { sprintSpeedBonus: 0.15, sprintStaminaDrainReduction: 0.20, text: '+15% Sprint Speed & -20% Sprint Stamina Drain' },
      { sprintSpeedBonus: 0.30, sprintStaminaDrainReduction: 0.40, text: '+30% Sprint Speed & -40% Sprint Stamina Drain' },
      { sprintSpeedBonus: 0.45, sprintStaminaDrainReduction: 0.60, text: '+45% Sprint Speed & -60% Sprint Stamina Drain' }
    ]
  },
  acrobat: {
    id: 'acrobat',
    branch: SKILL_BRANCHES.MOBILITY,
    name: 'Shadow Roll',
    icon: '💨',
    maxRank: 3,
    prerequisite: null,
    costPerRank: 1,
    description: 'Enhances evasion roll [V / Alt] with reduced stamina expense and expanded invulnerability windows.',
    rankBonuses: [
      { rollStaminaReduction: 0.25, rollIFrameBonus: 0.08, text: '-25% Dodge Stamina Cost & +0.08s Dodge Invulnerability' },
      { rollStaminaReduction: 0.50, rollIFrameBonus: 0.16, text: '-50% Dodge Stamina Cost & +0.16s Dodge Invulnerability' },
      { rollStaminaReduction: 0.75, rollIFrameBonus: 0.25, text: '-75% Dodge Stamina Cost & +0.25s Dodge Invulnerability' }
    ]
  },
  adrenaline_surge: {
    id: 'adrenaline_surge',
    branch: SKILL_BRANCHES.MOBILITY,
    name: 'Adrenaline Surge',
    icon: '🔥',
    maxRank: 1,
    prerequisite: { skillId: 'fleet_footed', rank: 1 },
    costPerRank: 1,
    description: 'Surges stamina reserve with immediate vitality whenever an enemy is defeated or assassinated.',
    rankBonuses: [
      { staminaOnKill: 35, text: 'Instantly restore +35 Stamina on every enemy kill or takedown' }
    ]
  }
};

export const RESPEC_GOLD_COST = 100;

export class SkillTreeSystem {
  constructor() {
    this.ranks = {};
    for (const key of Object.keys(SKILL_DEFINITIONS)) {
      this.ranks[key] = 0;
    }
  }

  getSkill(skillId) {
    return SKILL_DEFINITIONS[skillId] || null;
  }

  getRank(skillId) {
    return this.ranks[skillId] || 0;
  }

  setRank(skillId, rank) {
    if (SKILL_DEFINITIONS[skillId]) {
      const max = SKILL_DEFINITIONS[skillId].maxRank;
      this.ranks[skillId] = Math.max(0, Math.min(max, Math.floor(rank || 0)));
    }
  }

  /**
   * Checks if a skill is eligible to be unlocked or upgraded
   */
  canUpgrade(skillId, player) {
    const def = SKILL_DEFINITIONS[skillId];
    if (!def) return { allowed: false, reason: 'Skill does not exist.' };

    const currentRank = this.getRank(skillId);
    if (currentRank >= def.maxRank) {
      return { allowed: false, reason: 'Skill has reached maximum rank.' };
    }

    const availableSP = player ? (player.skillPoints || 0) : 0;
    if (availableSP < def.costPerRank) {
      return { allowed: false, reason: `Requires ${def.costPerRank} Skill Point (You have ${availableSP}).` };
    }

    if (def.prerequisite) {
      const prereqRank = this.getRank(def.prerequisite.skillId);
      if (prereqRank < def.prerequisite.rank) {
        const prereqDef = SKILL_DEFINITIONS[def.prerequisite.skillId];
        const prereqName = prereqDef ? prereqDef.name : def.prerequisite.skillId;
        return {
          allowed: false,
          reason: `Requires ${prereqName} Rank ${def.prerequisite.rank} (Current: ${prereqRank}).`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Upgrades skill rank and consumes 1 Skill Point
   */
  upgradeSkill(skillId, player) {
    const check = this.canUpgrade(skillId, player);
    if (!check.allowed) {
      return { success: false, reason: check.reason };
    }

    const def = SKILL_DEFINITIONS[skillId];
    const cost = def.costPerRank;

    player.skillPoints = Math.max(0, player.skillPoints - cost);
    player.spentSkillPoints = (player.spentSkillPoints || 0) + cost;
    this.ranks[skillId] = (this.ranks[skillId] || 0) + 1;

    // Recalculate stats immediately
    if (typeof player.recalculateStats === 'function') {
      player.recalculateStats();
    }

    return {
      success: true,
      skillId,
      newRank: this.ranks[skillId],
      maxRank: def.maxRank,
      remainingSkillPoints: player.skillPoints
    };
  }

  /**
   * Resets all allocated skills, refunds 100% of spent SP, and deducts 100 Gold fee
   */
  respec(player, cost = RESPEC_GOLD_COST) {
    if (!player) return { success: false, reason: 'Player entity not available.' };

    const currentGold = player.gold || 0;
    if (currentGold < cost) {
      return {
        success: false,
        reason: `Insufficient gold for skill respec. Requires ${cost} Gold (Current: ${currentGold} G).`
      };
    }

    let totalPointsSpent = player.spentSkillPoints || 0;
    if (totalPointsSpent === 0) {
      // Also calculate from actual ranks if spentSkillPoints was uninitialized
      for (const [id, rank] of Object.entries(this.ranks)) {
        totalPointsSpent += rank;
      }
    }

    if (totalPointsSpent <= 0) {
      return { success: false, reason: 'No skill points have been allocated to reset.' };
    }

    // Deduct respec fee
    player.gold = currentGold - cost;

    // Refund points
    player.skillPoints = (player.skillPoints || 0) + totalPointsSpent;
    player.spentSkillPoints = 0;

    // Zero out all ranks
    for (const key of Object.keys(this.ranks)) {
      this.ranks[key] = 0;
    }

    // Recompute stats
    if (typeof player.recalculateStats === 'function') {
      player.recalculateStats();
    }

    return {
      success: true,
      refundedPoints: totalPointsSpent,
      newGold: player.gold,
      availableSkillPoints: player.skillPoints
    };
  }

  /**
   * Aggregates all active combat, health, and mobility bonuses from unlocked ranks
   */
  getBonuses() {
    const bonuses = {
      damage: 0,
      maxHealth: 0,
      defense: 0,
      sprintSpeedMultiplier: 1.0,
      sprintStaminaDrainReduction: 0,
      rollStaminaReduction: 0,
      rollIFrameBonus: 0,
      unlocksHeavyAttack: false,
      heavyDamageMult: 2.0,
      heavyCooldown: 4.5,
      attackCooldownReduction: 0,
      outOfCombatRegen: 0,
      staminaOnKill: 0
    };

    for (const [skillId, rank] of Object.entries(this.ranks)) {
      if (rank <= 0) continue;
      const def = SKILL_DEFINITIONS[skillId];
      if (!def || !def.rankBonuses) continue;

      const activeRankIndex = Math.min(rank, def.rankBonuses.length) - 1;
      const currentRankBonus = def.rankBonuses[activeRankIndex];
      if (!currentRankBonus) continue;

      if (currentRankBonus.damageBonus) bonuses.damage += currentRankBonus.damageBonus;
      if (currentRankBonus.healthBonus) bonuses.maxHealth += currentRankBonus.healthBonus;
      if (currentRankBonus.defenseBonus) bonuses.defense += currentRankBonus.defenseBonus;
      if (currentRankBonus.sprintSpeedBonus) bonuses.sprintSpeedMultiplier += currentRankBonus.sprintSpeedBonus;
      if (currentRankBonus.sprintStaminaDrainReduction) bonuses.sprintStaminaDrainReduction = Math.max(bonuses.sprintStaminaDrainReduction, currentRankBonus.sprintStaminaDrainReduction);
      if (currentRankBonus.rollStaminaReduction) bonuses.rollStaminaReduction = Math.max(bonuses.rollStaminaReduction, currentRankBonus.rollStaminaReduction);
      if (currentRankBonus.rollIFrameBonus) bonuses.rollIFrameBonus += currentRankBonus.rollIFrameBonus;
      if (currentRankBonus.unlocksHeavyAttack) bonuses.unlocksHeavyAttack = true;
      if (currentRankBonus.heavyDamageMult) bonuses.heavyDamageMult = currentRankBonus.heavyDamageMult;
      if (currentRankBonus.heavyCooldown) bonuses.heavyCooldown = currentRankBonus.heavyCooldown;
      if (currentRankBonus.attackCooldownReduction) bonuses.attackCooldownReduction += currentRankBonus.attackCooldownReduction;
      if (currentRankBonus.heavyCooldownReduction) bonuses.heavyCooldown = Math.max(1.5, bonuses.heavyCooldown - currentRankBonus.heavyCooldownReduction);
      if (currentRankBonus.outOfCombatRegen) bonuses.outOfCombatRegen += currentRankBonus.outOfCombatRegen;
      if (currentRankBonus.staminaOnKill) bonuses.staminaOnKill += currentRankBonus.staminaOnKill;
    }

    return bonuses;
  }

  getSaveState() {
    return { ...this.ranks };
  }

  restoreSaveState(state) {
    if (!state || typeof state !== 'object') return;
    for (const key of Object.keys(SKILL_DEFINITIONS)) {
      if (typeof state[key] === 'number') {
        this.setRank(key, state[key]);
      } else {
        this.ranks[key] = 0;
      }
    }
  }
}
