import * as THREE from 'three';

/**
 * Filter presets for artistic cinematic post-processing
 */
export const PHOTO_FILTERS = {
  none: {
    name: 'Natural',
    filter: 'none'
  },
  vibrant: {
    name: 'Vibrant Fantasy',
    filter: 'contrast(1.18) saturate(1.45) brightness(1.05)'
  },
  noir: {
    name: 'Dark Noir',
    filter: 'grayscale(1.0) contrast(1.42) brightness(0.92)'
  },
  sunset: {
    name: 'Golden Sunset',
    filter: 'sepia(0.38) saturate(1.35) hue-rotate(-12deg) contrast(1.12)'
  },
  mystic: {
    name: 'Mystic Moonlight',
    filter: 'hue-rotate(180deg) saturate(1.3) contrast(1.15) brightness(0.96)'
  },
  dramatic: {
    name: 'Cinematic High Contrast',
    filter: 'contrast(1.35) brightness(0.94) saturate(1.12)'
  }
};

/**
 * PhotoModeManager
 * Manages entering/exiting photo mode, gameplay pause freezing,
 * free flight camera manipulation, field-of-view, depth-of-field,
 * color grading filters, and genuine browser screenshot generation.
 */
export class PhotoModeManager {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.isUIHidden = false;

    // Camera settings state
    this.currentFOV = 60;
    this.currentRoll = 0;
    this.currentExposure = 1.0;
    this.baseExposure = 1.0;
    this.currentFilter = 'none';
    this.isLetterboxActive = false;
    this.focusDistance = 5.0;
    this.blurStrength = 0.0;

