import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationController } from './AnimationController.js';
import { Sword } from './Sword.js';

/**
 * RemotePlayer
 * Renders the co-op partner in 3D space with smooth positional/rotational lerping,
 * animation synchronization, overhead nameplate, and health indicator.
 */
export class RemotePlayer {
  constructor(scene, peerId = 'peer', name = 'Player 2') {
    this.scene = scene;
    this.peerId = peerId;
    this.name = name;

    this.mesh = new THREE.Group();
    this.mesh.name = `remote-player-${peerId}`;

    this.position = this.mesh.position;
    this.rotation = this.mesh.rotation;

    // Target transformation buffers for smooth interpolation
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.targetRotY = 0;
    this.lerpSpeed = 14.0;

    // Remote status
    this.health = 100;
    this.maxHealth = 100;
    this.currentAnim = 'Idle';
    this.isAttacking = false;
    this.isHeavyAttacking = false;
    this.isRolling = false;
    this.isCrouching = false;
    this.isRiding = false;

    this.model = null;
    this.animController = null;
    this.sword = null;
    this.isLoaded = false;
    this.nameplateSprite = null;

    if (this.scene) {
      this.scene.add(this.mesh);
    }

    this.init();
  }

  async init() {
    const loader = new GLTFLoader();
    const modelPath = './models/Soldier.glb';

    try {
      const gltf = await loader.loadAsync(modelPath);
      this.model = gltf.scene;

      this.model.scale.set(1.0, 1.0, 1.0);
      this.model.rotation.y = Math.PI;

      let rightHandBone = null;

      // Apply distinct co-op color styling (cyan accent)
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material = child.material.clone();
            // Subtle cyan tint on partner
            child.material.color.setHex(0x38bdf8);
            child.material.roughness = 0.45;
          }
        }

        if (child.isBone) {
          const boneName = child.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (boneName.includes('righthand') || boneName.includes('handr')) {
            rightHandBone = child;
          }
        }
      });

      this.mesh.add(this.model);

      // Attach sword
      this.sword = new Sword();
      if (rightHandBone) {
        this.sword.attachToHand(rightHandBone);
      } else {
        this.sword.mesh.position.set(0.4, 1.0, 0);
        this.model.add(this.sword.mesh);
      }

      // Initialize Animation Controller
      if (gltf.animations && gltf.animations.length > 0) {
        this.animController = new AnimationController(this.model, gltf.animations);
        this.animController.play('Idle', 0.1);
      }

      // Create floating overhead billboarding nameplate & HP bar
      this.createOverheadHUD();

      this.isLoaded = true;
      this.scene.add(this.mesh);

    } catch (err) {
      console.warn('[RemotePlayer] Failed to load Soldier.glb for remote player, using proxy:', err);
      this.initFallback();
    }
  }

  initFallback() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2
    });
    const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.2, 8, 16), mat);
    capsule.position.y = 1.0;
    capsule.castShadow = true;
    group.add(capsule);

    this.mesh.add(group);
    this.createOverheadHUD();
    this.isLoaded = true;
    this.scene.add(this.mesh);
  }

  createOverheadHUD() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    this.hudCanvas = canvas;
    this.hudCtx = canvas.getContext('2d');

    this.updateHUDTexture();

    const texture = new THREE.CanvasTexture(canvas);
    this.hudTexture = texture;

    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    this.nameplateSprite = new THREE.Sprite(spriteMat);
    this.nameplateSprite.position.set(0, 2.3, 0);
    this.nameplateSprite.scale.set(2.4, 0.6, 1.0);
    this.mesh.add(this.nameplateSprite);
  }

  updateHUDTexture() {
    if (!this.hudCtx) return;
    const ctx = this.hudCtx;
    ctx.clearRect(0, 0, 256, 64);

    // Background pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(10, 4, 236, 56, 8);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Name text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Cinzel, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name.toUpperCase(), 128, 28);

    // Health bar track
    ctx.fillStyle = '#334155';
    ctx.fillRect(28, 38, 200, 12);

    // Health bar fill
    const pct = Math.max(0, Math.min(1, this.health / (this.maxHealth || 100)));
    ctx.fillStyle = pct > 0.4 ? '#38bdf8' : '#ef4444';
    ctx.fillRect(28, 38, 200 * pct, 12);

    if (this.hudTexture) {
      this.hudTexture.needsUpdate = true;
    }
  }

  setTargetTransform(x, y, z, rotY, anim, state = {}) {
    this.targetPosition.set(x, y, z);
    this.targetRotY = rotY;

    if (anim && anim !== this.currentAnim) {
      this.setAnimation(anim);
    }

    if (typeof state.health === 'number') {
      const prevHealth = this.health;
      this.health = state.health;
      this.maxHealth = state.maxHealth || 100;
      if (prevHealth !== this.health) {
        this.updateHUDTexture();
      }
    }

    this.isAttacking = Boolean(state.isAttacking);
    this.isHeavyAttacking = Boolean(state.isHeavyAttacking);
    this.isRolling = Boolean(state.isRolling);
  }

  setAnimation(animName) {
    this.currentAnim = animName;
    if (this.animController) {
      // Map incoming anim strings to available clips
      let clip = 'Idle';
      if (animName === 'Run') clip = 'Run';
      else if (animName === 'Walk') clip = 'Walk';
      else if (animName === 'Roll') clip = 'Run'; // fallback if no specific roll clip
      else if (animName === 'Dead') clip = 'Dead';

      this.animController.play(clip, 0.15);
    }
  }

  triggerAttackAnimation(isHeavy = false) {
    if (this.sword && typeof this.sword.swing === 'function') {
      this.sword.swing(isHeavy ? 0.5 : 0.28);
    }
  }

  update(deltaTime) {
    if (!this.isLoaded) return;

    // Exponential smoothing / lerp towards target server position
    const t = 1.0 - Math.exp(-this.lerpSpeed * deltaTime);
    this.mesh.position.lerp(this.targetPosition, t);

    // Smooth yaw rotation
    let diff = (this.targetRotY - this.mesh.rotation.y) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    this.mesh.rotation.y += diff * t;

    // Update animations
    if (this.animController) {
      this.animController.update(deltaTime);
    }
    if (this.sword && typeof this.sword.update === 'function') {
      this.sword.update(deltaTime);
    }
  }

  destroy() {
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    if (this.hudTexture) {
      this.hudTexture.dispose();
    }
    if (this.nameplateSprite) {
      if (this.nameplateSprite.material) this.nameplateSprite.material.dispose();
    }
  }
}
