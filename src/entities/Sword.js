import * as THREE from 'three';

/**
 * Shotel (ሾተል) — Traditional Ethiopian Curved Sword
 * The iconic sickle-shaped curved steel sword of ancient Ethiopian warriors,
 * engineered with an inward arc to hook past adversary shields.
 */
export class Sword {
  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'ethiopian-shotel';
    this.buildSword();
  }

  buildSword() {
    // Materials
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.15,
      flatShading: false
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Axumite Gold / Brass
      metalness: 0.88,
      roughness: 0.28
    });

    const rhinocHornHiltMat = new THREE.MeshStandardMaterial({
      color: 0x3b1e08, // Dark polished horn/wood
      roughness: 0.65,
      metalness: 0.15
    });

    const emeraldGemMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.6
    });

    // 1. Iconic Curved Ethiopian Shotel Blade
    const points = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Sweeping forward crescent arc
      const y = t * 1.05;
      const x = Math.sin(t * Math.PI * 0.85) * 0.24;
      points.push(new THREE.Vector3(x, y, 0));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const bladeGeo = new THREE.TubeGeometry(curve, 36, 0.034, 6, false);
    
    // Flatten tube into a razor double-edged profile and taper the tip
    const bPos = bladeGeo.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      const y = bPos.getY(i);
      const z = bPos.getZ(i);
      const taper = y > 0.85 ? Math.max(0.1, 1 - (y - 0.85) / 0.2) : 1.0;
      bPos.setZ(i, z * 0.3 * taper);
      bPos.setX(i, bPos.getX(i) * (y > 0.85 ? taper : 1.0));
    }
    bladeGeo.computeVertexNormals();

    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.08;
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.mesh.add(blade);

    // Central Fuller Line
    const fullerCurve = new THREE.CatmullRomCurve3(points.slice(0, 18));
    const fullerGeo = new THREE.TubeGeometry(fullerCurve, 24, 0.012, 4, false);
    const fullerMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.35
    });
    const fuller = new THREE.Mesh(fullerGeo, fullerMat);
    fuller.position.y = 0.08;
    this.mesh.add(fuller);

    // 2. Traditional Disc Guard (Flared horn/brass cup)
    const guardGeo = new THREE.CylinderGeometry(0.085, 0.065, 0.035, 18);
    const guard = new THREE.Mesh(guardGeo, brassMat);
    guard.position.y = 0.07;
    guard.castShadow = true;
    this.mesh.add(guard);

    // Guard Accent Gem (Emerald)
    const gemGeo = new THREE.SphereGeometry(0.02, 10, 10);
    const gem = new THREE.Mesh(gemGeo, emeraldGemMat);
    gem.position.set(0, 0.07, 0.07);
    this.mesh.add(gem);

    // 3. Grip / Hilt (Carved Horn Waisted Grip)
    const hiltGeo = new THREE.CylinderGeometry(0.028, 0.032, 0.22, 12);
    const hilt = new THREE.Mesh(hiltGeo, rhinocHornHiltMat);
    hilt.position.y = -0.06;
    hilt.castShadow = true;
    this.mesh.add(hilt);

    // Brass Filigree Rings on Grip
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(0.031, 0.005, 8, 16);
      const ring = new THREE.Mesh(ringGeo, brassMat);
      ring.position.y = -0.12 + r * 0.06;
      ring.rotation.x = Math.PI / 2;
      this.mesh.add(ring);
    }

    // 4. Conical / Disc Brass Pommel
    const pommelGeo = new THREE.CylinderGeometry(0.075, 0.045, 0.05, 18);
    const pommel = new THREE.Mesh(pommelGeo, brassMat);
    pommel.position.y = -0.19;
    pommel.castShadow = true;
    this.mesh.add(pommel);

    // Initial Shotel Scale
    this.mesh.scale.set(1.15, 1.15, 1.15);
    this.mesh.add(pommel);

    // Initial sword scale
    this.mesh.scale.set(1.15, 1.15, 1.15);

    // Tip and base markers for weapon trails and hit sparks
    this.tipMarker = new THREE.Object3D();
    this.tipMarker.position.set(0, 1.05, 0);
    this.mesh.add(this.tipMarker);

    this.baseMarker = new THREE.Object3D();
    this.baseMarker.position.set(0, 0.12, 0);
    this.mesh.add(this.baseMarker);
  }

  getTipWorldPosition(targetVec = new THREE.Vector3()) {
    return this.tipMarker.getWorldPosition(targetVec);
  }

  getBaseWorldPosition(targetVec = new THREE.Vector3()) {
    return this.baseMarker.getWorldPosition(targetVec);
  }

  /**
   * Attaches the sword to a character's hand bone with ergonomic grip offset.
   */
  attachToHand(handBone) {
    if (!handBone) {
      console.warn('Sword attachment failed: target hand bone is null.');
      return false;
    }

    // Orient blade extending forward from grip
    this.mesh.position.set(0.04, 0.08, 0.02);
    this.mesh.rotation.set(Math.PI / 2, 0, -Math.PI / 2);

    handBone.add(this.mesh);
    return true;
  }

  getMesh() {
    return this.mesh;
  }
}
