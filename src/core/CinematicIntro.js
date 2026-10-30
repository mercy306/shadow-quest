/**
 * CinematicIntro.js
 * CGI-style cinematic camera fly-through of Harar Jugol gate before gameplay.
 *
 * Coordinates:
 *  - Approach/Outside: z ~ -60 to -45
 *  - Shoa Gate: z = -42.0
 *  - Inside Harar Jugol city: z > -42.0 (alley extends towards z = 0, +20, +80)
 *
 * Sequence:
 *  0.0s – 2.0s  : Fade in from black. Camera outside gate, establishing wide cinematic view
 *  2.0s – 5.5s  : Smooth dolly forward over zebra crossing towards the honor guards
 *  5.5s – 8.5s  : Gliding through the central archway, camera tilts up to Emir portrait & battlements
 *  8.5s – 11.5s : Emerging into the lit cobblestone city street with Gegar houses & warm lanterns
 * 11.5s – 14.0s : Title card "HARAR JUGOL" fades in, camera eases to a stop
 * 14.0s – 15.5s : Smooth fade and transition to active gameplay
 */

import * as THREE from 'three';

function smootherstep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const CAMERA_KEYFRAMES = [
  // [time, position, lookAt]
  // 1. Wide establishing view of Shoa Gate outside at night
  { t: 0.0,  pos: new THREE.Vector3( 2.4, 2.0, -57.0), look: new THREE.Vector3( 0.0, 5.8, -42.0) },
  // 2. Dolly forward over zebra crossing towards the entrance
  { t: 3.5,  pos: new THREE.Vector3( 1.0, 2.2, -49.0), look: new THREE.Vector3( 0.0, 5.2, -42.0) },
  // 3. Passing the honor guards, tilting up towards the Emir portrait and scalloped battlements
  { t: 6.0,  pos: new THREE.Vector3( 0.0, 2.4, -44.5), look: new THREE.Vector3( 0.0, 5.8, -41.0) },
  // 4. Gliding through the central arch into the historic city
  { t: 8.5,  pos: new THREE.Vector3( 0.0, 2.2, -39.0), look: new THREE.Vector3( 0.0, 2.3, -20.0) },
  // 5. Revealing the illuminated Harari cobblestone alley, Gegar buildings & vibrant night life
  { t: 11.0, pos: new THREE.Vector3( -0.4, 2.4, -34.0), look: new THREE.Vector3( 0.0, 2.2, -5.0) },
  // 6. Final ease into player gameplay spawn position
  { t: 14.0, pos: new THREE.Vector3( 0.0, 2.5, -31.0), look: new THREE.Vector3( 0.0, 2.0, 10.0) },
];

const TOTAL_DURATION = 14.5; // seconds

export class CinematicIntro {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {Function} onComplete – called when intro finishes
   */
  constructor(camera, onComplete) {
    this.camera = camera;
    this.onComplete = onComplete;
    this.elapsed = 0;
    this.active = false;
    this.done = false;

    this._buildOverlay();
  }

