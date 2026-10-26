import * as THREE from 'three';

export class Collectible {
  constructor(id, type, x, y, z, options = {}) {
    this.id = id;
    this.type = type;
    this.baseX = x;
    this.baseY = y;
    this.baseZ = z;

    this.collectionRadius = options.collectionRadius || 1.6;
    this.value = options.value || 1;
    this.name = options.name || 'Collectible';

    this.isCollected = false;
    this.isDisposed = false;

    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, z);

    this.animTime = Math.random() * Math.PI * 2;
  }

  getPosition() {
    return this.mesh.position;
  }

  collect() {
    if (this.isCollected) return false;
    this.isCollected = true;
    this.onCollected();
    return true;
  }

  onCollected() {
    // Override in subclass for custom visual/audio feedback
  }

  update(deltaTime) {
    // Override in subclass for floating/rotation
  }

  dispose() {
    this.isDisposed = true;
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}

export class CrystalCollectible extends Collectible {
  constructor(id, x, y, z, options = {}) {
    super(id, 'crystal', x, y, z, {
      collectionRadius: 1.8,
      name: 'Shadow Crystal',
      value: 1,
      ...options
    });

    this.buildCrystalMesh();
    this.initParticles();
    this.collectingAnimTime = 0;
    this.collectAnimDuration = 0.6;
  }

  buildCrystalMesh() {
    // Materials
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });

    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x7dd3fc,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.95
    });

    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      wireframe: false
    });

    // 1. Outer Diamond / Double-Pyramid Crystal
    const outerGeo = new THREE.OctahedronGeometry(0.55, 0);
    // Elongate along vertical Y axis
    outerGeo.scale(0.85, 1.45, 0.85);

    this.crystalMesh = new THREE.Mesh(outerGeo, crystalMat);
    this.crystalMesh.castShadow = true;
    this.mesh.add(this.crystalMesh);

    // 2. Inner Glowing Core
    const innerGeo = new THREE.OctahedronGeometry(0.28, 0);
    innerGeo.scale(0.7, 1.2, 0.7);
    this.innerMesh = new THREE.Mesh(innerGeo, innerMat);
    this.mesh.add(this.innerMesh);

    // 3. Orbiting Celestial Ring
    const haloGeo = new THREE.TorusGeometry(0.75, 0.022, 8, 32);
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloMesh.rotation.x = Math.PI / 3;
    this.mesh.add(this.haloMesh);

    // 4. Second Intersecting Ring
    const halo2Geo = new THREE.TorusGeometry(0.68, 0.018, 8, 32);
    this.halo2Mesh = new THREE.Mesh(halo2Geo, haloMat);
    this.halo2Mesh.rotation.z = Math.PI / 4;
    this.mesh.add(this.halo2Mesh);

    // 5. Pulsing Ambient Crystal Light
    this.pointLight = new THREE.PointLight(0x38bdf8, 2.2, 8.0, 1.8);
    this.mesh.add(this.pointLight);
  }

  initParticles() {
    this.particleCount = 28;
    this.particleGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particleCount * 3);
    this.particleVelocities = [];

    for (let i = 0; i < this.particleCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      // Random spherical velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 2.0 + Math.random() * 3.5;

      this.particleVelocities.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      ));
    }

    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    this.particleMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.16,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(this.particleGeo, this.particleMat);
    this.mesh.add(this.particles);
  }

  onCollected() {
    // Trigger particle burst and light flash
    if (this.particleMat) {
      this.particleMat.opacity = 1.0;
    }
    if (this.pointLight) {
      this.pointLight.intensity = 4.5;
      this.pointLight.color.setHex(0xe0f2fe);
    }
  }

  update(deltaTime) {
    if (this.isDisposed) return;

    this.animTime += deltaTime;

    if (!this.isCollected) {
      // 1. Smooth floating vertical bobbing
      this.mesh.position.y = this.baseY + Math.sin(this.animTime * 2.4) * 0.18;

      // 2. Crystal spinning & counter-rotating celestial rings
      if (this.crystalMesh) {
        this.crystalMesh.rotation.y += deltaTime * 1.6;
        this.crystalMesh.rotation.z = Math.sin(this.animTime * 1.5) * 0.1;
      }
      if (this.innerMesh) {
        this.innerMesh.rotation.y -= deltaTime * 2.2;
      }
      if (this.haloMesh) {
        this.haloMesh.rotation.z += deltaTime * 1.8;
      }
      if (this.halo2Mesh) {
        this.halo2Mesh.rotation.x += deltaTime * 1.4;
      }

      // 3. Subtle ambient light pulsing
      if (this.pointLight) {
        this.pointLight.intensity = 2.0 + Math.sin(this.animTime * 3.0) * 0.5;
      }

    } else {
      // Collecting animation: Particle burst & core fade-out
      this.collectingAnimTime += deltaTime;
      const progress = Math.min(1.0, this.collectingAnimTime / this.collectAnimDuration);

      // Shrink core crystal
      const scale = Math.max(0, 1.0 - progress * 1.5);
      if (this.crystalMesh) this.crystalMesh.scale.set(scale, scale, scale);
      if (this.innerMesh) this.innerMesh.scale.set(scale, scale, scale);
      if (this.haloMesh) this.haloMesh.scale.set(scale, scale, scale);
      if (this.halo2Mesh) this.halo2Mesh.scale.set(scale, scale, scale);

      // Expand particles
      if (this.particles && this.particleMat) {
        const posAttr = this.particleGeo.attributes.position;
        for (let i = 0; i < this.particleCount; i++) {
          const v = this.particleVelocities[i];
          posAttr.setXYZ(
            i,
            posAttr.getX(i) + v.x * deltaTime,
            posAttr.getY(i) + v.y * deltaTime,
            posAttr.getZ(i) + v.z * deltaTime
          );
        }
        posAttr.needsUpdate = true;
        this.particleMat.opacity = Math.max(0, 1.0 - progress);
      }

      // Dim light
      if (this.pointLight) {
        this.pointLight.intensity = Math.max(0, 4.5 * (1.0 - progress));
      }

      // Remove after collect animation finishes
      if (progress >= 1.0) {
        this.dispose();
      }
    }
  }
}
