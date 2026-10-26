/**
 * Declarative Quest and Objective system independent of rendering.
 */
export class QuestObjective {
  constructor(id, text, target = 1, current = 0) {
    this.id = id;
    this.text = text;
    this.target = target;
    this.current = current;
    this.isCompleted = this.current >= this.target;
    this.statusText = '';
  }

  updateProgress(amount = 1) {
    this.current = Math.min(this.target, this.current + amount);
    if (this.current >= this.target) {
      this.isCompleted = true;
    }
    return this.isCompleted;
  }

  setStatus(statusText, completed = false) {
    this.statusText = statusText;
    this.isCompleted = completed;
  }

  getDisplayString() {
    if (this.statusText) {
      return `${this.text}: ${this.statusText}`;
    }
    return `${this.text}: ${this.current} / ${this.target}`;
  }
}

export class Quest {
  constructor(config = {}) {
    this.id = config.id || 'mission-1';
    this.title = config.title || 'RESTORE THE FOREST';
    this.description = config.description || 'Defeat the hostile guardians, gather magical crystals, and unlock the ancient ruins portal.';
    this.enemiesRequired = config.enemiesRequired ?? 3;
    this.crystalsRequired = config.crystalsRequired ?? 5;
    this.enemiesLabel = config.enemiesLabel || 'Enemies defeated';
    this.crystalsLabel = config.crystalsLabel || 'Crystals collected';
    this.entranceLabel = config.entranceLabel || 'Ancient entrance';
    this.exitLabel = config.exitLabel || 'Ruins Exit Portal';

    this.objectives = [];
    this.isCompleted = false;
    this.isEntranceUnlocked = false;

    this.startTime = Date.now();
    this.completionTime = 0;
    this.score = 0;

    // Callbacks for decoupled listeners (UI, Audio, Environment)
    this.onProgressCallbacks = [];
    this.onEntranceUnlockedCallbacks = [];
    this.onCompletedCallbacks = [];

    this.initObjectives();
  }

  initObjectives() {
    this.objEnemies = new QuestObjective('defeat_enemies', this.enemiesLabel, this.enemiesRequired, 0);
    this.objCrystals = new QuestObjective('collect_crystals', this.crystalsLabel, this.crystalsRequired, 0);
    this.objEntrance = new QuestObjective('unlock_entrance', this.entranceLabel, 1, 0);
    this.objEntrance.setStatus('Locked', false);
    this.objExit = new QuestObjective('enter_exit', this.exitLabel, 1, 0);
    this.objExit.setStatus('Sealed', false);

    this.objectives = [
      this.objEnemies,
      this.objCrystals,
      this.objEntrance,
      this.objExit
    ];
  }

  onEnemyDefeated(enemy) {
    if (this.isCompleted) return;
    this.objEnemies.updateProgress(1);
    this.checkUnlockConditions();
    this.notifyProgress();
  }

  onCrystalCollected(crystal) {
    if (this.isCompleted) return;
    this.objCrystals.updateProgress(1);
    this.checkUnlockConditions();
    this.notifyProgress();
  }

  checkUnlockConditions() {
    if (!this.isEntranceUnlocked && this.objEnemies.isCompleted && this.objCrystals.isCompleted) {
      this.isEntranceUnlocked = true;
      this.objEntrance.setStatus('UNLOCKED', true);
      this.objExit.setStatus('ACTIVE (Enter Portal)', false);

      this.onEntranceUnlockedCallbacks.forEach(cb => cb());
    }
  }

  onEnterExitArea() {
    if (!this.isEntranceUnlocked || this.isCompleted) return false;

    this.isCompleted = true;
    this.completionTime = (Date.now() - this.startTime) / 1000;
    this.objExit.setStatus('COMPLETED', true);

    // Calculate score
    const enemyScore = this.objEnemies.current * 300;
    const crystalScore = this.objCrystals.current * 200;
    const timeBonus = Math.max(0, Math.floor(1500 - this.completionTime * 8));
    this.score = enemyScore + crystalScore + timeBonus;

    const results = {
      id: this.id,
      title: this.title,
      score: this.score,
      time: this.completionTime,
      enemiesDefeated: this.objEnemies.current,
      enemiesRequired: this.enemiesRequired,
      crystalsCollected: this.objCrystals.current,
      crystalsRequired: this.crystalsRequired
    };

    this.notifyProgress();
    this.onCompletedCallbacks.forEach(cb => cb(results));
    return true;
  }

  notifyProgress() {
    this.onProgressCallbacks.forEach(cb => cb(this));
  }

  onProgress(callback) {
    this.onProgressCallbacks.push(callback);
  }

  onEntranceUnlocked(callback) {
    this.onEntranceUnlockedCallbacks.push(callback);
  }

  onCompleted(callback) {
    this.onCompletedCallbacks.push(callback);
  }
}
