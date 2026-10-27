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
    this.modalInventory = document.getElementById('modal-inventory');
    this.modalDialogue = document.getElementById('modal-dialogue');
    this.modalMerchant = document.getElementById('modal-merchant');
    this.closeSettingsBtn = document.getElementById('close-settings-btn');
    this.closeControlsBtn = document.getElementById('close-controls-btn');
    this.closeCreditsBtn = document.getElementById('close-credits-btn');
    this.closeInventoryBtn = document.getElementById('close-inventory-btn');
    this.closeDialogueBtn = document.getElementById('close-dialogue-btn');
    this.closeMerchantBtn = document.getElementById('close-merchant-btn');

    // Dialogue UI Elements
    this.dialogueAvatar = document.getElementById('dialogue-avatar');
    this.dialogueSpeakerName = document.getElementById('dialogue-speaker-name');
    this.dialogueSpeakerTitle = document.getElementById('dialogue-speaker-title');
    this.dialogueSpeechText = document.getElementById('dialogue-speech-text');
    this.dialogueChoicesContainer = document.getElementById('dialogue-choices-container');
    this.dialogueManagerRef = null;

    // Merchant UI Elements
    this.merchantGoldDisplay = document.getElementById('merchant-gold-display');
    this.merchantTabBuy = document.getElementById('merchant-tab-buy');
    this.merchantTabSell = document.getElementById('merchant-tab-sell');
    this.merchantItemsContainer = document.getElementById('merchant-items-container');
    this.merchantManagerRef = null;

    // Currency & Side Quests Elements
    this.hudGoldText = document.getElementById('hud-gold-text');
    this.invGoldBadge = document.getElementById('inv-gold-badge');
    this.sideQuestsContainer = document.getElementById('side-quests-container');
    this.sideQuestsList = document.getElementById('side-quests-list');

    // Inventory & Equipment Elements
    this.inventoryToggleBtn = document.getElementById('inventory-toggle-btn');
    this.invCapacityBadge = document.getElementById('inv-capacity-badge');
    this.invSlotsGrid = document.getElementById('inv-slots-grid');
    this.invItemDetails = document.getElementById('inv-item-details');

    this.equipWeaponName = document.getElementById('equip-weapon-name');
    this.equipWeaponStat = document.getElementById('equip-weapon-stat');
    this.unequipWeaponBtn = document.getElementById('unequip-weapon-btn');

    this.equipArmorName = document.getElementById('equip-armor-name');
    this.equipArmorStat = document.getElementById('equip-armor-stat');
    this.unequipArmorBtn = document.getElementById('unequip-armor-btn');

    this.equipTrinketName = document.getElementById('equip-trinket-name');
    this.equipTrinketStat = document.getElementById('equip-trinket-stat');
    this.unequipTrinketBtn = document.getElementById('unequip-trinket-btn');

    this.statValHealth = document.getElementById('stat-val-health');
    this.statValDamage = document.getElementById('stat-val-damage');
    this.statValDefense = document.getElementById('stat-val-defense');
    this.statValSpeed = document.getElementById('stat-val-speed');
    this.statValLevel = document.getElementById('stat-val-level');

    this.currentInventoryCategory = 'all';
    this.selectedInventorySlotIndex = null;
    this.playerRef = null;
    this.onToggleInventoryCallback = null;

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
    this.stealthIndicatorBadge = document.getElementById('stealth-indicator-badge');
    this.stealthEyeIcon = document.getElementById('stealth-eye-icon');
    this.stealthStatusText = document.getElementById('stealth-status-text');
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
    this.pauseSlotsBtn = document.getElementById('pause-slots-btn');

    // Confirmation Modal
    this.modalConfirm = document.getElementById('modal-confirm');
    this.confirmModalTitle = document.getElementById('confirm-modal-title');
    this.confirmModalMsg = document.getElementById('confirm-modal-msg');
    this.confirmModalOkBtn = document.getElementById('confirm-modal-ok-btn');
    this.confirmModalCancelBtn = document.getElementById('confirm-modal-cancel-btn');
    this.closeConfirmBtn = document.getElementById('close-confirm-btn');

    // Save Slots Modal
    this.modalSaveSlots = document.getElementById('modal-save-slots');
    this.saveSlotsTitle = document.getElementById('save-slots-title');
    this.saveSlotsModeBadge = document.getElementById('save-slots-mode-badge');
    this.closeSaveSlotsBtn = document.getElementById('close-save-slots-btn');
    this.tabSaveModeBtn = document.getElementById('tab-save-mode-btn');
    this.tabLoadModeBtn = document.getElementById('tab-load-mode-btn');
    this.saveSlotsContainer = document.getElementById('save-slots-container');
    this.saveRecoveryBanner = document.getElementById('save-recovery-banner');
    this.recoveryDesc = document.getElementById('recovery-desc');
    this.recoveryActionBtn = document.getElementById('recovery-action-btn');
    this.saveSlotsMode = 'save';
    this.activeGameInstance = null;

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
      } else if (type === 'autosave') {
        this.saveIndicatorIcon.textContent = '💾';
      } else if (message.includes('LOAD')) {
        this.saveIndicatorIcon.textContent = '📂';
      } else {
        this.saveIndicatorIcon.textContent = '💾';
      }
    }

    this.saveIndicator.className = 'save-indicator';
    if (type === 'error') {
      this.saveIndicator.classList.add('error');
    } else if (type === 'autosave') {
      this.saveIndicator.classList.add('autosave');
    } else if (type === 'warning') {
      this.saveIndicator.classList.add('warning');
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
    if (this.closeInventoryBtn) {
      this.closeInventoryBtn.onclick = () => this.closeInventory();
    }
    if (this.closeDialogueBtn) {
      this.closeDialogueBtn.onclick = () => this.closeDialogueModal();
    }
    if (this.closeMerchantBtn) {
      this.closeMerchantBtn.onclick = () => this.closeMerchantModal();
    }
    if (this.closeConfirmBtn) {
      this.closeConfirmBtn.onclick = () => this.closeModal(this.modalConfirm);
    }
    if (this.closeSaveSlotsBtn) {
      this.closeSaveSlotsBtn.onclick = () => this.closeSaveSlotsModal();
    }
    if (this.tabSaveModeBtn) {
      this.tabSaveModeBtn.onclick = () => this.setSaveSlotsMode('save');
    }
    if (this.tabLoadModeBtn) {
      this.tabLoadModeBtn.onclick = () => this.setSaveSlotsMode('load');
    }

    // Close on backdrop click
    [this.modalSettings, this.modalControls, this.modalCredits, this.modalInventory, this.modalDialogue, this.modalMerchant, this.modalConfirm, this.modalSaveSlots].forEach(modal => {
      if (modal) {
        modal.onclick = (e) => {
          if (e.target === modal) {
            if (modal === this.modalInventory) {
              this.closeInventory();
            } else if (modal === this.modalDialogue) {
              this.closeDialogueModal();
            } else if (modal === this.modalMerchant) {
              this.closeMerchantModal();
            } else {
              this.closeModal(modal);
            }
          }
        };
      }
    });
  }

  // ==================== INVENTORY & EQUIPMENT UI ====================
  setupInventory({ player, onToggleInventory }) {
    this.playerRef = player;
    this.onToggleInventoryCallback = onToggleInventory;

    if (this.inventoryToggleBtn) {
      this.inventoryToggleBtn.onclick = () => {
        if (typeof this.onToggleInventoryCallback === 'function') {
          this.onToggleInventoryCallback();
        } else {
          this.toggleInventory();
        }
      };
    }

    if (this.unequipWeaponBtn) {
      this.unequipWeaponBtn.onclick = () => this.unequipSlot('weapon');
    }
    if (this.unequipArmorBtn) {
      this.unequipArmorBtn.onclick = () => this.unequipSlot('armor');
    }
    if (this.unequipTrinketBtn) {
      this.unequipTrinketBtn.onclick = () => this.unequipSlot('trinket');
    }

    // Category Tabs
    if (this.modalInventory) {
      const tabs = this.modalInventory.querySelectorAll('.inv-tab');
      tabs.forEach(tab => {
        tab.onclick = () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.currentInventoryCategory = tab.dataset.category || 'all';
          this.refreshInventoryUI();
        };
      });
    }

    if (player && player.inventorySystem) {
      player.inventorySystem.onChange(() => {
        this.refreshInventoryUI();
      });
    }

    this.refreshInventoryUI();
  }

  toggleInventory() {
    if (this.isInventoryOpen()) {
      this.closeInventory();
    } else {
      this.openInventory();
    }
  }

  openInventory() {
    if (this.modalInventory) {
      this.openModal(this.modalInventory);
      this.refreshInventoryUI();
    }
  }

  closeInventory() {
    if (this.modalInventory) {
      this.closeModal(this.modalInventory);
      this.selectedInventorySlotIndex = null;
      if (typeof this.onToggleInventoryCallback === 'function') {
        this.onToggleInventoryCallback(false);
      }
    }
  }

  isInventoryOpen() {
    return this.modalInventory && !this.modalInventory.classList.contains('hidden');
  }

  unequipSlot(slotName) {
    if (!this.playerRef || !this.playerRef.inventorySystem) return;

    const result = this.playerRef.inventorySystem.unequipItem(slotName, this.playerRef);
    if (!result.success) {
      if (result.reason === 'INVENTORY_FULL') {
        this.showCollectNotification('INVENTORY FULL! Cannot unequip item.', 'warning');
      }
    } else {
      this.showCollectNotification(`Unequipped ${result.unequipped.name}`);
      this.refreshInventoryUI();
    }
  }

  refreshInventoryUI() {
    if (!this.playerRef || !this.playerRef.inventorySystem) return;
    const inv = this.playerRef.inventorySystem;
    const stats = this.playerRef.getCharacterStats();

    // 1. Equipped Gear
    const eq = inv.equipment;
    if (this.equipWeaponName) {
      this.equipWeaponName.textContent = eq.weapon ? eq.weapon.name : 'Empty Slot';
      this.equipWeaponName.className = `equip-slot-name ${eq.weapon ? 'rarity-' + eq.weapon.rarity : ''}`;
    }
    if (this.equipWeaponStat) {
      this.equipWeaponStat.textContent = eq.weapon?.stats?.damage ? `+${eq.weapon.stats.damage} DMG` : 'None';
    }
    if (this.unequipWeaponBtn) {
      this.unequipWeaponBtn.style.display = eq.weapon ? 'flex' : 'none';
    }

    if (this.equipArmorName) {
      this.equipArmorName.textContent = eq.armor ? eq.armor.name : 'Empty Slot';
      this.equipArmorName.className = `equip-slot-name ${eq.armor ? 'rarity-' + eq.armor.rarity : ''}`;
    }
    if (this.equipArmorStat) {
      this.equipArmorStat.textContent = eq.armor?.stats?.defense ? `+${eq.armor.stats.defense} DEF` : 'None';
    }
    if (this.unequipArmorBtn) {
      this.unequipArmorBtn.style.display = eq.armor ? 'flex' : 'none';
    }

    if (this.equipTrinketName) {
      this.equipTrinketName.textContent = eq.trinket ? eq.trinket.name : 'Empty Slot';
      this.equipTrinketName.className = `equip-slot-name ${eq.trinket ? 'rarity-' + eq.trinket.rarity : ''}`;
    }
    if (this.equipTrinketStat) {
      let trinketStr = 'None';
      if (eq.trinket?.stats) {
        const parts = [];
        if (eq.trinket.stats.damage) parts.push(`+${eq.trinket.stats.damage} DMG`);
        if (eq.trinket.stats.defense) parts.push(`+${eq.trinket.stats.defense} DEF`);
        if (eq.trinket.stats.maxHealth) parts.push(`+${eq.trinket.stats.maxHealth} HP`);
        trinketStr = parts.join(' • ') || 'Active';
      }
      this.equipTrinketStat.textContent = trinketStr;
    }
    if (this.unequipTrinketBtn) {
      this.unequipTrinketBtn.style.display = eq.trinket ? 'flex' : 'none';
    }

    // 2. Character Stats
    if (this.statValHealth) {
      this.statValHealth.textContent = `${Math.ceil(stats.health)} / ${stats.maxHealth}`;
    }
    if (this.statValDamage) {
      this.statValDamage.textContent = `${stats.damage} DMG`;
    }
    if (this.statValDefense) {
      this.statValDefense.textContent = `${stats.defense} DEF`;
    }
    if (this.statValSpeed) {
      this.statValSpeed.textContent = `${stats.runSpeed.toFixed(1)} m/s`;
    }
    if (this.statValLevel) {
      this.statValLevel.textContent = `Level ${stats.level} (${stats.xp} XP)`;
    }

    // 3. Capacity Badge
    const occupied = inv.getOccupiedSlotCount();
    if (this.invCapacityBadge) {
      this.invCapacityBadge.textContent = `🎒 ${occupied} / ${inv.capacity} SLOTS`;
      if (occupied >= inv.capacity) {
        this.invCapacityBadge.style.color = '#ef4444';
        this.invCapacityBadge.style.borderColor = 'rgba(239, 68, 68, 0.6)';
        this.invCapacityBadge.style.background = 'rgba(239, 68, 68, 0.15)';
      } else {
        this.invCapacityBadge.style.color = '#38bdf8';
        this.invCapacityBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        this.invCapacityBadge.style.background = 'rgba(14, 165, 233, 0.15)';
      }
    }

    // 4. Slots Grid
    if (this.invSlotsGrid) {
      this.invSlotsGrid.innerHTML = '';
      const category = this.currentInventoryCategory;

      for (let i = 0; i < inv.capacity; i++) {
        const slotData = inv.slots[i];
        const slotEl = document.createElement('div');
        slotEl.className = 'inv-slot';
        slotEl.dataset.slotIndex = i;

        if (this.selectedInventorySlotIndex === i) {
          slotEl.classList.add('selected');
        }

        if (slotData && slotData.item) {
          const item = slotData.item;

          // Filter matching
          let isMatch = false;
          if (category === 'all') isMatch = true;
          else if (category === 'equipment' && (item.type === 'weapon' || item.type === 'armor' || item.type === 'trinket')) isMatch = true;
          else if (category === 'consumable' && item.type === 'consumable') isMatch = true;
          else if (category === 'material' && (item.type === 'material' || item.type === 'quest')) isMatch = true;

          if (!isMatch) {
            slotEl.style.opacity = '0.25';
          }

          slotEl.classList.add(`rarity-${item.rarity || 'common'}`);

          const icon = document.createElement('div');
          icon.className = 'inv-slot-icon';
          icon.textContent = item.icon || '📦';
          slotEl.appendChild(icon);

          if (slotData.quantity > 1) {
            const count = document.createElement('span');
            count.className = 'inv-slot-count';
            count.textContent = slotData.quantity;
            slotEl.appendChild(count);
          }
        }

        slotEl.onclick = () => {
          this.selectedInventorySlotIndex = i;
          this.refreshInventoryUI();
        };

        this.invSlotsGrid.appendChild(slotEl);
      }
    }

    // 5. Selected Item Details Card
    this.renderSelectedDetails();
  }

  renderSelectedDetails() {
    if (!this.invItemDetails) return;

    const idx = this.selectedInventorySlotIndex;
    if (idx === null || !this.playerRef?.inventorySystem?.slots[idx]) {
      this.invItemDetails.innerHTML = '<div class="details-placeholder">Select an item in your backpack to view details and actions.</div>';
      return;
    }

    const slot = this.playerRef.inventorySystem.slots[idx];
    const item = slot.item;
    const rarity = item.rarity || 'common';

    const isEquippable = (item.type === 'weapon' || item.type === 'armor' || item.type === 'trinket');
    const isConsumable = (item.type === 'consumable');

    let statsHtml = '';
    if (item.stats) {
      const parts = [];
      if (item.stats.damage) parts.push(`⚔️ Attack Damage: +${item.stats.damage}`);
      if (item.stats.defense) parts.push(`🛡️ Physical Defense: +${item.stats.defense}`);
      if (item.stats.maxHealth) parts.push(`❤️ Max Health: +${item.stats.maxHealth}`);
      if (item.stats.heal) parts.push(`🧪 Restores ${item.stats.heal} HP`);
      if (item.stats.speedBoost) parts.push(`⚡ Movement Speed: +${Math.round((item.stats.speedBoost - 1) * 100)}%`);
      if (parts.length > 0) {
        statsHtml = `<div class="details-stats">${parts.join(' &nbsp;•&nbsp; ')}</div>`;
      }
    }

    let actionsHtml = '<div class="details-actions">';
    if (isEquippable) {
      actionsHtml += `<button class="inv-action-btn equip" id="inv-action-equip">⚔️ EQUIP ITEM</button>`;
    }
    if (isConsumable) {
      actionsHtml += `<button class="inv-action-btn use" id="inv-action-use">🧪 DRINK / USE</button>`;
    }
    actionsHtml += `<button class="inv-action-btn drop" id="inv-action-drop">DISCARD (1)</button>`;
    actionsHtml += '</div>';

    this.invItemDetails.innerHTML = `
      <div class="details-active-wrap">
        <div class="details-top">
          <div class="details-header">
            <div class="details-icon">${item.icon || '📦'}</div>
            <div class="details-title-box">
              <span class="details-name">${item.name}</span>
              <span class="details-rarity-badge rarity-${rarity}">${rarity.toUpperCase()} • ${item.type.toUpperCase()}${slot.quantity > 1 ? ` (${slot.quantity})` : ''}</span>
            </div>
          </div>
        </div>
        <p class="details-desc">${item.description || 'An artifact found in the ancient ruins.'}</p>
        ${statsHtml}
        ${actionsHtml}
      </div>
    `;

    // Wire actions
    const equipBtn = document.getElementById('inv-action-equip');
    if (equipBtn) {
      equipBtn.onclick = () => {
        const res = this.playerRef.inventorySystem.equipItem(idx, this.playerRef);
        if (res.success) {
          this.showCollectNotification(`Equipped ${res.equipped.name}!`);
          this.refreshInventoryUI();
        }
      };
    }

    const useBtn = document.getElementById('inv-action-use');
    if (useBtn) {
      useBtn.onclick = () => {
        const res = this.playerRef.inventorySystem.useConsumable(idx, this.playerRef);
        if (res.success) {
          this.showCollectNotification(res.message);
          this.refreshInventoryUI();
        } else if (res.message) {
          this.showCollectNotification(res.message, 'warning');
        }
      };
    }

    const dropBtn = document.getElementById('inv-action-drop');
    if (dropBtn) {
      dropBtn.onclick = () => {
        const res = this.playerRef.inventorySystem.removeItemAt(idx, 1);
        if (res) {
          this.showCollectNotification(`Discarded 1x ${res.item.name}`);
          if (!this.playerRef.inventorySystem.slots[idx]) {
            this.selectedInventorySlotIndex = null;
          }
          this.refreshInventoryUI();
        }
      };
    }
  }

  openModal(modal) {
    if (modal) modal.classList.remove('hidden');
  }

  closeModal(modal) {
    if (modal) modal.classList.add('hidden');
  }

  // ==================== CONFIRMATION MODAL ====================
  showConfirmation(title, message, confirmBtnText = 'CONFIRM', isDanger = false) {
    return new Promise(resolve => {
      if (!this.modalConfirm) {
        resolve(window.confirm(`${title}\n\n${message}`));
        return;
      }

      if (this.confirmModalTitle) this.confirmModalTitle.textContent = title;
      if (this.confirmModalMsg) this.confirmModalMsg.textContent = message;
      if (this.confirmModalOkBtn) {
        this.confirmModalOkBtn.textContent = confirmBtnText;
        this.confirmModalOkBtn.className = `confirm-action-btn ${isDanger ? 'danger' : 'primary'}`;
      }

      this.openModal(this.modalConfirm);

      const cleanup = (result) => {
        this.closeModal(this.modalConfirm);
        if (this.confirmModalOkBtn) this.confirmModalOkBtn.onclick = null;
        if (this.confirmModalCancelBtn) this.confirmModalCancelBtn.onclick = null;
        if (this.closeConfirmBtn) this.closeConfirmBtn.onclick = null;
        resolve(result);
      };

      if (this.confirmModalOkBtn) {
        this.confirmModalOkBtn.onclick = () => cleanup(true);
      }
      if (this.confirmModalCancelBtn) {
        this.confirmModalCancelBtn.onclick = () => cleanup(false);
      }
      if (this.closeConfirmBtn) {
        this.closeConfirmBtn.onclick = () => cleanup(false);
      }
    });
  }

  // ==================== SAVE / LOAD SLOTS MODAL ====================
  async openSaveSlotsModal(game, mode = 'save') {
    this.activeGameInstance = game;
    this.saveSlotsMode = mode;
    this.updateSaveSlotsTabUI();
    this.openModal(this.modalSaveSlots);
    await this.renderSaveSlots();
  }

  closeSaveSlotsModal() {
    this.closeModal(this.modalSaveSlots);
  }

  async setSaveSlotsMode(mode) {
    this.saveSlotsMode = mode;
    this.updateSaveSlotsTabUI();
    await this.renderSaveSlots();
  }

  updateSaveSlotsTabUI() {
    if (this.tabSaveModeBtn) {
      if (this.saveSlotsMode === 'save') {
        this.tabSaveModeBtn.classList.add('active');
      } else {
        this.tabSaveModeBtn.classList.remove('active');
      }
    }
    if (this.tabLoadModeBtn) {
      if (this.saveSlotsMode === 'load') {
        this.tabLoadModeBtn.classList.add('active');
      } else {
        this.tabLoadModeBtn.classList.remove('active');
      }
    }
    if (this.saveSlotsModeBadge) {
      this.saveSlotsModeBadge.textContent = this.saveSlotsMode === 'save' ? 'SAVE ADVENTURE' : 'LOAD ADVENTURE';
    }
  }

  async renderSaveSlots() {
    if (!this.saveSlotsContainer || !this.activeGameInstance?.saveManager) return;
    this.saveSlotsContainer.innerHTML = '';

    const game = this.activeGameInstance;
    const slots = await game.saveManager.listAllSlots();

    let hasCorruptedSlot = false;
    let corruptedSlotId = null;

    slots.forEach(slot => {
      const card = document.createElement('div');
      card.className = `save-slot-card ${slot.isAutosave ? 'autosave' : (slot.id === 'quicksave' ? 'quicksave' : 'manual')}`;

      if (slot.isCorrupted) {
        card.classList.add('corrupted');
        hasCorruptedSlot = true;
        corruptedSlotId = slot.id;
      } else if (!slot.exists) {
        card.classList.add('empty');
      }

      // Left info col
      const infoCol = document.createElement('div');
      infoCol.className = 'save-slot-info-col';

      // Header row
      const headerRow = document.createElement('div');
      headerRow.className = 'save-slot-header-row';

      const title = document.createElement('div');
      title.className = 'save-slot-title';
      title.textContent = slot.name;

      const tag = document.createElement('span');
      tag.className = 'save-slot-tag';
      if (slot.isCorrupted) {
        tag.className += ' tag-corrupted';
        tag.textContent = 'CORRUPTED';
      } else if (slot.isAutosave) {
        tag.className += ' tag-autosave';
        tag.textContent = 'AUTOSAVE';
      } else if (slot.id === 'quicksave') {
        tag.className += ' tag-quicksave';
        tag.textContent = 'QUICKSAVE';
      } else {
        tag.className += ' tag-manual';
        tag.textContent = 'MANUAL';
      }

      headerRow.appendChild(title);
      headerRow.appendChild(tag);
      infoCol.appendChild(headerRow);

      if (slot.isCorrupted) {
        const errorDesc = document.createElement('div');
        errorDesc.className = 'save-slot-meta-row';
        errorDesc.style.color = '#fca5a5';
        errorDesc.textContent = `Integrity Failure: ${slot.corruptionReason || 'Invalid save schema'}`;
        infoCol.appendChild(errorDesc);

        const dateRow = document.createElement('div');
        dateRow.className = 'save-slot-date';
        dateRow.textContent = `Quarantined timestamp: ${slot.dateFormatted}`;
        infoCol.appendChild(dateRow);
      } else if (slot.exists) {
        const metaRow = document.createElement('div');
        metaRow.className = 'save-slot-meta-row';
        metaRow.innerHTML = `
          <span class="save-slot-meta-item">Stage: <strong>${slot.stageName}</strong></span>
          <span class="save-slot-meta-item">Hero Lv.<strong>${slot.level}</strong></span>
          <span class="save-slot-meta-item">HP: <strong>${slot.health}/${slot.maxHealth}</strong></span>
          <span class="save-slot-meta-item">Gold: <strong>${slot.gold}G</strong></span>
          <span class="save-slot-meta-item">Score: <strong>${slot.score}</strong></span>
        `;
        infoCol.appendChild(metaRow);

        const dateRow = document.createElement('div');
        dateRow.className = 'save-slot-date';
        dateRow.textContent = `Saved: ${slot.dateFormatted} ${slot.autosaveReason ? `• [${slot.autosaveReason}]` : ''}`;
        infoCol.appendChild(dateRow);
      } else {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'save-slot-meta-row';
        emptyRow.style.color = '#64748b';
        emptyRow.textContent = 'Empty save slot ready for progression.';
        infoCol.appendChild(emptyRow);
      }

      // Right action col
      const actionsCol = document.createElement('div');
      actionsCol.className = 'save-slot-actions';

      if (this.saveSlotsMode === 'save') {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'slot-btn save';
        saveBtn.textContent = slot.exists ? 'OVERWRITE' : 'SAVE HERE';

        if (slot.isAutosave) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'SYSTEM ONLY';
        } else {
          saveBtn.onclick = async () => {
            if (slot.exists) {
              const confirmOverwrite = await this.showConfirmation(
                'OVERWRITE SAVE FILE?',
                `Slot '${slot.name}' contains existing progress (${slot.stageName}, Lv.${slot.level}). Are you sure you wish to overwrite it?`,
                'OVERWRITE',
                true
              );
              if (!confirmOverwrite) return;
            }

            const res = await game.saveManager.saveGame(game, slot.id, {
              toastMessage: `PROGRESS SAVED TO ${slot.name.toUpperCase()}`
            });
            if (res.success) {
              await this.renderSaveSlots();
              await game.refreshContinueButton();
            }
          };
        }
        actionsCol.appendChild(saveBtn);
      } else {
        // Load mode
        const loadBtn = document.createElement('button');
        loadBtn.className = 'slot-btn primary';
        loadBtn.textContent = 'LOAD SAVE';
        loadBtn.disabled = !slot.exists || slot.isCorrupted;

        loadBtn.onclick = async () => {
          this.closeSaveSlotsModal();
          this.hidePause();
          const res = await game.saveManager.loadGame(game, slot.id);
          if (res.success) {
            game.resumeGame();
          }
        };
        actionsCol.appendChild(loadBtn);

        // Delete button
        if (slot.exists && !slot.isAutosave) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'slot-btn danger';
          deleteBtn.textContent = '✕';
          deleteBtn.title = 'Delete Save File';

          deleteBtn.onclick = async () => {
            const confirmed = await this.showConfirmation(
              'DELETE SAVE FILE?',
              `Are you sure you want to permanently delete the save in '${slot.name}'?`,
              'DELETE SAVE',
              true
            );
            if (confirmed) {
              await game.saveManager.deleteSave(slot.id);
              await this.renderSaveSlots();
              await game.refreshContinueButton();
            }
          };
          actionsCol.appendChild(deleteBtn);
        }
      }

      card.appendChild(infoCol);
      card.appendChild(actionsCol);
      this.saveSlotsContainer.appendChild(card);
    });

    // Handle Corrupted Recovery Banner
    if (this.saveRecoveryBanner) {
      if (hasCorruptedSlot) {
        this.saveRecoveryBanner.classList.remove('hidden');
        if (this.recoveryActionBtn) {
          this.recoveryActionBtn.onclick = async () => {
            const targetSlot = corruptedSlotId || QUICK_SAVE_SLOT;
            const res = await game.saveManager.recoverFromAutosave(targetSlot);
            if (res.success) {
              this.showSaveIndicator('RECOVERED PROGRESS FROM AUTOSAVE', 'success');
              await this.renderSaveSlots();
              await game.refreshContinueButton();
            } else {
              this.showSaveIndicator(`RECOVERY FAILED: ${res.reason}`, 'error');
            }
          };
        }
      } else {
        this.saveRecoveryBanner.classList.add('hidden');
      }
    }
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

  updateMovementStance(stance) {
    if (!this.movementStanceBadge) return;
    this.movementStanceBadge.classList.remove('sprinting', 'walking', 'crouch');

    switch (stance) {
      case 'crouch':
        this.movementStanceBadge.classList.add('crouch');
        if (this.stanceIcon) this.stanceIcon.textContent = '🤫';
        if (this.stanceLabel) this.stanceLabel.textContent = 'SNEAKING';
        break;
      case 'sprint':
        this.movementStanceBadge.classList.add('sprinting');
        if (this.stanceIcon) this.stanceIcon.textContent = '⚡';
        if (this.stanceLabel) this.stanceLabel.textContent = 'SPRINTING';
        break;
      case 'walk':
        this.movementStanceBadge.classList.add('walking');
        if (this.stanceIcon) this.stanceIcon.textContent = '🚶';
        if (this.stanceLabel) this.stanceLabel.textContent = 'WALKING';
        break;
      case 'run':
      default:
        if (this.stanceIcon) this.stanceIcon.textContent = '🏃';
        if (this.stanceLabel) this.stanceLabel.textContent = 'RUNNING';
        break;
    }
  }

  updateStealthIndicator(player, enemies = []) {
    if (!this.stealthIndicatorBadge || !player) return;

    let maxAwareness = 0;
    let anyEngaged = false;
    let anySuspicious = false;

    if (Array.isArray(enemies)) {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.isAlive()) continue;
        if (e.awareness > maxAwareness) maxAwareness = e.awareness;
        if (e.awarenessState === 'ENGAGED' || e.state === 'CHASE' || e.state === 'ATTACK') anyEngaged = true;
        else if (e.awarenessState === 'SUSPICIOUS' || e.awarenessState === 'ALERTED') anySuspicious = true;
      }
    }

    this.stealthIndicatorBadge.classList.remove('foliage', 'suspicious', 'detected');

    if (anyEngaged) {
      this.stealthIndicatorBadge.classList.add('detected');
      if (this.stealthEyeIcon) this.stealthEyeIcon.textContent = '👁️';
      if (this.stealthStatusText) this.stealthStatusText.textContent = 'DETECTED';
    } else if (anySuspicious || maxAwareness > 0.15) {
      this.stealthIndicatorBadge.classList.add('suspicious');
      if (this.stealthEyeIcon) this.stealthEyeIcon.textContent = '👀';
      if (this.stealthStatusText) this.stealthStatusText.textContent = `CAUTION (${Math.round(maxAwareness * 100)}%)`;
    } else if (player.isHidingInFoliage) {
      this.stealthIndicatorBadge.classList.add('foliage');
      if (this.stealthEyeIcon) this.stealthEyeIcon.textContent = '🌿';
      if (this.stealthStatusText) this.stealthStatusText.textContent = 'HIDDEN (COVER)';
    } else if (player.isCrouching) {
      if (this.stealthEyeIcon) this.stealthEyeIcon.textContent = '🤫';
      if (this.stealthStatusText) this.stealthStatusText.textContent = 'SNEAKING';
    } else {
      if (this.stealthEyeIcon) this.stealthEyeIcon.textContent = '👁️';
      if (this.stealthStatusText) this.stealthStatusText.textContent = 'HIDDEN';
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

  showCollectNotification(message, type = 'info') {
    if (!this.collectToast || !this.toastText) return;

    this.toastText.textContent = message;
    if (type === 'warning') {
      this.collectToast.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.92), rgba(234, 88, 12, 0.92))';
      this.collectToast.style.borderColor = 'rgba(239, 68, 68, 0.6)';
      this.collectToast.style.color = '#fee2e2';
    } else {
      this.collectToast.style.background = 'linear-gradient(135deg, rgba(2, 132, 199, 0.85), rgba(99, 102, 241, 0.85))';
      this.collectToast.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      this.collectToast.style.color = '#ffffff';
    }

    this.collectToast.classList.remove('hidden');
    this.collectToast.style.animation = 'none';
    this.collectToast.offsetHeight;
    this.collectToast.style.animation = 'toastFade 1.8s forwards ease-out';

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.collectToast.classList.add('hidden');
    }, 1800);
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

  updateGold(amount) {
    const val = Math.max(0, Math.floor(amount || 0));
    if (this.hudGoldText) this.hudGoldText.textContent = `${val} G`;
    if (this.invGoldBadge) this.invGoldBadge.textContent = `🪙 ${val} G`;
    if (this.merchantGoldDisplay) this.merchantGoldDisplay.textContent = `${val}`;
  }

  updateSideQuestsHUD(activeSideQuests = []) {
    if (!this.sideQuestsContainer || !this.sideQuestsList) return;

    if (!activeSideQuests || activeSideQuests.length === 0) {
      this.sideQuestsContainer.classList.add('hidden');
      return;
    }

    this.sideQuestsContainer.classList.remove('hidden');
    this.sideQuestsList.innerHTML = '';

    activeSideQuests.forEach(quest => {
      const li = document.createElement('li');
      li.className = `side-quest-item ${quest.status === 'READY_TO_TURN_IN' ? 'ready' : ''} ${quest.status === 'COMPLETED' ? 'completed' : ''}`;

      const icon = quest.status === 'READY_TO_TURN_IN' ? '❓' : (quest.status === 'COMPLETED' ? '✅' : '📜');
      const progressText = quest.status === 'READY_TO_TURN_IN' ? 'Ready to turn in!' : `${quest.current} / ${quest.target}`;

      li.innerHTML = `
        <span class="side-quest-dot">${icon}</span>
        <span class="side-quest-text"><strong>${quest.title}</strong>: ${quest.objectiveText} (${progressText})</span>
      `;
      this.sideQuestsList.appendChild(li);
    });
  }

  // ==================== DIALOGUE SYSTEM UI ====================
  setupDialogue(dialogueManager) {
    this.dialogueManagerRef = dialogueManager;
    if (this.closeDialogueBtn) {
      this.closeDialogueBtn.onclick = () => this.closeDialogueModal();
    }
  }

  openDialogueModal(dialogueManager = this.dialogueManagerRef) {
    this.dialogueManagerRef = dialogueManager;
    if (this.modalDialogue) {
      this.modalDialogue.classList.remove('hidden');
    }
  }

  closeDialogueModal() {
    if (this.modalDialogue) {
      this.modalDialogue.classList.add('hidden');
    }
    if (this.dialogueManagerRef && this.dialogueManagerRef.isOpen) {
      this.dialogueManagerRef.closeDialogue(false);
    }
  }

  renderDialogueNode(node) {
    if (!node) return;

    if (this.dialogueAvatar) this.dialogueAvatar.textContent = node.avatar || '💬';
    if (this.dialogueSpeakerName) this.dialogueSpeakerName.textContent = node.speaker || 'Wanderer';
    if (this.dialogueSpeakerTitle) this.dialogueSpeakerTitle.textContent = node.title || '';
    if (this.dialogueSpeechText) this.dialogueSpeechText.textContent = node.text || '';

    if (this.dialogueChoicesContainer) {
      this.dialogueChoicesContainer.innerHTML = '';
      if (Array.isArray(node.choices)) {
        node.choices.forEach((choice, idx) => {
          const btn = document.createElement('button');
          btn.className = 'dialogue-choice-btn';
          btn.innerHTML = `<span class="choice-arrow">▸</span> <span>${choice.text}</span>`;
          btn.onclick = () => {
            if (this.dialogueManagerRef) {
              this.dialogueManagerRef.selectChoice(idx);
            } else if (typeof choice.action === 'function') {
              choice.action();
            }
          };
          this.dialogueChoicesContainer.appendChild(btn);
        });
      }
    }
  }

  // ==================== MERCHANT SHOP UI ====================
  setupMerchant(merchantManager) {
    this.merchantManagerRef = merchantManager;
    if (this.closeMerchantBtn) {
      this.closeMerchantBtn.onclick = () => this.closeMerchantModal();
    }
    if (this.merchantTabBuy) {
      this.merchantTabBuy.onclick = () => {
        this.merchantTabBuy.classList.add('active');
        if (this.merchantTabSell) this.merchantTabSell.classList.remove('active');
        if (this.merchantManagerRef) this.merchantManagerRef.switchTab('buy');
      };
    }
    if (this.merchantTabSell) {
      this.merchantTabSell.onclick = () => {
        this.merchantTabSell.classList.add('active');
        if (this.merchantTabBuy) this.merchantTabBuy.classList.remove('active');
        if (this.merchantManagerRef) this.merchantManagerRef.switchTab('sell');
      };
    }
  }

  openMerchantModal(merchantManager = this.merchantManagerRef) {
    this.merchantManagerRef = merchantManager;
    if (this.modalMerchant) {
      this.modalMerchant.classList.remove('hidden');
    }
    this.refreshMerchantUI();
  }

  closeMerchantModal() {
    if (this.modalMerchant) {
      this.modalMerchant.classList.add('hidden');
    }
    if (this.merchantManagerRef && this.merchantManagerRef.isOpen) {
      this.merchantManagerRef.closeShop();
    }
  }

  refreshMerchantUI() {
    if (!this.merchantManagerRef || !this.merchantItemsContainer) return;
    const mgr = this.merchantManagerRef;
    const player = mgr.player;
    if (!player || !player.inventorySystem) return;

    const gold = player.inventorySystem.getGold();
    this.updateGold(gold);

    this.merchantItemsContainer.innerHTML = '';

    if (mgr.currentTab === 'buy') {
      // Render buy wares
      mgr.merchantStock.forEach(stockItem => {
        const itemTemplate = player.inventorySystem.createItem(stockItem.id);
        const card = document.createElement('div');
        card.className = 'merchant-item-card';

        const icon = itemTemplate ? itemTemplate.icon : '📦';
        const name = itemTemplate ? itemTemplate.name : stockItem.name;
        const desc = itemTemplate ? itemTemplate.description : '';
        const price = stockItem.price;

        const canAfford = gold >= price;

        card.innerHTML = `
          <div class="merchant-item-left">
            <div class="merchant-item-icon">${icon}</div>
            <div class="merchant-item-meta">
              <div class="merchant-item-title-row">
                <span class="merchant-item-name">${name}</span>
              </div>
              <span class="merchant-item-desc">${desc}</span>
            </div>
          </div>
          <div class="merchant-item-right">
            <span class="merchant-price-tag">🪙 ${price} G</span>
            <button class="merchant-trade-btn buy" ${!canAfford ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>BUY</button>
          </div>
        `;

        const buyBtn = card.querySelector('.merchant-trade-btn.buy');
        if (buyBtn && canAfford) {
          buyBtn.onclick = () => {
            mgr.buyItem(stockItem.id);
          };
        }

        this.merchantItemsContainer.appendChild(card);
      });

    } else {
      // Render sell wares from player inventory
      const slots = player.inventorySystem.slots;
      let hasSellable = false;

      slots.forEach((slot, idx) => {
        if (!slot || !slot.item) return;
        const item = slot.item;
        if (item.type === 'quest' || (item.value || 0) <= 0) return; // cannot sell quest items

        hasSellable = true;
        const card = document.createElement('div');
        card.className = 'merchant-item-card';

        const baseVal = item.value || 10;
        const sellPrice = Math.max(1, Math.floor(baseVal * 0.5));

        card.innerHTML = `
          <div class="merchant-item-left">
            <div class="merchant-item-icon">${item.icon || '📦'}</div>
            <div class="merchant-item-meta">
              <div class="merchant-item-title-row">
                <span class="merchant-item-name">${item.name}</span>
                <span class="inv-slot-qty-badge" style="font-size:0.75rem;padding:2px 6px;">x${slot.quantity}</span>
              </div>
              <span class="merchant-item-desc">${item.description || ''}</span>
            </div>
          </div>
          <div class="merchant-item-right">
            <span class="merchant-price-tag" style="color:#4ade80;">+${sellPrice} G</span>
            <button class="merchant-trade-btn sell">SELL</button>
          </div>
        `;

        const sellBtn = card.querySelector('.merchant-trade-btn.sell');
        if (sellBtn) {
          sellBtn.onclick = () => {
            mgr.sellItem(idx);
          };
        }

        this.merchantItemsContainer.appendChild(card);
      });

      if (!hasSellable) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'details-placeholder';
        emptyMsg.style.padding = '30px';
        emptyMsg.textContent = 'No tradeable goods in your backpack. Quest artifacts cannot be sold.';
        this.merchantItemsContainer.appendChild(emptyMsg);
      }
    }
  }

  // ==================== PAUSE MENU ====================
  setPaused(isPaused, onResume = null, onRestart = null, onOpenSettings = null, onMainMenu = null, onSaveGame = null, onLoadGame = null) {
    if (this.pauseScreen) {
      if (isPaused) {
        this.pauseScreen.classList.remove('hidden');
        if (this.resumeBtn && onResume) this.resumeBtn.onclick = onResume;
        if (this.pauseSaveBtn && onSaveGame) this.pauseSaveBtn.onclick = onSaveGame;
        if (this.pauseLoadBtn && onLoadGame) this.pauseLoadBtn.onclick = onLoadGame;
        if (this.pauseSlotsBtn) {
          this.pauseSlotsBtn.onclick = () => {
            const g = window.game || window.__GAME__ || this.activeGameInstance;
            this.openSaveSlotsModal(g, 'save');
          };
        }
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