    // Key states for camera flight
    this.flyKeys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      shift: false,
      alt: false
    };

    // Mouse drag state
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.pendingMouseDeltaX = 0;
    this.pendingMouseDeltaY = 0;

    // Screenshot cache
    this.lastCapturedBlob = null;
    this.lastCapturedDataUrl = null;

    this.bindDOM();
  }

  bindDOM() {
    // Top-bar photo mode button
    const toggleBtn = document.getElementById('photo-mode-toggle-btn');
    if (toggleBtn) {
      toggleBtn.onclick = () => this.toggle();
    }

    // Modal / Overlay elements
    this.overlay = document.getElementById('photo-mode-overlay');
    this.letterbox = document.getElementById('photo-letterbox-overlay');
    this.shutterFlash = document.getElementById('photo-shutter-flash');
    this.previewModal = document.getElementById('photo-preview-modal');

    // Controls Dock elements
    this.btnCapture = document.getElementById('photo-btn-capture');
    this.btnReset = document.getElementById('photo-btn-reset');
    this.btnHideUI = document.getElementById('photo-btn-hide-ui');
    this.btnExit = document.getElementById('photo-btn-exit');
    this.showUIPill = document.getElementById('photo-show-ui-pill');

    // Sliders & Selectors
    this.sliderFOV = document.getElementById('photo-slider-fov');
    this.valFOV = document.getElementById('photo-val-fov');
    this.sliderRoll = document.getElementById('photo-slider-roll');
    this.valRoll = document.getElementById('photo-val-roll');
    this.sliderExposure = document.getElementById('photo-slider-exposure');
    this.valExposure = document.getElementById('photo-val-exposure');
    this.sliderFocus = document.getElementById('photo-slider-focus');
    this.valFocus = document.getElementById('photo-val-focus');
    this.sliderBlur = document.getElementById('photo-slider-blur');
    this.valBlur = document.getElementById('photo-val-blur');
    this.selectFilter = document.getElementById('photo-select-filter');
    this.toggleLetterbox = document.getElementById('photo-toggle-letterbox');

    // Bind slider inputs
    if (this.sliderFOV) {
      this.sliderFOV.oninput = (e) => {
        const val = parseFloat(e.target.value);
        this.setFOV(val);
      };
    }

    if (this.sliderRoll) {
      this.sliderRoll.oninput = (e) => {
        const degrees = parseFloat(e.target.value);
        this.setRoll(degrees);
      };
    }

    if (this.sliderExposure) {
      this.sliderExposure.oninput = (e) => {
        const exp = parseFloat(e.target.value);
        this.setExposure(exp);
      };
    }

    if (this.selectFilter) {
      this.selectFilter.onchange = (e) => {
        this.setFilter(e.target.value);
      };
    }

    if (this.toggleLetterbox) {
      this.toggleLetterbox.onchange = (e) => {
        this.setLetterbox(e.target.checked);
      };
    }

    if (this.sliderFocus) {
      this.sliderFocus.oninput = (e) => {
        this.focusDistance = parseFloat(e.target.value);
        if (this.valFocus) this.valFocus.textContent = `${this.focusDistance.toFixed(1)}m`;
      };
    }

    if (this.sliderBlur) {
      this.sliderBlur.oninput = (e) => {
        this.blurStrength = parseFloat(e.target.value);
        if (this.valBlur) this.valBlur.textContent = `${Math.round(this.blurStrength * 100)}%`;
        this.updateDoFOverlay();
      };
    }

    // Action buttons
    if (this.btnCapture) {
      this.btnCapture.onclick = () => this.captureScreenshot();
    }
    if (this.btnReset) {
      this.btnReset.onclick = () => this.resetCamera();
    }
    if (this.btnHideUI) {
      this.btnHideUI.onclick = () => this.hideUI();
    }
    if (this.showUIPill) {
      this.showUIPill.onclick = () => this.showUI();
    }
    if (this.btnExit) {
      this.btnExit.onclick = () => this.exit();
    }

    // Preview Modal close buttons
    const closePreviewBtn = document.getElementById('close-photo-preview-btn');
    if (closePreviewBtn && this.previewModal) {
      closePreviewBtn.onclick = () => this.previewModal.classList.add('hidden');
    }

    // Canvas Mouse dragging for free camera look
    window.addEventListener('mousedown', (e) => {
      if (!this.isActive || this.previewModal && !this.previewModal.classList.contains('hidden')) return;
      if (e.target && typeof e.target.closest === 'function') {
        if (e.target.closest('#photo-controls-dock') || e.target.closest('#photo-preview-modal')) return;
      }

      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.isMouseDown) return;

      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.pendingMouseDeltaX += deltaX;
      this.pendingMouseDeltaY += deltaY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // Mouse scroll for rapid zoom in photo mode
    window.addEventListener('wheel', (e) => {
      if (!this.isActive) return;
      if (e.target && typeof e.target.closest === 'function' && e.target.closest('#photo-controls-dock')) return;

      const zoomStep = e.deltaY > 0 ? 3 : -3;
      this.setFOV(this.currentFOV + zoomStep);
    }, { passive: true });

    // Keyboard navigation in photo mode
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      // Prevent key handling if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.flyKeys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.flyKeys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.flyKeys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.flyKeys.right = true;
          break;
        case 'KeyE':
        case 'Space':
        case 'PageUp':
          this.flyKeys.up = true;
          break;
        case 'KeyQ':
        case 'KeyC':
        case 'PageDown':
          this.flyKeys.down = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.flyKeys.shift = true;
          break;
        case 'AltLeft':
        case 'AltRight':
          this.flyKeys.alt = true;
          break;
        case 'KeyH':
        case 'Tab':
          e.preventDefault();
          this.toggleUI();
          break;
        case 'Escape':
          e.preventDefault();
          this.exit();
          break;
        case 'Enter':
          e.preventDefault();
          this.captureScreenshot();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isActive) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.flyKeys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.flyKeys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.flyKeys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.flyKeys.right = false;
          break;
        case 'KeyE':
        case 'Space':
        case 'PageUp':
          this.flyKeys.up = false;
          break;
        case 'KeyQ':
        case 'KeyC':
        case 'PageDown':
          this.flyKeys.down = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.flyKeys.shift = false;
          break;
        case 'AltLeft':
        case 'AltRight':
          this.flyKeys.alt = false;
          break;
      }
    });
  }

  toggle() {
    if (this.isActive) {
      this.exit();
    } else {
      this.enter();
    }
  }

  /**
   * Enters dedicated photo mode and safely pauses gameplay
   */
  enter() {
    if (this.isActive) return;

    const game = this.game;
    if (!game || game.gameState === 'MAIN_MENU') {
      return;
    }

    this.isActive = true;
    this.isUIHidden = false;

    // 1. Pause gameplay simulation safely
    this.previousGameState = game.gameState;
    this.previousPlayerEnabled = game.player ? game.player.isEnabled : true;
    if (game.player) {
      game.player.isEnabled = false;
    }

    // 2. Unlock pointer lock to allow mouse cursor manipulation of photo mode dock
    if (game.cameraManager) {
      game.cameraManager.setLockEnabled(false);
      game.cameraManager.exitPointerLock();
      game.cameraManager.startPhotoMode(game.player);
      this.currentFOV = game.cameraManager.getFOV();
    }

    // 3. Store base renderer exposure
    if (game.renderer) {
      this.baseExposure = game.renderer.toneMappingExposure || 1.0;
      this.currentExposure = this.baseExposure;
    }

    // 4. Hide game HUD and display photo mode overlay
    const inGameHUD = document.getElementById('ui-overlay');
    if (inGameHUD) {
      inGameHUD.classList.add('hidden');
    }

    if (this.overlay) {
      this.overlay.classList.remove('hidden');
    }

    this.syncUIControls();

    if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
      this.game.uiManager.showCollectNotification('📷 Photo Mode Active — [P] or [ESC] to Exit, [H] to Hide UI');
    }
  }

  /**
   * Exits photo mode, restoring original camera and resuming gameplay
   */
  exit() {
    if (!this.isActive) return;

    const game = this.game;

    // 1. Restore original gameplay camera
    if (game.cameraManager) {
      game.cameraManager.exitPhotoMode();
    }

    // 2. Reset renderer tone mapping & CSS filters
    this.resetFilters();
    if (game.renderer) {
      game.renderer.toneMappingExposure = this.baseExposure;
    }

    // 3. Remove letterbox and DoF overlays
    if (this.letterbox) {
      this.letterbox.classList.add('hidden');
    }
    const dofOverlay = document.getElementById('photo-dof-overlay');
    if (dofOverlay) {
      dofOverlay.classList.add('hidden');
    }

    // 4. Hide photo mode overlay and restore in-game HUD
    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }
    if (this.previewModal) {
      this.previewModal.classList.add('hidden');
    }
    if (this.showUIPill) {
      this.showUIPill.classList.add('hidden');
    }

    const inGameHUD = document.getElementById('ui-overlay');
    if (inGameHUD && game.gameState !== 'MAIN_MENU') {
      inGameHUD.classList.remove('hidden');
    }

    // 5. Restore player locomotion and pointer lock
    if (game.player) {
      game.player.isEnabled = this.previousPlayerEnabled;
    }

    if (game.cameraManager && game.gameState === 'PLAYING') {
      game.cameraManager.setLockEnabled(true);
      game.cameraManager.requestPointerLock();
    }

    this.isActive = false;
    this.isUIHidden = false;
  }

  /**
   * Resets photo camera back to default framing
   */
  resetCamera() {
    if (!this.isActive || !this.game.cameraManager) return;

    this.game.cameraManager.resetPhotoModeCamera(this.game.player);
    this.setFOV(60);
    this.setRoll(0);
    this.setExposure(this.baseExposure);
    this.setFilter('none');
    this.setLetterbox(false);
    this.focusDistance = 5.0;
    this.blurStrength = 0.0;
    if (this.sliderBlur) this.sliderBlur.value = 0;
    if (this.valBlur) this.valBlur.textContent = '0%';
    this.updateDoFOverlay();

    this.syncUIControls();

    if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
      this.game.uiManager.showCollectNotification('Camera reset to default framing.');
    }
  }

  setFOV(fov) {
    this.currentFOV = THREE.MathUtils.clamp(fov, 20, 90);
    if (this.game.cameraManager) {
      this.game.cameraManager.setFOV(this.currentFOV);
    }
    if (this.sliderFOV) this.sliderFOV.value = this.currentFOV;
    if (this.valFOV) this.valFOV.textContent = `${Math.round(this.currentFOV)}°`;
  }

  setRoll(degrees) {
    this.currentRoll = THREE.MathUtils.clamp(degrees, -35, 35);
    const radians = THREE.MathUtils.degToRad(this.currentRoll);
    if (this.game.cameraManager) {
      this.game.cameraManager.setRoll(radians);
    }
    if (this.sliderRoll) this.sliderRoll.value = this.currentRoll;
    if (this.valRoll) this.valRoll.textContent = `${Math.round(this.currentRoll)}°`;
  }

  setExposure(exp) {
    this.currentExposure = THREE.MathUtils.clamp(exp, 0.4, 2.2);
    if (this.game.renderer) {
      this.game.renderer.toneMappingExposure = this.currentExposure;
    }
    if (this.sliderExposure) this.sliderExposure.value = this.currentExposure;
    if (this.valExposure) this.valExposure.textContent = `${this.currentExposure.toFixed(2)}x`;
  }

  setFilter(filterKey) {
    if (!PHOTO_FILTERS[filterKey]) return;
    this.currentFilter = filterKey;

    const canvas = this.game.renderer?.domElement;
    if (canvas) {
      canvas.style.filter = PHOTO_FILTERS[filterKey].filter;
    }
    if (this.selectFilter) {
      this.selectFilter.value = filterKey;
    }
  }

  resetFilters() {
    const canvas = this.game.renderer?.domElement;
    if (canvas) {
      canvas.style.filter = 'none';
    }
    this.currentFilter = 'none';
  }

  setLetterbox(active) {
    this.isLetterboxActive = Boolean(active);
    if (this.letterbox) {
      if (this.isLetterboxActive) this.letterbox.classList.remove('hidden');
      else this.letterbox.classList.add('hidden');
    }
    if (this.toggleLetterbox) {
      this.toggleLetterbox.checked = this.isLetterboxActive;
    }
  }

  updateDoFOverlay() {
    let dofOverlay = document.getElementById('photo-dof-overlay');
    if (!dofOverlay) return;

    if (this.blurStrength > 0.05) {
      dofOverlay.classList.remove('hidden');
      const blurPx = (this.blurStrength * 6).toFixed(1);
      dofOverlay.style.backdropFilter = `blur(${blurPx}px)`;
    } else {
      dofOverlay.classList.add('hidden');
    }
  }

  hideUI() {
    this.isUIHidden = true;
    const dock = document.getElementById('photo-controls-dock');
    if (dock) dock.classList.add('hidden');
    if (this.showUIPill) this.showUIPill.classList.remove('hidden');
  }

  showUI() {
    this.isUIHidden = false;
    const dock = document.getElementById('photo-controls-dock');
    if (dock) dock.classList.remove('hidden');
    if (this.showUIPill) this.showUIPill.classList.add('hidden');
  }

  toggleUI() {
    if (this.isUIHidden) this.showUI();
    else this.hideUI();
  }

  syncUIControls() {
    if (this.sliderFOV) this.sliderFOV.value = this.currentFOV;
    if (this.valFOV) this.valFOV.textContent = `${Math.round(this.currentFOV)}°`;
    if (this.sliderRoll) this.sliderRoll.value = this.currentRoll;
    if (this.valRoll) this.valRoll.textContent = `${Math.round(this.currentRoll)}°`;
    if (this.sliderExposure) this.sliderExposure.value = this.currentExposure;
    if (this.valExposure) this.valExposure.textContent = `${this.currentExposure.toFixed(2)}x`;
    if (this.selectFilter) this.selectFilter.value = this.currentFilter;
    if (this.toggleLetterbox) this.toggleLetterbox.checked = this.isLetterboxActive;
  }

  /**
   * Captures a high-resolution, browser-compatible screenshot
   * using the WebGL drawing buffer and active cinematic filters.
   */
  async captureScreenshot() {
    const renderer = this.game.renderer;
    const scene = this.game.scene;
    const camera = this.game.cameraManager?.getCamera();

    if (!renderer || !scene || !camera) return null;

    // 1. Play mechanical shutter audio click
    if (this.game.audioManager && typeof this.game.audioManager.playCameraShutter === 'function') {
      this.game.audioManager.playCameraShutter();
    }

    // 2. Trigger screen shutter flash
    if (this.shutterFlash) {
      this.shutterFlash.classList.add('flash');
      setTimeout(() => this.shutterFlash.classList.remove('flash'), 120);
    }

    // 3. Render clean frame without UI
    renderer.render(scene, camera);

    const canvas = renderer.domElement;
    const width = canvas.width;
    const height = canvas.height;

    // 4. Create composition canvas to apply filters and cinematic letterbox
    const compCanvas = document.createElement('canvas');
    compCanvas.width = width;
    compCanvas.height = height;
    const ctx = compCanvas.getContext('2d');

    // Apply active CSS color filter
    const activeFilter = PHOTO_FILTERS[this.currentFilter]?.filter || 'none';
    if (activeFilter !== 'none') {
      ctx.filter = activeFilter;
    }

    ctx.drawImage(canvas, 0, 0);

    // Apply cinematic letterbox bars if active (2.39:1 widescreen anamorphic ratio)
    if (this.isLetterboxActive) {
      ctx.filter = 'none';
      ctx.fillStyle = '#000000';
      const barHeight = Math.round(height * 0.12);
      ctx.fillRect(0, 0, width, barHeight);
      ctx.fillRect(0, height - barHeight, width, barHeight);
    }

    // Add subtle elegant watermark timestamp in bottom-right
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `bold ${Math.max(16, Math.round(height * 0.024))}px Cinzel, serif`;
    ctx.textAlign = 'right';
    ctx.fillText('SHADOW QUEST', width - 24, height - (this.isLetterboxActive ? Math.round(height * 0.12) + 18 : 24));

    // 5. Generate PNG file & timestamp
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `ShadowQuest_Photo_${timestamp}.png`;

    try {
      const dataUrl = compCanvas.toDataURL('image/png');
      this.lastCapturedDataUrl = dataUrl;

      // Trigger automatic browser download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Convert to blob
      compCanvas.toBlob((blob) => {
        this.lastCapturedBlob = blob;
      }, 'image/png');

      if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
        this.game.uiManager.showCollectNotification(`📸 Saved photo: ${filename} (${width}x${height})`);
      }

      return { success: true, filename, width, height, dataUrl };
    } catch (err) {
      console.warn('[PhotoMode] Programmatic download blocked by browser, opening preview modal:', err);
      this.showPreviewModal(compCanvas.toDataURL('image/png'), filename, width, height);
      return { success: true, fallback: true, filename, width, height };
    }
  }

  showPreviewModal(dataUrl, filename, width, height) {
    if (!this.previewModal) return;

    const img = document.getElementById('photo-preview-img');
    const meta = document.getElementById('photo-preview-meta');
    const dlBtn = document.getElementById('photo-preview-download-btn');

    if (img) img.src = dataUrl;
    if (meta) meta.textContent = `${filename} • ${width} × ${height} PNG`;
    if (dlBtn) {
      dlBtn.onclick = () => {
        const a = document.createElement('a');
        a.download = filename;
        a.href = dataUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
    }

    this.previewModal.classList.remove('hidden');
  }

  /**
   * Main per-frame update loop called from Game.update while in photo mode
   */
  update(deltaTime) {
    if (!this.isActive) return;

    // Update free flight camera in CameraManager
    if (this.game.cameraManager) {
      this.game.cameraManager.updatePhotoMode(
        deltaTime,
        this.flyKeys,
        this.pendingMouseDeltaX,
        this.pendingMouseDeltaY
      );
    }

    this.pendingMouseDeltaX = 0;
    this.pendingMouseDeltaY = 0;
  }
}
