import * as THREE from 'three';

/**
 * Gasha (ጋሻ) — Traditional Ethiopian Warrior Shield
 * Features a circular conical hide curvature, concentric embossed brass rings,
 * raised central boss (ኩበት - Kubet), and ornate brass filigree studs.
 */
export class Shield {
  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'gasha-shield';
    this.buildShield();
  }

  buildShield() {
    // Materials
    const hideMat = new THREE.MeshStandardMaterial({
      color: 0x2a1810, // Dark hardened ox-hide
      roughness: 0.65,
      metalness: 0.15,
      flatShading: false
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Royal Ethiopian gold/brass
      metalness: 0.88,
      roughness: 0.28
    });

    const crimsonTrimMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // Deep crimson velvet underlay
      roughness: 0.75,
      metalness: 0.2
    });

    const emeraldGemMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.6
    });

    // 1. Conical Shield Dome (Main Body)
    const domeGeo = new THREE.ConeGeometry(0.36, 0.10, 32, 1, true);
    domeGeo.rotateX(-Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, hideMat);
    dome.castShadow = true;
    dome.receiveShadow = true;
    this.mesh.add(dome);

    // 2. Outer Rim (Embossed Brass Ring)
    const rimGeo = new THREE.TorusGeometry(0.36, 0.018, 12, 36);
    const rim = new THREE.Mesh(rimGeo, brassMat);
    rim.castShadow = true;
    this.mesh.add(rim);

    // Inner Crimson Accent Ring
    const innerRimGeo = new THREE.TorusGeometry(0.33, 0.012, 10, 36);
    const innerRim = new THREE.Mesh(innerRimGeo, crimsonTrimMat);
    innerRim.position.z = 0.01;
    this.mesh.add(innerRim);

    // 3. Mid Concentric Brass Ring
    const midRingGeo = new THREE.TorusGeometry(0.22, 0.014, 10, 32);
    const midRing = new THREE.Mesh(midRingGeo, brassMat);
    midRing.position.z = 0.038;
    this.mesh.add(midRing);

    // 4. Central Raised Boss / Spiked Umbo (ኩበት - Kubet)
    const bossGeo = new THREE.ConeGeometry(0.09, 0.12, 20);
    bossGeo.rotateX(Math.PI / 2);
    const boss = new THREE.Mesh(bossGeo, brassMat);
    boss.position.z = 0.11;
    boss.castShadow = true;
    this.mesh.add(boss);

    // Central Emerald Focus Gem atop the boss
    const gemGeo = new THREE.SphereGeometry(0.022, 10, 10);
    const gem = new THREE.Mesh(gemGeo, emeraldGemMat);
    gem.position.z = 0.17;
    this.mesh.add(gem);

    // 5. Four Radiating Ethiopian Cross / Filigree Straps
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const strapGeo = new THREE.BoxGeometry(0.024, 0.28, 0.012);
      const strap = new THREE.Mesh(strapGeo, brassMat);
      strap.position.set(
        Math.cos(angle) * 0.18,
        Math.sin(angle) * 0.18,
        0.035
      );
      strap.rotation.z = angle + Math.PI / 2;
      strap.castShadow = true;
      this.mesh.add(strap);
    }

    // 6. Brass Studs Around the Rim
    const studCount = 12;
    for (let s = 0; s < studCount; s++) {
      const theta = (s / studCount) * Math.PI * 2;
      const studGeo = new THREE.SphereGeometry(0.014, 8, 8);
      const stud = new THREE.Mesh(studGeo, brassMat);
      stud.position.set(
        Math.cos(theta) * 0.35,
        Math.sin(theta) * 0.35,
        0.01
      );
      this.mesh.add(stud);
    }

    // Shield scale and default orientation for forearm mounting
    this.mesh.scale.set(1.0, 1.0, 1.0);
  }

  attachToArm(bone) {
    if (!bone) return;
    this.mesh.position.set(0.12, 0.02, 0.04);
    this.mesh.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    bone.add(this.mesh);
  }
}
