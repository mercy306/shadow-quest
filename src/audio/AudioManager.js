import * as THREE from 'three';

export class AudioManager {
  constructor(camera = null) {
    this.listener = new THREE.AudioListener();
    if (camera) {
      camera.add(this.listener);
    }

    this.audioCtx = null;
    this.isInitialized = false;
    this.isMuted = false;

    // Volume levels (0.0 - 1.0)
    this.masterVolume = 0.8;
    this.musicVolume = 0.65;
    this.sfxVolume = 0.85;

    // Audio Graph Nodes
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Loaded AudioBuffer cache
    this.audioBuffers = new Map();

    // Ambience / Music state
    this.currentAmbienceSource = null;
    this.currentAmbienceLevel = null;

    // Dynamic Weather Audio State
    this.rainNoiseSource = null;
    this.rainGain = null;
    this.rainFilter = null;
    this.rainIntensity = 0.0;

    this.setupGestureUnlock();
  }

  setupGestureUnlock() {
    const unlock = () => {
      this.initAudioContext();
      if (this.currentAmbienceLevel !== null && !this.currentAmbienceSource) {
        this.playAmbience(this.currentAmbienceLevel);
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('pointerdown', unlock);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) unlock();
    });
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();

        // Create main gain nodes
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.audioCtx.currentTime);

        this.musicGain = this.audioCtx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime);

        this.sfxGain = this.audioCtx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);

        // Connect graph: sfx/music -> master -> destination
        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.audioCtx.destination);

        this.isInitialized = true;
        this.preloadLocalAudioFiles();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  init() {
    this.initAudioContext();
  }

  async preloadLocalAudioFiles() {
    const soundFiles = [
      { key: 'sword_swing', url: '/audio/sword_swing.wav' },
      { key: 'sword_hit', url: '/audio/sword_hit.wav' },
      { key: 'enemy_attack', url: '/audio/enemy_attack.wav' },
      { key: 'enemy_death', url: '/audio/enemy_death.wav' },
      { key: 'crystal_collect', url: '/audio/crystal_collect.wav' },
      { key: 'player_damage', url: '/audio/player_damage.wav' },
      { key: 'jump', url: '/audio/jump.wav' },
      { key: 'land', url: '/audio/land.wav' },
      { key: 'victory', url: '/audio/victory.wav' },
      { key: 'forest_ambience', url: '/audio/forest_ambience.wav' },
      { key: 'ruins_ambience', url: '/audio/ruins_ambience.wav' }
    ];

    for (const item of soundFiles) {
      try {
        const resp = await fetch(item.url);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          if (this.audioCtx) {
            const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(item.key, audioBuffer);
          }
        }
      } catch (e) {
        // Fallback to procedural synthesis if fetch fails
      }
    }
  }

  playBuffer(key, gainTarget = this.sfxGain, volume = 1.0) {
    if (this.isMuted) return false;
    this.initAudioContext();
    if (!this.audioCtx) return false;

    const buffer = this.audioBuffers.get(key);
    if (!buffer) return false;

    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);

      source.connect(gain);
      gain.connect(gainTarget || this.sfxGain || this.audioCtx.destination);

      source.start(0);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ===== AMBIENCE & BACKGROUND MUSIC =====
  playAmbience(levelIndex = 0) {
    this.currentAmbienceLevel = levelIndex;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    const key = levelIndex === 0 ? 'forest_ambience' : 'ruins_ambience';

    if (this.currentAmbienceSource) {
      try {
        this.currentAmbienceSource.stop();
        this.currentAmbienceSource.disconnect();
      } catch (e) {}
      this.currentAmbienceSource = null;
    }

    const buffer = this.audioBuffers.get(key);
    if (buffer) {
      try {
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        source.connect(this.musicGain || this.masterGain || this.audioCtx.destination);
        source.start(0);
        this.currentAmbienceSource = source;
        return;
      } catch (e) {}
    }

    // Procedural Ambient Synth Fallback
    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const padGain = this.audioCtx.createGain();

      if (levelIndex === 0) {
        // Forest Warm Drone (D3 + A3)
        osc1.frequency.setValueAtTime(146.83, now);
        osc2.frequency.setValueAtTime(220.00, now);
        filter.frequency.setValueAtTime(600, now);
      } else if (levelIndex === 1) {
        // Ancient Ruins Nocturne Drone (A2 + E3)
        osc1.frequency.setValueAtTime(110.00, now);
        osc2.frequency.setValueAtTime(164.81, now);
        filter.frequency.setValueAtTime(450, now);
      } else if (levelIndex === 2) {
        // Mountain Pass Highwind Alpine Drone (F3 + C4)
        osc1.frequency.setValueAtTime(174.61, now);
        osc2.frequency.setValueAtTime(261.63, now);
        filter.frequency.setValueAtTime(750, now);
      } else if (levelIndex === 3) {
        // Abandoned Village Twilight Drone (G2 + D3)
        osc1.frequency.setValueAtTime(98.00, now);
        osc2.frequency.setValueAtTime(146.83, now);
        filter.frequency.setValueAtTime(400, now);
      } else {
        // Whispering Cavern Deep Subterranean Drone (E2 + B2)
        osc1.frequency.setValueAtTime(82.41, now);
        osc2.frequency.setValueAtTime(123.47, now);
        filter.frequency.setValueAtTime(320, now);
      }

      osc1.type = 'sine';
      osc2.type = 'triangle';
      filter.type = 'lowpass';

      padGain.gain.setValueAtTime(0.08, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(padGain);
      padGain.connect(this.musicGain || this.masterGain || this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      this.currentAmbienceSource = {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (e) {}
        },
        disconnect: () => {
          try {
            padGain.disconnect();
          } catch (e) {}
        }
      };
    } catch (e) {}
  }

  stopAmbience() {
    if (this.currentAmbienceSource) {
      try {
        this.currentAmbienceSource.stop();
        this.currentAmbienceSource.disconnect();
      } catch (e) {}
      this.currentAmbienceSource = null;
    }
  }

  // ===== SOUND EFFECTS =====

  playFootstep(isRunning = false, isSprinting = false) {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isRunning ? 260 : 180, now);

      osc.type = 'triangle';
      const baseFreq = isSprinting ? 95 : (isRunning ? 80 : 65);
      const pitchVar = (Math.random() - 0.5) * 12;
      osc.frequency.setValueAtTime(baseFreq + pitchVar, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.07);

      const vol = (isSprinting ? 0.32 : (isRunning ? 0.22 : 0.14)) * this.sfxVolume * this.masterVolume;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playSwordSlash() {
    if (this.playBuffer('sword_swing', this.sfxGain, 0.9)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playSwordHit() {
    if (this.playBuffer('sword_hit', this.sfxGain, 1.0)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1120, now);
      osc1.frequency.exponentialRampToValueAtTime(260, now + 0.25);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(840, now);
      osc2.frequency.exponentialRampToValueAtTime(180, now + 0.22);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch (e) {}
  }

  playEnemyAttack() {
    if (this.playBuffer('enemy_attack', this.sfxGain, 0.95)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playEnemyDeath() {
    if (this.playBuffer('enemy_death', this.sfxGain, 1.0)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const sub = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

      sub.type = 'sine';
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.7);
      sub.stop(now + 0.7);
    } catch (e) {}
  }

  playCrystalCollect() {
    if (this.playBuffer('crystal_collect', this.sfxGain, 1.0)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const freqs = [1046.50, 1318.51, 1567.98, 1975.53, 2093.00];

      freqs.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.05 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.65);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.audioCtx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.7);
      });
    } catch (e) {}
  }

  playPlayerDamage() {
    if (this.playBuffer('player_damage', this.sfxGain, 1.0)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(95, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.28);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(220, now);
      osc2.frequency.setValueAtTime(233, now + 0.06);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  playJump() {
    if (this.playBuffer('jump', this.sfxGain, 0.75)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.2);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch (e) {}
  }

  playLand() {
    if (this.playBuffer('land', this.sfxGain, 0.8)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playEntranceUnlocked() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const freqs = [220, 277.18, 329.63, 440, 880];
      freqs.forEach((f, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.0);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.audioCtx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 2.2);
      });
    } catch (e) {}
  }

  playVictoryFanfare() {
    if (this.playBuffer('victory', this.sfxGain, 1.0)) return;
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [
        { f: 523.25, t: 0.0, d: 0.2 },
        { f: 659.25, t: 0.18, d: 0.2 },
        { f: 783.99, t: 0.36, d: 0.3 },
        { f: 1046.50, t: 0.6, d: 1.6 }
      ];

      notes.forEach(n => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0, now + n.t);
        gain.gain.linearRampToValueAtTime(0.22, now + n.t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.audioCtx.destination);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.d + 0.1);
      });
    } catch (e) {}
  }

  // ===== DYNAMIC WEATHER AUDIO =====

  /**
   * Continuous procedural rain ambience synthesis
   */
  updateRainAmbience(intensity = 0.5) {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    this.rainIntensity = Math.max(0, Math.min(1, intensity));

    try {
      const now = this.audioCtx.currentTime;

      if (!this.rainNoiseSource) {
        // Generate 3 seconds of looping pinkish noise buffer for smooth rainfall
        const bufferSize = this.audioCtx.sampleRate * 3;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.08;
        }

        this.rainNoiseSource = this.audioCtx.createBufferSource();
        this.rainNoiseSource.buffer = noiseBuffer;
        this.rainNoiseSource.loop = true;

        // Bandpass filter to shape rain hiss/patter
        this.rainFilter = this.audioCtx.createBiquadFilter();
        this.rainFilter.type = 'lowpass';
        this.rainFilter.frequency.setValueAtTime(1400, now);

        this.rainGain = this.audioCtx.createGain();
        this.rainGain.gain.setValueAtTime(0.001, now);

        this.rainNoiseSource.connect(this.rainFilter);
        this.rainFilter.connect(this.rainGain);
        this.rainGain.connect(this.musicGain || this.audioCtx.destination);

        this.rainNoiseSource.start(now);
      }

      // Modulate volume and filter based on rain intensity
      const targetGain = this.rainIntensity * 0.32;
      const targetCutoff = 1000 + this.rainIntensity * 1200;

      if (this.rainGain && this.rainFilter) {
        this.rainGain.gain.cancelScheduledValues(now);
        this.rainGain.gain.linearRampToValueAtTime(targetGain, now + 0.3);
        this.rainFilter.frequency.cancelScheduledValues(now);
        this.rainFilter.frequency.linearRampToValueAtTime(targetCutoff, now + 0.3);
      }
    } catch (e) {
      console.warn('[AudioManager] Rain ambience update issue:', e);
    }
  }

  stopRainAmbience() {
    if (!this.rainNoiseSource || !this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      if (this.rainGain) {
        this.rainGain.gain.cancelScheduledValues(now);
        this.rainGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
      }

      const src = this.rainNoiseSource;
      this.rainNoiseSource = null;
      setTimeout(() => {
        try {
          src.stop();
          src.disconnect();
        } catch (e) {}
      }, 700);
    } catch (e) {}
  }

  /**
   * Synthesizes deep, rolling atmospheric thunder rumble
   */
  playThunder() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // 1. Sub-bass resonant roll (descending pitch sweep)
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(82, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 2.2);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.35, now + 0.12);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain || this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 2.5);

      // 2. Low-frequency rolling noise crackle
      const duration = 2.8;
      const bufferSize = Math.floor(this.audioCtx.sampleRate * duration);
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseSrc = this.audioCtx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + duration);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.28, now + 0.15);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSrc.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain || this.audioCtx.destination);

      noiseSrc.start(now);
      noiseSrc.stop(now + duration + 0.1);
    } catch (e) {
      console.warn('[AudioManager] Thunder synthesis issue:', e);
    }
  }

  /**
   * Synthesizes rhythmic horse hoofbeat contact
   */
  playHoofbeat(volume = 0.25) {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // Double-strike cadence (primary strike + trailing tap)
      [0.0, 0.055].forEach((offset, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        const startFreq = idx === 0 ? 115 : 85;
        osc.frequency.setValueAtTime(startFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(32, now + offset + 0.08);

        const tapVol = (idx === 0 ? volume : volume * 0.65) * this.sfxVolume;
        gain.gain.setValueAtTime(tapVol, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.audioCtx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } catch (e) {}
  }

  /**
   * Synthesizes clear mount call whistle
   */
  playMountWhistle() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.linearRampToValueAtTime(2200, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(1750, now + 0.38);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.24 * this.sfxVolume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  // ===== CONTROLS & SETTINGS =====

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.audioCtx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.audioCtx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime);
    }
  }

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.audioCtx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  setMute(isMuted) {
    this.isMuted = isMuted;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.audioCtx.currentTime);
    }
    if (!this.isMuted && this.currentAmbienceLevel !== null && !this.currentAmbienceSource) {
      this.playAmbience(this.currentAmbienceLevel);
    }
  }

  update(deltaTime) {
    // Positional updates if needed
  }
}
