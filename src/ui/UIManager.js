export class UIManager {
  constructor() {
    this.loadingScreen = document.getElementById('loading-screen');
    this.progressBar = document.getElementById('progress-bar');
    this.loadingStatus = document.getElementById('loading-status');
    this.errorScreen = document.getElementById('error-screen');
    this.errorMessage = document.getElementById('error-message');

    // Main Menu
    this.mainMenu = document.getElementById('main-menu');
    this.menuBtnContinue = document.getElementById('menu-btn-continue');
    this.menuBtnPlay = document.getElementById('menu-btn-play');
    this.menuBtnSettings = document.getElementById('menu-btn-settings');
    this.menuBtnControls = document.getElementById('menu-btn-controls');
    this.menuBtnCredits = document.getElementById('menu-btn-credits');

    // Modals
    this.modalSettings = document.getElementById('modal-settings');
    this.modalControls = document.getElementById('modal-controls');
    this.modalCredits = document.getElementById('modal-credits');
    this.closeSettingsBtn = document.getElementById('close-settings-btn');
    this.closeControlsBtn = document.getElementById('close-controls-btn');
    this.closeCreditsBtn = document.getElementById('close-credits-btn');

    // Settings Controls
    this.settingMasterVol = document.getElementById('setting-master-vol');
    this.masterVolNum = document.getElementById('master-vol-num');
    this.settingMusicVol = document.getElementById('setting-music-vol');
    this.musicVolNum = document.getElementById('music-vol-num');
    this.settingSfxVol = document.getElementById('setting-sfx-vol');
    this.sfxVolNum = document.getElementById('sfx-vol-num');
    this.settingMuteToggle = document.getElementById('setting-mute-toggle');

    this.settingMouseSens = document.getElementById('setting-mouse-sens');
    this.mouseSensNum = document.getElementById('mouse-sens-num');
    this.settingInvertY = document.getElementById('setting-invert-y');

    this.gfxHighBtn = document.getElementById('gfx-high-btn');
    this.gfxMedBtn = document.getElementById('gfx-med-btn');
    this.gfxLowBtn = document.getElementById('gfx-low-btn');

    // In-Game HUD
    this.uiOverlay = document.getElementById('ui-overlay');
    this.stageBadge = document.getElementById('stage-badge');
    this.scoreText = document.getElementById('score-text');
    this.healthFill = document.getElementById('health-fill');
    this.healthText = document.getElementById('health-text');
    this.crystalText = document.getElementById('crystal-text');
    this.crystalCounter = document.getElementById('crystal-counter');
    this.movementStanceBadge = document.getElementById('movement-stance-badge');
    this.stanceIcon = document.getElementById('stance-icon');
    this.stanceLabel = document.getElementById('stance-label');
    this.muteBtn = document.getElementById('mute-btn');
    this.muteIcon = document.getElementById('mute-icon');

    // Targeted Enemy HUD (Top Center)
    this.targetedEnemyHud = document.getElementById('targeted-enemy-hud');
    this.enemyHudName = document.getElementById('enemy-hud-name');
    this.enemyHudHp = document.getElementById('enemy-hud-hp');
    this.enemyHudFill = document.getElementById('enemy-hud-fill');

    // Interaction Prompt Banner
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.interactionPromptText = document.getElementById('interaction-prompt-text');

    // Quest UI Elements
    this.questTitle = document.getElementById('quest-title');
    this.objEnemies = document.getElementById('obj-enemies');
    this.objCrystals = document.getElementById('obj-crystals');
    this.objEntrance = document.getElementById('obj-entrance');
    this.objExit = document.getElementById('obj-exit');

    // Notifications
    this.unlockBanner = document.getElementById('unlock-banner');
    this.unlockBannerText = document.getElementById('unlock-banner-text');
    this.collectToast = document.getElementById('collect-toast');
    this.toastText = document.getElementById('toast-text');
    this.pointerLockHint = document.getElementById('pointer-lock-hint');

    // Overlays
    this.levelTransitionOverlay = document.getElementById('level-transition-overlay');
    this.damageVignette = document.getElementById('damage-vignette');

    // Pause Screen
    this.pauseScreen = document.getElementById('pause-screen');
    this.resumeBtn = document.getElementById('resume-btn');
    this.pauseSaveBtn = document.getElementById('pause-save-btn');
    this.pauseLoadBtn = document.getElementById('pause-load-btn');
    this.pauseRestartBtn = document.getElementById('pause-restart-btn');
    this.pauseSettingsBtn = document.getElementById('pause-settings-btn');
    this.pauseMenuBtn = document.getElementById('pause-menu-btn');

    // Save Status Indicator
    this.saveIndicator = document.getElementById('save-indicator');
    this.saveIndicatorText = document.getElementById('save-indicator-text');
    this.saveIndicatorIcon = document.getElementById('save-indicator-icon');
    this.saveIndicatorTimeout = null;

    // Game Over Screen
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.gameoverRetryBtn = document.getElementById('gameover-retry-btn');
    this.gameoverMenuBtn = document.getElementById('gameover-menu-btn');

    // Victory Screen
    this.victoryScreen = document.getElementById('victory-screen');
    this.victoryBadge = document.getElementById('victory-badge');
    this.victoryTitle = document.getElementById('victory-title');
    this.victorySubtitle = document.getElementById('victory-subtitle');
    this.resEnemiesLabel = document.getElementById('res-enemies-label');
    this.resEnemies = document.getElementById('res-enemies');
    this.resCrystalsLabel = document.getElementById('res-crystals-label');
    this.resCrystals = document.getElementById('res-crystals');
    this.resTime = document.getElementById('res-time');
    this.resStageScore = document.getElementById('res-stage-score');
    this.resScore = document.getElementById('res-score');
    this.nextLevelBtn = document.getElementById('next-level-btn');
    this.victoryRestartBtn = document.getElementById('victory-restart-btn');
    this.victoryMenuBtn = document.getElementById('victory-menu-btn');

    this.toastTimeout = null;
    this.bannerTimeout = null;

    this.setupModalListeners();
  }

  // ==================== MAIN MENU & MODALS ====================
  setupMainMenu({ onPlay, onContinue, onOpenSettings }) {
    if (this.menuBtnContinue) {
      this.menuBtnContinue.onclick = () => {
        if (!this.menuBtnContinue.disabled && typeof onContinue === 'function') {
          onContinue();
        }
      };
    }

    if (this.menuBtnPlay) {
      this.menuBtnPlay.onclick = () => {
        if (typeof onPlay === 'function') onPlay();
      };
    }

    if (this.menuBtnSettings) {
      this.menuBtnSettings.onclick = () => {
        this.openModal(this.modalSettings);
        if (typeof onOpenSettings === 'function') onOpenSettings();
      };
    }

    if (this.menuBtnControls) {
      this.menuBtnControls.onclick = () => this.openModal(this.modalControls);
    }

    if (this.menuBtnCredits) {
      this.menuBtnCredits.onclick = () => this.openModal(this.modalCredits);
    }
  }

  setContinueButtonEnabled(enabled, metaText = '') {
    if (!this.menuBtnContinue) return;

    if (enabled) {
      this.menuBtnContinue.removeAttribute('disabled');
      this.menuBtnContinue.classList.remove('disabled');
      this.menuBtnContinue.classList.add('primary');
      if (this.menuBtnPlay) {
        this.menuBtnPlay.classList.remove('primary');
      }
      this.menuBtnContinue.title = metaText ? `Resume adventure: ${metaText}` : 'Resume saved adventure';
    } else {
      this.menuBtnContinue.setAttribute('disabled', 'true');
      this.menuBtnContinue.classList.add('disabled');
      this.menuBtnContinue.classList.remove('primary');
      if (this.menuBtnPlay) {
        this.menuBtnPlay.classList.add('primary');
      }
      this.menuBtnContinue.title = 'No saved adventure found';
    }
  }

  showSaveIndicator(message = 'GAME PROGRESS SAVED', type = 'success') {
    if (!this.saveIndicator) return;

    if (this.saveIndicatorText) {
      this.saveIndicatorText.textContent = message;
    }

    if (this.saveIndicatorIcon) {
      if (type === 'error') {
        this.saveIndicatorIcon.textContent = '⚠️';
      } else if (message.includes('LOAD')) {
        this.saveIndicatorIcon.textContent = '📂';
      } else {
        this.saveIndicatorIcon.textContent = '💾';
      }
    }

    this.saveIndicator.className = 'save-indicator';
    if (type === 'error') {
      this.saveIndicator.classList.add('error');
    }

    this.saveIndicator.style.animation = 'none';
    this.saveIndicator.offsetHeight; // trigger reflow
    this.saveIndicator.style.animation = 'savePulse 2.2s forwards ease-in-out';

    if (this.saveIndicatorTimeout) clearTimeout(this.saveIndicatorTimeout);
    this.saveIndicatorTimeout = setTimeout(() => {
      this.saveIndicator.classList.add('hidden');
    }, 2200);
  }

  setupModalListeners() {
    if (this.closeSettingsBtn) {
      this.closeSettingsBtn.onclick = () => this.closeModal(this.modalSettings);
    }
    if (this.closeControlsBtn) {
      this.closeControlsBtn.onclick = () => this.closeModal(this.modalControls);
    }
    if (this.closeCreditsBtn) {
      this.closeCreditsBtn.onclick = () => this.closeModal(this.modalCredits);
    }

    // Close on backdrop click
    [this.modalSettings, this.modalControls, this.modalCredits].forEach(modal => {
      if (modal) {
        modal.onclick = (e) => {
          if (e.target === modal) this.closeModal(modal);
        };
      }
    });
  }

  openModal(modal) {
    if (modal) modal.classList.remove('hidden');
  }

  closeModal(modal) {
    if (modal) modal.classList.add('hidden');
  }

  showMainMenu() {
    if (this.mainMenu) this.mainMenu.classList.remove('hidden');
    if (this.uiOverlay) this.uiOverlay.classList.add('hidden');
    this.hidePause();
    this.hideGameOver();
    this.hideVictoryScreen();
  }

  hideMainMenu() {
    if (this.mainMenu) this.mainMenu.classList.add('hidden');
    if (this.uiOverlay) this.uiOverlay.classList.remove('hidden');
  }

  // ==================== SETTINGS CONFIGURATION ====================
  setupSettings({ audioManager, cameraManager, onSetGraphics, saveManager = null }) {
    const saved = saveManager ? saveManager.loadSettings() : null;

    // 1. Audio
    if (audioManager) {
      const syncMuteUI = (isMuted) => {
        if (this.settingMuteToggle) this.settingMuteToggle.checked = isMuted;
        if (this.muteIcon) this.muteIcon.textContent = isMuted ? '🔇' : '🔊';
        if (this.muteBtn) this.muteBtn.style.borderColor = isMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
      };

      if (saved) {
        if (typeof saved.masterVolume === 'number') {
          audioManager.setMasterVolume(saved.masterVolume);
          if (this.settingMasterVol) this.settingMasterVol.value = Math.round(saved.masterVolume * 100);
          if (this.masterVolNum) this.masterVolNum.textContent = `${Math.round(saved.masterVolume * 100)}%`;
        }
        if (typeof saved.musicVolume === 'number') {
          audioManager.setMusicVolume(saved.musicVolume);
          if (this.settingMusicVol) this.settingMusicVol.value = Math.round(saved.musicVolume * 100);
          if (this.musicVolNum) this.musicVolNum.textContent = `${Math.round(saved.musicVolume * 100)}%`;
        }
        if (typeof saved.sfxVolume === 'number') {
          audioManager.setSFXVolume(saved.sfxVolume);
          if (this.settingSfxVol) this.settingSfxVol.value = Math.round(saved.sfxVolume * 100);
          if (this.sfxVolNum) this.sfxVolNum.textContent = `${Math.round(saved.sfxVolume * 100)}%`;
        }
        if (typeof saved.isMuted === 'boolean') {
          audioManager.setMute(saved.isMuted);
          syncMuteUI(saved.isMuted);
        }
      }

      if (this.settingMasterVol) {
        this.settingMasterVol.oninput = (e) => {
          const val = parseFloat(e.target.value);
          if (this.masterVolNum) this.masterVolNum.textContent = `${Math.round(val)}%`;
          audioManager.setMasterVolume(val / 100);
          if (saveManager) saveManager.saveSettings({ masterVolume: val / 100 });
        };
      }

      if (this.settingMusicVol) {
        this.settingMusicVol.oninput = (e) => {
          const val = parseFloat(e.target.value);
          if (this.musicVolNum) this.musicVolNum.textContent = `${Math.round(val)}%`;
          audioManager.setMusicVolume(val / 100);
          if (saveManager) saveManager.saveSettings({ musicVolume: val / 100 });
        };
      }

      if (this.settingSfxVol) {
        this.settingSfxVol.oninput = (e) => {
          const val = parseFloat(e.target.value);
          if (this.sfxVolNum) this.sfxVolNum.textContent = `${Math.round(val)}%`;
          audioManager.setSFXVolume(val / 100);
          if (saveManager) saveManager.saveSettings({ sfxVolume: val / 100 });
        };
      }

      if (this.settingMuteToggle) {
        this.settingMuteToggle.onchange = (e) => {
          audioManager.setMute(e.target.checked);
          syncMuteUI(e.target.checked);
          if (saveManager) saveManager.saveSettings({ isMuted: e.target.checked });
        };
      }

      if (this.muteBtn) {
        this.muteBtn.onclick = (e) => {
          e.stopPropagation();
          const isMuted = audioManager.toggleMute();
          syncMuteUI(isMuted);
          if (saveManager) saveManager.saveSettings({ isMuted });
        };
      }

      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyM') {
          const isMuted = audioManager.toggleMute();
          syncMuteUI(isMuted);
          if (saveManager) saveManager.saveSettings({ isMuted });
        }
      });
    }

    // 2. Camera Controls
    if (cameraManager) {
      if (saved) {
        if (typeof saved.mouseSensitivity === 'number') {
          cameraManager.setMouseSensitivity(saved.mouseSensitivity * 0.001);
          if (this.settingMouseSens) this.settingMouseSens.value = saved.mouseSensitivity;
          if (this.mouseSensNum) this.mouseSensNum.textContent = `${saved.mouseSensitivity.toFixed(1)}x`;
        }
        if (typeof saved.invertY === 'boolean') {
          cameraManager.setInvertY(saved.invertY);
          if (this.settingInvertY) this.settingInvertY.checked = saved.invertY;
        }
      }

      if (this.settingMouseSens) {
        this.settingMouseSens.oninput = (e) => {
          const val = parseFloat(e.target.value);
          if (this.mouseSensNum) this.mouseSensNum.textContent = `${val.toFixed(1)}x`;
          cameraManager.setMouseSensitivity(val * 0.001);
          if (saveManager) saveManager.saveSettings({ mouseSensitivity: val });
        };
      }

      if (this.settingInvertY) {
        this.settingInvertY.onchange = (e) => {
          cameraManager.setInvertY(e.target.checked);
          if (saveManager) saveManager.saveSettings({ invertY: e.target.checked });
        };
      }
    }

    // 3. Graphics Quality Presets
    const gfxButtons = [
      { btn: this.gfxHighBtn, preset: 'high' },
      { btn: this.gfxMedBtn, preset: 'medium' },
      { btn: this.gfxLowBtn, preset: 'low' }
    ];

    if (saved?.graphicsPreset) {
      gfxButtons.forEach(b => {
        if (b.btn) {
          if (b.preset === saved.graphicsPreset) b.btn.classList.add('active');
          else b.btn.classList.remove('active');
        }
      });
      if (typeof onSetGraphics === 'function') onSetGraphics(saved.graphicsPreset);
    }

    gfxButtons.forEach(({ btn, preset }) => {
      if (btn) {
        btn.onclick = () => {
          gfxButtons.forEach(b => b.btn?.classList.remove('active'));
          btn.classList.add('active');
          if (typeof onSetGraphics === 'function') onSetGraphics(preset);
          if (saveManager) saveManager.saveSettings({ graphicsPreset: preset });
        };
      }
    });
  }

  // ==================== IN-GAME HUD METHODS ====================
  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.textContent = `${score.toLocaleString()} PTS`;
    }
  }

  updatePlayerHealth(current, max) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    if (this.healthFill) {
      this.healthFill.style.width = `${pct}%`;
      if (pct > 50) {
        this.healthFill.style.background = 'linear-gradient(90deg, #10b981, #22c55e)';
        this.healthFill.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.6)';
      } else if (pct > 25) {
        this.healthFill.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
        this.healthFill.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.6)';
      } else {
        this.healthFill.style.background = 'linear-gradient(90deg, #b91c1c, #ef4444)';
        this.healthFill.style.boxShadow = '0 0 14px rgba(239, 68, 68, 0.8)';
      }
    }
    if (this.healthText) {
      this.healthText.textContent = `${Math.ceil(current)} / ${max}`;
    }
  }

  updateTargetedEnemy(enemy) {
    if (!this.targetedEnemyHud || !enemy) return;

    this.targetedEnemyHud.classList.remove('hidden');
    if (this.enemyHudName) {
      this.enemyHudName.textContent = enemy.name;
    }
    if (this.enemyHudHp) {
      this.enemyHudHp.textContent = `${Math.ceil(enemy.health)} / ${enemy.maxHealth}`;
    }
    if (this.enemyHudFill) {
      const pct = Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100));
      this.enemyHudFill.style.width = `${pct}%`;
    }
  }

  hideTargetedEnemy() {
    if (this.targetedEnemyHud) {
      this.targetedEnemyHud.classList.add('hidden');
    }
  }

  showInteractionPrompt(text) {
    if (!this.interactionPrompt) return;
    if (this.interactionPromptText) {
      this.interactionPromptText.textContent = text;
    }
    this.interactionPrompt.classList.remove('hidden');
  }

  hideInteractionPrompt() {
    if (this.interactionPrompt) {
      this.interactionPrompt.classList.add('hidden');
    }
  }

  updateMovementStance(stance) {
    if (!this.movementStanceBadge) return;
    this.movementStanceBadge.classList.remove('sprinting', 'walking');

    if (stance === 'sprint' || stance === 'SPRINTING') {
      this.movementStanceBadge.classList.add('sprinting');
      if (this.stanceIcon) this.stanceIcon.textContent = '⚡';
      if (this.stanceLabel) this.stanceLabel.textContent = 'SPRINTING';
    } else if (stance === 'walk' || stance === 'WALKING') {
      this.movementStanceBadge.classList.add('walking');
      if (this.stanceIcon) this.stanceIcon.textContent = '🚶';
      if (this.stanceLabel) this.stanceLabel.textContent = 'WALKING';
    } else {
      if (this.stanceIcon) this.stanceIcon.textContent = '🏃';
      if (this.stanceLabel) this.stanceLabel.textContent = 'RUNNING';
    }
  }

  updateStageIndicator(stageText) {
    if (this.stageBadge) {
      this.stageBadge.textContent = stageText;
    }
  }

  updateCrystalCount(collected, total) {
    if (this.crystalText) {
      this.crystalText.textContent = `CRYSTALS: ${collected} / ${total}`;
    }
    if (this.crystalCounter) {
      this.crystalCounter.classList.add('bump');
      setTimeout(() => {
        this.crystalCounter.classList.remove('bump');
      }, 300);
    }
  }

  showCollectNotification(message) {
    if (!this.collectToast || !this.toastText) return;

    this.toastText.textContent = message;
    this.collectToast.classList.remove('hidden');
    this.collectToast.style.animation = 'none';
    this.collectToast.offsetHeight;
    this.collectToast.style.animation = 'toastFade 1.6s forwards ease-out';

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.collectToast.classList.add('hidden');
    }, 1600);
  }

  updateQuestHUD(quest) {
    if (!quest) return;

    if (this.questTitle) {
      this.questTitle.textContent = quest.title;
    }

    if (this.objEnemies && quest.objEnemies) {
      const label = this.objEnemies.querySelector('.obj-label');
      if (label) label.textContent = quest.objEnemies.getDisplayString();
      if (quest.objEnemies.isCompleted) this.objEnemies.classList.add('completed');
      else this.objEnemies.classList.remove('completed');
    }

    if (this.objCrystals && quest.objCrystals) {
      const label = this.objCrystals.querySelector('.obj-label');
      if (label) label.textContent = quest.objCrystals.getDisplayString();
      if (quest.objCrystals.isCompleted) this.objCrystals.classList.add('completed');
      else this.objCrystals.classList.remove('completed');
    }

    if (this.objEntrance && quest.objEntrance) {
      const label = this.objEntrance.querySelector('.obj-label');
      if (label) label.textContent = quest.objEntrance.getDisplayString();
      if (quest.objEntrance.isCompleted) this.objEntrance.classList.add('completed');
      else this.objEntrance.classList.remove('completed');
    }

    if (this.objExit && quest.objExit) {
      const label = this.objExit.querySelector('.obj-label');
      if (label) label.textContent = quest.objExit.getDisplayString();
      if (quest.objExit.isCompleted) {
        this.objExit.classList.add('completed');
      } else if (quest.isEntranceUnlocked) {
        this.objExit.classList.add('active');
      }
    }
  }

  showEntranceUnlockedBanner(message) {
    if (!this.unlockBanner) return;
    if (this.unlockBannerText) {
      this.unlockBannerText.textContent = message;
    }
    this.unlockBanner.classList.remove('hidden');

    if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.unlockBanner.classList.add('hidden');
    }, 6000);
  }

  // ==================== PAUSE MENU ====================
  setPaused(isPaused, onResume = null, onRestart = null, onOpenSettings = null, onMainMenu = null, onSaveGame = null, onLoadGame = null) {
    if (this.pauseScreen) {
      if (isPaused) {
        this.pauseScreen.classList.remove('hidden');
        if (this.resumeBtn && onResume) this.resumeBtn.onclick = onResume;
        if (this.pauseSaveBtn && onSaveGame) this.pauseSaveBtn.onclick = onSaveGame;
        if (this.pauseLoadBtn && onLoadGame) this.pauseLoadBtn.onclick = onLoadGame;
        if (this.pauseRestartBtn && onRestart) this.pauseRestartBtn.onclick = onRestart;
        if (this.pauseSettingsBtn) {
          this.pauseSettingsBtn.onclick = () => {
            this.openModal(this.modalSettings);
            if (typeof onOpenSettings === 'function') onOpenSettings();
          };
        }
        if (this.pauseMenuBtn && onMainMenu) this.pauseMenuBtn.onclick = onMainMenu;
      } else {
        this.pauseScreen.classList.add('hidden');
      }
    }
  }

  hidePause() {
    if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
  }

  // ==================== GAME OVER SCREEN ====================
  showGameOver({ onRetry, onMainMenu }) {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    if (this.gameOverScreen) {
      this.gameOverScreen.classList.remove('hidden');
    }
    if (this.gameoverRetryBtn && onRetry) {
      this.gameoverRetryBtn.onclick = onRetry;
    }
    if (this.gameoverMenuBtn && onMainMenu) {
      this.gameoverMenuBtn.onclick = onMainMenu;
    }
  }

  hideGameOver() {
    if (this.gameOverScreen) {
      this.gameOverScreen.classList.add('hidden');
    }
  }

  // ==================== MISSION COMPLETED SCREEN ====================
  showMissionCompleted(results) {
    if (!this.victoryScreen) return;

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    if (this.victoryBadge) {
      this.victoryBadge.textContent = results.isFinalLevel ? 'CAMPAIGN COMPLETE' : 'MISSION ACCOMPLISHED';
    }
    if (this.victoryTitle && results.title) {
      this.victoryTitle.textContent = results.title;
    }
    if (this.victorySubtitle && results.subtitle) {
      this.victorySubtitle.textContent = results.subtitle;
    }

    if (this.resEnemies) {
      const req = results.enemiesRequired || 3;
      this.resEnemies.textContent = `${results.enemiesDefeated} / ${req} (+${results.enemiesDefeated * 300} pts)`;
    }
    if (this.resCrystals) {
      const req = results.crystalsRequired || 5;
      this.resCrystals.textContent = `${results.crystalsCollected} / ${req} (+${results.crystalsCollected * 200} pts)`;
    }
    if (this.resTime) {
      const mins = Math.floor(results.time / 60).toString().padStart(2, '0');
      const secs = Math.floor(results.time % 60).toString().padStart(2, '0');
      this.resTime.textContent = `${mins}:${secs}`;
    }
    if (this.resStageScore) {
      this.resStageScore.textContent = `${results.score.toLocaleString()} PTS`;
    }
    if (this.resScore) {
      const cumScore = results.cumulativeScore !== undefined ? results.cumulativeScore : results.score;
      this.resScore.textContent = `${cumScore.toLocaleString()} PTS`;
    }

    if (this.nextLevelBtn) {
      this.nextLevelBtn.textContent = results.isFinalLevel ? 'PLAY CAMPAIGN AGAIN' : 'CONTINUE TO NEXT LEVEL';
      this.nextLevelBtn.onclick = () => {
        if (typeof results.onNextLevel === 'function') results.onNextLevel();
      };
    }

    if (this.victoryRestartBtn) {
      this.victoryRestartBtn.onclick = () => {
        if (typeof results.onRestartLevel === 'function') results.onRestartLevel();
      };
    }

    if (this.victoryMenuBtn) {
      this.victoryMenuBtn.onclick = () => {
        if (typeof results.onMainMenu === 'function') results.onMainMenu();
      };
    }

    this.victoryScreen.classList.remove('hidden');
  }

  hideVictoryScreen() {
    if (this.victoryScreen) {
      this.victoryScreen.classList.add('hidden');
    }
  }

  async transitionLevel(callback) {
    if (this.levelTransitionOverlay) {
      this.levelTransitionOverlay.classList.add('active');
      await new Promise(r => setTimeout(r, 450));
    }

    if (typeof callback === 'function') {
      await callback();
    }

    if (this.levelTransitionOverlay) {
      await new Promise(r => setTimeout(r, 150));
      this.levelTransitionOverlay.classList.remove('active');
    }
  }

  setLoadingProgress(percent, message = '') {
    if (this.progressBar) {
      this.progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    if (this.loadingStatus && message) {
      this.loadingStatus.textContent = message;
    }
  }

  hideLoadingScreen(delay = 500) {
    if (!this.loadingScreen) return;
    setTimeout(() => {
      this.loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        this.loadingScreen.style.display = 'none';
      }, 800);
    }, delay);
  }

  updatePointerLockHint(isLocked) {
    if (this.pointerLockHint) {
      if (isLocked) this.pointerLockHint.classList.add('locked');
      else this.pointerLockHint.classList.remove('locked');
    }
  }

  showError(message) {
    if (this.loadingScreen) this.loadingScreen.style.display = 'none';
    if (this.errorScreen && this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorScreen.classList.remove('hidden');
    }
  }
}
