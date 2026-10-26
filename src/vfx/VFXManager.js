import * as THREE from 'three';

export class VFXManager {
  constructor(scene) {
    this.scene = scene;

    // Particle pools
    this.sparkParticles = [];
    this.collectParticles = [];
    this.victoryParticles = [];
    this.floatingTexts = [];

    // Sword trail state
    this.swordTrail = null;
    this.isAttacking = false;
    this.trailHistory = [];
    this.maxTrailPoints = 16;

    this.initSparkPool();
    this.initCollectPool();
    this.initVictoryPool();
    this.initDustPool();
    this.initSwordTrail();
    this.initFloatingTextPool();
  }

  // ===== DUST PARTICLES (Footsteps, Running, Sprinting) =====
  initDustPool() {
    this.maxDust = 50;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxDust * 3);
    const colors = new Float32Array(this.maxDust * 3);
    const sizes = new Float32Array(this.maxDust);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.dustPoints = new THREE.Points(geo, mat);
    this.scene.add(this.dustPoints);

    this.dustParticles = [];
    for (let i = 0; i < this.maxDust; i++) {
      this.dustParticles.push({
        active: false,
        pos: new THREE.Vector3(0, -9999, 0),
        vel: new THREE.Vector3(),
        color: new THREE.Color(0.55, 0.48, 0.38), // Ground dirt / dust
        life: 0,
        maxLife: 0.4
      });
    }
  }

  spawnFootstepDust(position, isSprinting = false) {
    const count = isSprinting ? 5 : 2;
    let spawned = 0;
    for (let i = 0; i < this.dustParticles.length && spawned < count; i++) {
      const p = this.dustParticles[i];
      if (!p.active) {
        p.active = true;
        p.pos.set(
          position.x + (Math.random() - 0.5) * 0.4,
          position.y + 0.08,
          position.z + (Math.random() - 0.5) * 0.4
        );
        p.vel.set(
          (Math.random() - 0.5) * (isSprinting ? 1.6 : 0.6),
          Math.random() * 0.6 + 0.3,
          (Math.random() - 0.5) * (isSprinting ? 1.6 : 0.6)
        );
        p.life = 0;
        p.maxLife = Math.random() * 0.2 + (isSprinting ? 0.35 : 0.25);
        spawned++;
      }
    }
  }

  // ===== 1. IMPACT SPARK PARTICLES (Pooled) =====
  initSparkPool() {
    this.maxSparks = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxSparks * 3);
    const colors = new Float32Array(this.maxSparks * 3);
    const sizes = new Float32Array(this.maxSparks);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparkPoints = new THREE.Points(geo, mat);
    this.scene.add(this.sparkPoints);

    for (let i = 0; i < this.maxSparks; i++) {
      this.sparkParticles.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        color: new THREE.Color(1.0, 0.7, 0.2), // Bright fire spark
        life: 0,
        maxLife: 0.4
      });
    }
  }

  spawnImpactSparks(position, count = 16, colorHex = 0xffaa33) {
    let spawned = 0;
    const baseColor = new THREE.Color(colorHex);

    for (let i = 0; i < this.sparkParticles.length && spawned < count; i++) {
      const p = this.sparkParticles[i];
      if (!p.active) {
        p.active = true;
        p.pos.copy(position).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2 + 0.3,
          (Math.random() - 0.5) * 0.2
        ));

        // Radial burst velocity
        const speed = 3.5 + Math.random() * 4.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.2) * Math.PI;

        p.vel.set(
          Math.cos(theta) * Math.cos(phi) * speed,
          Math.sin(phi) * speed + 2.0,
          Math.sin(theta) * Math.cos(phi) * speed
        );

        p.color.copy(baseColor);
        p.life = 0;
        p.maxLife = 0.25 + Math.random() * 0.25;
        spawned++;
      }
    }
  }

  // ===== 2. CRYSTAL COLLECTION BURST PARTICLES (Pooled) =====
  initCollectPool() {
    this.maxCollects = 150;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxCollects * 3);
    const colors = new Float32Array(this.maxCollects * 3);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.collectPoints = new THREE.Points(geo, mat);
    this.scene.add(this.collectPoints);

    for (let i = 0; i < this.maxCollects; i++) {
      this.collectParticles.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        color: new THREE.Color(0.2, 0.8, 1.0), // Cyan crystal shimmer
        life: 0,
        maxLife: 0.7
      });
    }
  }

  spawnCrystalBurst(position, colorHex = 0x38bdf8) {
    let spawned = 0;
    const count = 35;
    const baseColor = new THREE.Color(colorHex);

    for (let i = 0; i < this.collectParticles.length && spawned < count; i++) {
      const p = this.collectParticles[i];
      if (!p.active) {
        p.active = true;
        p.pos.copy(position);

        const speed = 2.0 + Math.random() * 5.0;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.3) * Math.PI;

        p.vel.set(
          Math.cos(theta) * Math.cos(phi) * speed,
          Math.sin(phi) * speed + 3.0,
          Math.sin(theta) * Math.cos(phi) * speed
        );

        p.color.copy(baseColor).offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.15);
        p.life = 0;
        p.maxLife = 0.5 + Math.random() * 0.4;
        spawned++;
      }
    }
  }

  // ===== 3. VICTORY CELEBRATION FOUNTAIN (Pooled) =====
  initVictoryPool() {
    this.maxVictory = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxVictory * 3);
    const colors = new Float32Array(this.maxVictory * 3);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.victoryPoints = new THREE.Points(geo, mat);
    this.scene.add(this.victoryPoints);

    for (let i = 0; i < this.maxVictory; i++) {
      this.victoryParticles.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        maxLife: 1.5
      });
    }
  }

  triggerVictoryCelebration(centerPosition) {
    const palette = [0xf59e0b, 0x38bdf8, 0xa855f7, 0x10b981, 0xf43f5e];
    const pos = centerPosition || new THREE.Vector3(0, 1.5, 0);

    let spawned = 0;
    for (let i = 0; i < this.victoryParticles.length && spawned < 140; i++) {
      const p = this.victoryParticles[i];
      if (!p.active) {
        p.active = true;
        p.pos.copy(pos).add(new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          Math.random() * 0.5,
          (Math.random() - 0.5) * 2.5
        ));

        const speed = 4.0 + Math.random() * 8.0;
        const angle = Math.random() * Math.PI * 2;
        p.vel.set(
          Math.cos(angle) * speed * 0.7,
          8.0 + Math.random() * 6.0,
          Math.sin(angle) * speed * 0.7
        );

        p.color.setHex(palette[Math.floor(Math.random() * palette.length)]);
        p.life = 0;
        p.maxLife = 1.4 + Math.random() * 0.8;
        spawned++;
      }
    }
  }

  // ===== 4. SWORD BLADE ARC TRAIL (Vertex-Colored Ribbon) =====
  initSwordTrail() {
    const segments = this.maxTrailPoints;
    const vertexCount = segments * 2;
    const indices = [];

    for (let i = 0; i < segments - 1; i++) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2));
    geo.setIndex(indices);

    this.trailMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.swordTrailMesh = new THREE.Mesh(geo, this.trailMat);
    this.swordTrailMesh.frustumCulled = false;
    this.scene.add(this.swordTrailMesh);
  }

  updateSwordTrail(isAttacking, tipPos, basePos) {
    if (isAttacking && tipPos && basePos) {
      this.trailHistory.unshift({
        tip: tipPos.clone(),
        base: basePos.clone()
      });

      if (this.trailHistory.length > this.maxTrailPoints) {
        this.trailHistory.pop();
      }
      this.trailMat.opacity = Math.min(0.9, this.trailMat.opacity + 0.2);
    } else {
      if (this.trailHistory.length > 0) {
        this.trailHistory.pop();
        this.trailMat.opacity = Math.max(0, this.trailMat.opacity - 0.12);
      }
    }

    // Update geometry buffer with tapered glowing colors
    const geo = this.swordTrailMesh.geometry;
    const posAttr = geo.attributes.position;
    const colAttr = geo.attributes.color;
    const uvAttr = geo.attributes.uv;

    const count = this.trailHistory.length;
    for (let i = 0; i < this.maxTrailPoints; i++) {
      const idx = i * 2;
      const i3Base = idx * 3;
      const i3Tip = (idx + 1) * 3;

      if (i < count) {
        const h = this.trailHistory[i];
        posAttr.setXYZ(idx, h.base.x, h.base.y, h.base.z);
        posAttr.setXYZ(idx + 1, h.tip.x, h.tip.y, h.tip.z);

        const fade = Math.pow(Math.max(0, 1.0 - (i / count)), 1.5);
        // Tip: Brilliant white/cyan
        colAttr.setXYZ(idx + 1, 0.7 * fade, 0.9 * fade, 1.0 * fade);
        // Base: Deep cyan/electric blue
        colAttr.setXYZ(idx, 0.1 * fade, 0.6 * fade, 0.95 * fade);
      } else if (count > 0) {
        const last = this.trailHistory[count - 1];
        posAttr.setXYZ(idx, last.base.x, last.base.y, last.base.z);
        posAttr.setXYZ(idx + 1, last.tip.x, last.tip.y, last.tip.z);
        colAttr.setXYZ(idx, 0, 0, 0);
        colAttr.setXYZ(idx + 1, 0, 0, 0);
      } else {
        colAttr.setXYZ(idx, 0, 0, 0);
        colAttr.setXYZ(idx + 1, 0, 0, 0);
      }

      const u = i / this.maxTrailPoints;
      uvAttr.setXY(idx, u, 0);
      uvAttr.setXY(idx + 1, u, 1);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    uvAttr.needsUpdate = true;
  }

  // ===== 5. FLOATING DAMAGE BILLBOARD NUMBERS =====
  initFloatingTextPool() {
    this.maxFloaters = 8;
    this.floatingTexts = [];

    for (let i = 0; i < this.maxFloaters; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      sprite.scale.set(1.6, 0.8, 1.0);
      this.scene.add(sprite);

      this.floatingTexts.push({
        sprite,
        canvas,
        ctx,
        texture,
        active: false,
        pos: new THREE.Vector3(),
        life: 0,
        maxLife: 0.65
      });
    }
  }

  spawnDamageNumber(position, amount, isPlayer = false) {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) {
        ft.active = true;
        ft.life = 0;
        ft.pos.copy(position).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          1.8 + Math.random() * 0.3,
          (Math.random() - 0.5) * 0.4
        ));
        ft.sprite.position.copy(ft.pos);
        ft.sprite.material.opacity = 1.0;
        ft.sprite.visible = true;

        const ctx = ft.ctx;
        ctx.clearRect(0, 0, 128, 64);
        ctx.font = '900 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        const text = `-${Math.round(amount)}`;
        ctx.strokeText(text, 64, 32);
        ctx.fillStyle = isPlayer ? '#ef4444' : '#fbbf24';
        ctx.fillText(text, 64, 32);
        ft.texture.needsUpdate = true;
        break;
      }
    }
  }

  // ===== 6. ENEMY DAMAGE FLASH =====
  flashEnemyHit(enemy) {
    if (!enemy || !enemy.mesh) return;

    enemy.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        if (!child._originalEmissive) {
          child._originalEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0, 0, 0);
          child._originalEmissiveIntensity = child.material.emissiveIntensity || 1;
        }

        if (child.material.emissive) {
          child.material.emissive.setHex(0xff2222);
          child.material.emissiveIntensity = 2.0;

          setTimeout(() => {
            if (child.material && child.material.emissive && child._originalEmissive) {
              child.material.emissive.copy(child._originalEmissive);
              child.material.emissiveIntensity = child._originalEmissiveIntensity;
            }
          }, 140);
        }
      }
    });
  }

  // ===== 7. PLAYER DAMAGE SCREEN FLASH =====
  triggerPlayerDamageFlash() {
    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
      vignette.classList.remove('active');
      vignette.offsetHeight;
      vignette.classList.add('active');
      setTimeout(() => {
        vignette.classList.remove('active');
      }, 350);
    }
  }

  // ===== MAIN TICK & SIMULATION =====
  update(deltaTime) {
    // 1. Update Sparks
    const sparkPos = this.sparkPoints.geometry.attributes.position;
    const sparkCol = this.sparkPoints.geometry.attributes.color;
    let anySparkActive = false;

    for (let i = 0; i < this.sparkParticles.length; i++) {
      const p = this.sparkParticles[i];
      const i3 = i * 3;
      if (p.active) {
        anySparkActive = true;
        p.life += deltaTime;
        if (p.life >= p.maxLife) {
          p.active = false;
          sparkPos.setXYZ(i3, 0, -9999, 0);
        } else {
          p.vel.y -= 14.0 * deltaTime; // gravity
          p.pos.addScaledVector(p.vel, deltaTime);
          sparkPos.setXYZ(i3, p.pos.x, p.pos.y, p.pos.z);

          const fade = 1.0 - (p.life / p.maxLife);
          sparkCol.setXYZ(i3, p.color.r * fade, p.color.g * fade, p.color.b * fade);
        }
      } else {
        sparkPos.setXYZ(i3, 0, -9999, 0);
      }
    }
    if (anySparkActive) {
      sparkPos.needsUpdate = true;
      sparkCol.needsUpdate = true;
    }

    // 2. Update Collect Burst
    const colPos = this.collectPoints.geometry.attributes.position;
    const colCol = this.collectPoints.geometry.attributes.color;
    let anyColActive = false;

    for (let i = 0; i < this.collectParticles.length; i++) {
      const p = this.collectParticles[i];
      const i3 = i * 3;
      if (p.active) {
        anyColActive = true;
        p.life += deltaTime;
        if (p.life >= p.maxLife) {
          p.active = false;
          colPos.setXYZ(i3, 0, -9999, 0);
        } else {
          p.vel.y += 1.5 * deltaTime; // buoyancy float
          p.pos.addScaledVector(p.vel, deltaTime);
          colPos.setXYZ(i3, p.pos.x, p.pos.y, p.pos.z);

          const fade = 1.0 - (p.life / p.maxLife);
          colCol.setXYZ(i3, p.color.r * fade, p.color.g * fade, p.color.b * fade);
        }
      } else {
        colPos.setXYZ(i3, 0, -9999, 0);
      }
    }
    if (anyColActive) {
      colPos.needsUpdate = true;
      colCol.needsUpdate = true;
    }

    // 3. Update Victory Particles
    const vicPos = this.victoryPoints.geometry.attributes.position;
    const vicCol = this.victoryPoints.geometry.attributes.color;
    let anyVicActive = false;

    for (let i = 0; i < this.victoryParticles.length; i++) {
      const p = this.victoryParticles[i];
      const i3 = i * 3;
      if (p.active) {
        anyVicActive = true;
        p.life += deltaTime;
        if (p.life >= p.maxLife) {
          p.active = false;
          vicPos.setXYZ(i3, 0, -9999, 0);
        } else {
          p.vel.y -= 9.8 * deltaTime; // gravity
          p.pos.addScaledVector(p.vel, deltaTime);
          vicPos.setXYZ(i3, p.pos.x, p.pos.y, p.pos.z);

          const fade = 1.0 - (p.life / p.maxLife);
          vicCol.setXYZ(i3, p.color.r * fade, p.color.g * fade, p.color.b * fade);
        }
      } else {
        vicPos.setXYZ(i3, 0, -9999, 0);
      }
    }
    if (anyVicActive) {
      vicPos.needsUpdate = true;
      vicCol.needsUpdate = true;
    }

    // 4. Update Floating Damage Texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (ft.active) {
        ft.life += deltaTime;
        if (ft.life >= ft.maxLife) {
          ft.active = false;
          ft.sprite.visible = false;
        } else {
          ft.pos.y += 1.4 * deltaTime;
          ft.sprite.position.copy(ft.pos);
          ft.sprite.material.opacity = Math.max(0, 1.0 - (ft.life / ft.maxLife));
        }
      }
    }

    // 5. Update Dust Particles
    if (this.dustPoints && this.dustParticles) {
      const dPos = this.dustPoints.geometry.attributes.position;
      const dCol = this.dustPoints.geometry.attributes.color;
      let anyDustActive = false;

      for (let i = 0; i < this.dustParticles.length; i++) {
        const p = this.dustParticles[i];
        const i3 = i * 3;
        if (p.active) {
          anyDustActive = true;
          p.life += deltaTime;
          if (p.life >= p.maxLife) {
            p.active = false;
            dPos.setXYZ(i3, 0, -9999, 0);
          } else {
            p.pos.addScaledVector(p.vel, deltaTime);
            p.vel.y -= 2.0 * deltaTime;
            dPos.setXYZ(i3, p.pos.x, p.pos.y, p.pos.z);
            const fade = 1.0 - (p.life / p.maxLife);
            dCol.setXYZ(i3, p.color.r * fade, p.color.g * fade, p.color.b * fade);
          }
        } else {
          dPos.setXYZ(i3, 0, -9999, 0);
        }
      }

      if (anyDustActive) {
        dPos.needsUpdate = true;
        dCol.needsUpdate = true;
      }
    }
  }

  clear() {
    this.sparkParticles.forEach(p => p.active = false);
    this.collectParticles.forEach(p => p.active = false);
    this.victoryParticles.forEach(p => p.active = false);
    if (this.dustParticles) this.dustParticles.forEach(p => p.active = false);
    this.floatingTexts.forEach(ft => {
      ft.active = false;
      ft.sprite.visible = false;
    });
    this.trailHistory = [];
    if (this.trailMat) this.trailMat.opacity = 0;
  }

  dispose() {
    this.clear();
    if (this.sparkPoints) {
      this.scene.remove(this.sparkPoints);
      this.sparkPoints.geometry.dispose();
      this.sparkPoints.material.dispose();
    }
    if (this.collectPoints) {
      this.scene.remove(this.collectPoints);
      this.collectPoints.geometry.dispose();
      this.collectPoints.material.dispose();
    }
    if (this.victoryPoints) {
      this.scene.remove(this.victoryPoints);
      this.victoryPoints.geometry.dispose();
      this.victoryPoints.material.dispose();
    }
    if (this.dustPoints) {
      this.scene.remove(this.dustPoints);
      this.dustPoints.geometry.dispose();
      this.dustPoints.material.dispose();
    }
    if (this.swordTrailMesh) {
      this.scene.remove(this.swordTrailMesh);
      this.swordTrailMesh.geometry.dispose();
      this.swordTrailMesh.material.dispose();
    }
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      this.scene.remove(ft.sprite);
      ft.sprite.material.dispose();
      ft.texture.dispose();
    }
    this.floatingTexts = [];
  }
}
