import * as THREE from 'three';

/**
 * Detailed 3D Adventurer Sword model attached to character's hand bone.
 */
export class Sword {
  constructor() {
    this.mesh = new THREE.Group();
    this.buildSword();
  }

  buildSword() {
    // Materials
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xecf0f1,
      metalness: 0.95,
      roughness: 0.18,
      flatShading: false
    });

    const guardMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Bronze / Gold
      metalness: 0.85,
      roughness: 0.3
    });

    const hiltMat = new THREE.MeshStandardMaterial({
      color: 0x451a03, // Dark leather wrap
      roughness: 0.85,
      metalness: 0.1
    });

    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.6
    });

    // 1. Blade: Double-edged steel blade
    const bladeGeo = new THREE.BoxGeometry(0.08, 0.95, 0.025);
    // Bevel the tip slightly
    const pos = bladeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0.4) {
        const factor = 1 - (y - 0.4) / 0.1;
        pos.setX(i, pos.getX(i) * Math.max(0.1, factor));
      }
    }
    bladeGeo.computeVertexNormals();

    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.55;
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.mesh.add(blade);

    // Fuller (center groove along blade)
    const fullerGeo = new THREE.BoxGeometry(0.02, 0.7, 0.028);
    const fullerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.4
    });
    const fuller = new THREE.Mesh(fullerGeo, fullerMat);
    fuller.position.y = 0.5;
    this.mesh.add(fuller);

    // 2. Crossguard
    const guardGeo = new THREE.BoxGeometry(0.32, 0.05, 0.06);
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0.06;
    guard.castShadow = true;
    this.mesh.add(guard);

    // Guard gem focus
    const gemGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 0.06, 0.035);
    this.mesh.add(gem);

    // 3. Grip / Hilt
    const hiltGeo = new THREE.CylinderGeometry(0.024, 0.026, 0.22, 10);
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.y = -0.07;
    hilt.castShadow = true;
    this.mesh.add(hilt);

    // 4. Pommel
    const pommelGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const pommel = new THREE.Mesh(pommelGeo, guardMat);
    pommel.position.y = -0.19;
    pommel.castShadow = true;
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