  // ── DOM overlay for letterbox, cinematic title, fade ───────────────────────
  _buildOverlay() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', 'Cinzel', 'Georgia', serif",
      userSelect: 'none',
    });

    // Fade black layer
    this.fadeEl = document.createElement('div');
    Object.assign(this.fadeEl.style, {
      position: 'absolute',
      inset: '0',
      background: '#000',
      opacity: '1',
      transition: 'opacity 1.4s ease-out',
    });
    this.overlay.appendChild(this.fadeEl);

    // Top letterbox bar (cinematic 2.39:1 scope)
    this.barTop = document.createElement('div');
    Object.assign(this.barTop.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      height: '10%',
      background: '#05070a',
      boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
    });
    this.overlay.appendChild(this.barTop);

    // Bottom letterbox bar
    this.barBottom = document.createElement('div');
    Object.assign(this.barBottom.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: '10%',
      background: '#05070a',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.8)',
    });
    this.overlay.appendChild(this.barBottom);

    // Location subtitle (lower third)
    this.locationEl = document.createElement('div');
    Object.assign(this.locationEl.style, {
      position: 'absolute',
      bottom: '13%',
      left: '0',
      right: '0',
      textAlign: 'center',
      color: '#f6d89e',
      fontSize: 'clamp(12px, 1.4vw, 17px)',
      letterSpacing: '0.32em',
      opacity: '0',
      transition: 'opacity 1.2s ease',
      textTransform: 'uppercase',
      textShadow: '0 2px 10px rgba(0,0,0,0.9)',
    });
    this.locationEl.innerHTML = 'የሐረር ጁጎል • SHOA GATE (ሸዋ በር)<br><span style="font-size:0.85em; opacity:0.8; letter-spacing:0.2em; color:#e0f2fe;">UNESCO WORLD HERITAGE SITE</span>';
    this.overlay.appendChild(this.locationEl);

    // Main title card
    this.titleEl = document.createElement('div');
    Object.assign(this.titleEl.style, {
      position: 'absolute',
      top: '46%',
      left: '0',
      right: '0',
      transform: 'translateY(-50%)',
      textAlign: 'center',
      color: '#ffffff',
      fontSize: 'clamp(32px, 5.5vw, 68px)',
      fontWeight: '700',
      letterSpacing: '0.22em',
      opacity: '0',
      transition: 'opacity 1.6s ease',
      textTransform: 'uppercase',
      textShadow: '0 0 45px rgba(245, 158, 11, 0.6), 0 4px 15px rgba(0,0,0,0.95)',
    });
    this.titleEl.innerHTML = `
      <div style="font-size: 0.45em; letter-spacing: 0.4em; color: #f59e0b; margin-bottom: 8px;">THE HISTORIC WALLED CITY</div>
      <div><span style="color:#f59e0b;">ሐ</span>ARAR JUGOL</div>
      <div style="font-size: 0.28em; letter-spacing: 0.35em; color: #94a3b8; margin-top: 10px; font-weight: 400;">4TH HOLY CITY OF ISLAM • ETHIOPIA</div>
    `;
    this.overlay.appendChild(this.titleEl);

    // Skip button / prompt
    this.skipEl = document.createElement('div');
    Object.assign(this.skipEl.style, {
      position: 'absolute',
      bottom: '12%',
      right: '3%',
      color: 'rgba(255,255,255,0.65)',
      fontSize: 'clamp(11px, 1.1vw, 14px)',
      letterSpacing: '0.12em',
      padding: '6px 14px',
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '20px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      transition: 'all 0.2s ease',
    });
    this.skipEl.textContent = 'SKIP INTRO [SPACE]';
    this.skipEl.addEventListener('mouseenter', () => {
      this.skipEl.style.background = 'rgba(245,158,11,0.3)';
      this.skipEl.style.borderColor = '#f59e0b';
    });
    this.skipEl.addEventListener('mouseleave', () => {
      this.skipEl.style.background = 'rgba(0,0,0,0.4)';
      this.skipEl.style.borderColor = 'rgba(255,255,255,0.2)';
    });
    this.skipEl.addEventListener('click', () => this._finish());
    this.overlay.appendChild(this.skipEl);

    document.body.appendChild(this.overlay);

    // Global keyboard skip listener
    this._skipHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter') {
        this._finish();
      }
    };
    document.addEventListener('keydown', this._skipHandler);
  }

  // ── Start the cinematic intro ──────────────────────────────────────────────
  start() {
    this.active = true;
    this.elapsed = 0;

    // Position camera at start keyframe
    this.camera.position.copy(CAMERA_KEYFRAMES[0].pos);
    this.camera.lookAt(CAMERA_KEYFRAMES[0].look);
    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();

    // Fade in from black
    requestAnimationFrame(() => {
      this.fadeEl.style.opacity = '0';
    });
  }

  // ── Per-frame update ───────────────────────────────────────────────────────
  update(deltaTime) {
    if (!this.active || this.done) return;

    this.elapsed += deltaTime;

    // 1. Update camera motion along spline keyframes
    this._updateCameraPath();

    // 2. Lower third location subtitle: t = 1.5s to 7.0s
    if (this.elapsed >= 1.5 && this.elapsed < 7.0) {
      this.locationEl.style.opacity = '1';
    } else if (this.elapsed >= 7.0) {
      this.locationEl.style.opacity = '0';
    }

    // 3. Central title card: t = 9.5s to 13.0s
    if (this.elapsed >= 9.5 && this.elapsed < 13.0) {
      this.titleEl.style.opacity = '1';
    } else if (this.elapsed >= 13.0) {
      this.titleEl.style.opacity = '0';
    }

    // 4. Final fade to black transition: t = 13.5s to 14.5s
    if (this.elapsed >= 13.5) {
      const fadeProgress = Math.min((this.elapsed - 13.5) / 1.0, 1.0);
      this.fadeEl.style.transition = 'none';
      this.fadeEl.style.opacity = fadeProgress.toFixed(3);
    }

    // 5. Complete intro
    if (this.elapsed >= TOTAL_DURATION) {
      this._finish();
    }
  }

  // ── Smooth camera interpolation ────────────────────────────────────────────
  _updateCameraPath() {
    const kf = CAMERA_KEYFRAMES;
    const len = kf.length;

    let i = 0;
    for (let k = 0; k < len - 1; k++) {
      if (this.elapsed >= kf[k].t && this.elapsed < kf[k + 1].t) {
        i = k;
        break;
      }
      if (this.elapsed >= kf[len - 1].t) {
        i = len - 2;
      }
    }

    const a = kf[i];
    const b = kf[Math.min(i + 1, len - 1)];
    const segDur = b.t - a.t;
    const rawT = segDur > 0 ? (this.elapsed - a.t) / segDur : 1.0;
    const st = smootherstep(Math.max(0, Math.min(1, rawT)));

    const pos = new THREE.Vector3().lerpVectors(a.pos, b.pos, st);
    const look = new THREE.Vector3().lerpVectors(a.look, b.look, st);

    this.camera.position.copy(pos);
    this.camera.lookAt(look);
  }

  // ── Finish intro and hand over to gameplay ─────────────────────────────────
  _finish() {
    if (this.done) return;
    this.done = true;
    this.active = false;

    document.removeEventListener('keydown', this._skipHandler);

    // Fade overlay out smoothly
    if (this.fadeEl) {
      this.fadeEl.style.transition = 'opacity 0.6s ease';
      this.fadeEl.style.opacity = '1';
    }

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }, 600);
  }

  dispose() {
    this.done = true;
    this.active = false;
    document.removeEventListener('keydown', this._skipHandler);
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
