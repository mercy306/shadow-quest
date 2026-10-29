import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadSharedModel } from '../core/ModelLoader.js';
import { AnimationController } from './AnimationController.js';
import { CircleCollider } from '../physics/Colliders.js';

export class NPC {
  constructor(scene, physicsWorld, config = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;

    this.id = config.id || `npc-${Math.random().toString(36).substring(2, 7)}`;
    this.name = config.name || 'Wanderer';
    this.title = config.title || 'Villager';
    this.role = config.role || 'villager'; // 'quest_giver' | 'merchant' | 'villager'
    this.modelPath = config.modelPath || './models/Soldier.glb';
    this.avatar = config.avatar || '🧙‍♂️';

    this.position = new THREE.Vector3(config.x || 0, config.y || 0, config.z || 0);
    this.rotationY = config.rotY || 0;

    this.interactionRadius = config.interactionRadius || 3.5;
    this.radius = 0.55;
    this.height = 1.9;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    this.model = null;
    this.animController = null;
    this.isLoaded = false;
    this.hasRiggedAnimations = false;

    // Overhead indicator sprite (Canvas texture)
    this.overheadSprite = null;
    this.questStatus = 'none'; // 'none' | 'available' | 'in_progress' | 'ready_turn_in'

    // Physics collider
    this.collider = new CircleCollider(
      this.position.x,
      this.position.z,
      this.radius,
      -10,
      10,
      `npc-${this.id}`
    );

    if (this.physicsWorld && typeof this.physicsWorld.addCollider === 'function') {
      this.physicsWorld.addCollider(this.collider);
    }

    this.scene.add(this.mesh);
  }

  async init() {
    try {
      const gltf = await loadSharedModel(this.modelPath);
      this.model = gltf.scene;
      this.model.scale.set(1.0, 1.0, 1.0);

      // Traversal for shadows and unique material customization per NPC
      this.model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Hide robotic visor for humanoid soldier models
          if (child.name && child.name.toLowerCase().includes('visor')) {
            child.visible = false;
          }

          if (child.material) {
            // Apply customized Ethiopian styling based on role
            if (this.role === 'merchant') {
              // Axumite Caravaneer amber leather & brass
              child.material = new THREE.MeshStandardMaterial({
                color: child.name.toLowerCase().includes('head') ? 0x6b4423 : 0xd97706,
                roughness: 0.6,
                metalness: 0.25
              });
            } else if (this.role === 'quest_giver') {
              // Elder pure white cotton Gabi with gold trim
              child.material = new THREE.MeshStandardMaterial({
                color: child.name.toLowerCase().includes('head') ? 0x5a3825 : 0xf4f0e6,
                roughness: 0.75,
                metalness: 0.1
              });
            } else if (this.role === 'forest_hermit') {
              // Highland Hermit olive and earth-tone Shamma
              child.material = new THREE.MeshStandardMaterial({
                color: child.name.toLowerCase().includes('head') ? 0x5a3825 : 0x2e4a28,
                roughness: 0.8,
                metalness: 0.1
              });
            }
          }
        }
      });

      this.mesh.add(this.model);

      // Animation Controller
      if (gltf.animations && gltf.animations.length > 0) {
        this.animController = new AnimationController(this.model, gltf.animations);
        this.hasRiggedAnimations = true;
        // Play default idle animation
        this.playAnimation('Idle');
      }

      this.isLoaded = true;
      this.groundToTerrain();
      this.createOverheadSprite();

    } catch (err) {
      console.warn(`[NPC] Failed to load 3D model ${this.modelPath}, falling back to proxy:`, err);
      this.createFallbackMesh();
    }
  }

  createFallbackMesh() {
    const geo = new THREE.CapsuleGeometry(0.5, 1.0, 6, 12);
    const color = this.role === 'merchant' ? 0xd97706 : (this.role === 'quest_giver' ? 0x2563eb : 0x16a34a);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
    const cap = new THREE.Mesh(geo, mat);
    cap.position.y = 0.95;
    this.mesh.add(cap);
    this.isLoaded = true;
    this.groundToTerrain();
    this.createOverheadSprite();
  }

  groundToTerrain() {
    if (this.physicsWorld && typeof this.physicsWorld.getGroundHeight === 'function') {
      const groundY = this.physicsWorld.getGroundHeight(this.position.x, this.position.z, this.position.y);
      this.position.y = groundY;
      this.mesh.position.y = groundY;
      if (this.collider) {
        this.collider.minY = groundY - 1;
        this.collider.maxY = groundY + this.height + 1;
      }
    }
  }

  playAnimation(clipName) {
    if (!this.animController) return;
    this.animController.play(clipName, 0.25);
  }

  createOverheadSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.spriteTexture = new THREE.CanvasTexture(canvas);
    this.spriteTexture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.spriteTexture,
      transparent: true,
      depthWrite: false
    });

    this.overheadSprite = new THREE.Sprite(spriteMat);
    this.overheadSprite.position.y = this.height + 0.65;
    this.overheadSprite.scale.set(2.2, 1.1, 1.0);
    this.mesh.add(this.overheadSprite);

    this.updateOverheadCanvas();
  }

  setQuestStatus(status) {
    this.questStatus = status;
    this.updateOverheadCanvas();
  }

  updateOverheadCanvas() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 256, 128);

    // Rounded background pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;

    // Change border color depending on role
    if (this.role === 'merchant') ctx.strokeStyle = '#f59e0b';
    else if (this.role === 'quest_giver') ctx.strokeStyle = '#60a5fa';
    else ctx.strokeStyle = '#4ade80';

    ctx.beginPath();
    ctx.roundRect(10, 20, 236, 88, 16);
    ctx.fill();
    ctx.stroke();

    // Quest icon if available or ready
    if (this.questStatus === 'available') {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 35, 75);
    } else if (this.questStatus === 'ready_turn_in') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', 35, 75);
    }

    // Name text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    const textX = (this.questStatus !== 'none') ? 140 : 128;
    ctx.fillText(this.name, textX, 56);

    // Title / Role badge
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText(this.title, textX, 86);

    if (this.spriteTexture) {
      this.spriteTexture.needsUpdate = true;
    }
  }

  update(deltaTime, playerPosition) {
    if (this.animController) {
      this.animController.update(deltaTime);
    }

    // Smoothly turn to face player when within interaction radius
    if (playerPosition) {
      const dx = playerPosition.x - this.position.x;
      const dz = playerPosition.z - this.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= this.interactionRadius + 1.5) {
        const targetRotY = Math.atan2(dx, dz);
        // Smooth spherical/angular lerp
        let diff = targetRotY - this.mesh.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1.0, deltaTime * 4.0);
      }
    }
  }

  isPlayerInRange(playerPos) {
    if (!playerPos) return false;
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    return Math.hypot(dx, dz) <= this.interactionRadius;
  }

  dispose() {
    if (this.overheadSprite) {
      this.mesh.remove(this.overheadSprite);
      if (this.spriteTexture) this.spriteTexture.dispose();
    }
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    if (this.physicsWorld && this.collider) {
      const idx = this.physicsWorld.colliders.indexOf(this.collider);
      if (idx !== -1) this.physicsWorld.colliders.splice(idx, 1);
    }
  }
}
