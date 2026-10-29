import * as THREE from 'three';

/**
 * Creates authentic Ethiopian Warrior attire, accessories, and textures:
 * - Traditional white cotton Shamma / Tibeb Warrior Kaba (የጥበብ ካባ)
 * - Axumite Gold Medallion Browplate (የአክሱም ዘውድ)
 * - Traditional Leather Talisman Scroll Necklace (ክታብ • Kitab)
 * - Embroidered Wrist Cuffs (የእጅ አንጓ ጥበብ)
 * - Canvas-generated Ethiopian highland skin tone & Tibeb tunic texture
 */
export class EthiopianWarriorGear {
  /**
   * Generates an authentic Ethiopian warrior diffuse texture from the base model texture.
   * Transforms military fatigues into white Ethiopian woven cotton (Shemma / Netela)
   * with vibrant green-gold-crimson Tibeb geometric borders and Axumite crosses,
   * while giving exposed skin areas a warm Ethiopian highland bronze melanin complexion.
   */
  static createWarriorTexture(baseTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (baseTexture && baseTexture.image) {
      try {
        ctx.drawImage(baseTexture.image, 0, 0, 1024, 1024);
      } catch {
        ctx.fillStyle = '#ece5d8';
        ctx.fillRect(0, 0, 1024, 1024);
      }
    } else {
      ctx.fillStyle = '#ece5d8';
      ctx.fillRect(0, 0, 1024, 1024);
    }

    try {
      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const diff = maxC - minC;
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

        // Detect clothing/uniform areas (low saturation or greenish camouflage)
        if (diff < 42 && maxC < 210) {
          // Transform into bright Ethiopian woven white cotton (soft linen #f4f0e6)
          const targetL = 215 + lum * 38;
          d[i] = Math.min(255, Math.floor(targetL * 0.99));
          d[i + 1] = Math.min(255, Math.floor(targetL * 0.96));
          d[i + 2] = Math.min(255, Math.floor(targetL * 0.91));
        } else if (r > g && g > b && diff > 12) {
          // Skin tone: Warm Ethiopian highland bronze melanin complexion
          d[i] = Math.min(255, Math.floor(r * 0.82 + 38));
          d[i + 1] = Math.min(255, Math.floor(g * 0.70 + 22));
          d[i + 2] = Math.min(255, Math.floor(b * 0.62 + 14));
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Fallback if canvas cross-origin prevents pixel manipulation
    }

    // Draw traditional Ethiopian Tibeb (ጥበብ) embroidery bands
    ctx.save();
    const drawTibebBand = (y, h) => {
      const segH = Math.floor(h / 3);
      ctx.fillStyle = '#15803d'; // Emerald green
      ctx.fillRect(0, y, 1024, segH);
      ctx.fillStyle = '#eab308'; // Axumite gold
      ctx.fillRect(0, y + segH, 1024, segH);
      ctx.fillStyle = '#b91c1c'; // Crimson red
      ctx.fillRect(0, y + segH * 2, 1024, segH);
    };

    drawTibebBand(310, 18);
    drawTibebBand(475, 24);
    drawTibebBand(815, 20);

    // Traditional Ethiopian Cross (መስቀል) embroidery medallions
    const drawCross = (cx, cy, size) => {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(cx - size * 0.18, cy - size, size * 0.36, size * 2);
      ctx.fillRect(cx - size, cy - size * 0.18, size * 2, size * 0.36);

      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.5);
      ctx.lineTo(cx + size * 0.5, cy);
      ctx.lineTo(cx, cy + size * 0.5);
      ctx.lineTo(cx - size * 0.5, cy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    };

    drawCross(256, 355, 20);
    drawCross(512, 355, 24);
    drawCross(768, 355, 20);

    ctx.restore();

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.flipY = false;
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    return canvasTexture;
  }

  /**
   * Constructs the traditional draped Ethiopian Warrior Shamma / Cape (የጥበብ ካባ)
   * with flowing folds, white woven cloth, and authentic green-gold-red Tibeb borders.
   */
  static buildTibebKaba() {
    const kabaGroup = new THREE.Group();
    kabaGroup.name = 'ethiopian-kaba';

    // Materials
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0xf3eee3, // Natural Ethiopian raw cotton
      roughness: 0.88,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.6 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });

    // 1. Flowing Back Mantle
    const capeGeo = new THREE.PlaneGeometry(0.72, 1.25, 6, 8);
    // Subtle natural curvature and drape
    const pos = capeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const factor = (0.625 - y) / 1.25;
      const zCurv = Math.sin(pos.getX(i) * 4.0) * 0.04 - factor * 0.12;
      pos.setZ(i, zCurv);
    }
    capeGeo.computeVertexNormals();

    const capeMesh = new THREE.Mesh(capeGeo, clothMat);
    capeMesh.position.set(0, -0.62, -0.16);
    capeMesh.castShadow = true;
    capeMesh.receiveShadow = true;
    kabaGroup.add(capeMesh);

    // 2. Tibeb Embroidery Hem Trim at the bottom of the cape
    const hemTrimGroup = new THREE.Group();
    hemTrimGroup.position.set(0, -1.22, -0.26);

    const stripeG = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.012), greenMat);
    stripeG.position.y = 0.04;
    hemTrimGroup.add(stripeG);

    const stripeY = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.012), goldMat);
    stripeY.position.y = 0.02;
    hemTrimGroup.add(stripeY);

    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.012), redMat);
    stripeR.position.y = 0.0;
    hemTrimGroup.add(stripeR);

    kabaGroup.add(hemTrimGroup);

    // 3. Embroidered Cross on Center Back of Kaba
    const crossGroup = new THREE.Group();
    crossGroup.position.set(0, -0.5, -0.22);
    const cV = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.01), goldMat);
    const cH = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.01), goldMat);
    const cDiamond = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.02, 4), redMat);
    cDiamond.rotation.x = Math.PI / 2;
    crossGroup.add(cV);
    crossGroup.add(cH);
    crossGroup.add(cDiamond);
    kabaGroup.add(crossGroup);

    // 4. Shoulder Cowl Drape (wrap over left shoulder)
    const cowlGeo = new THREE.CylinderGeometry(0.26, 0.32, 0.16, 8, 1, true);
    cowlGeo.rotateZ(0.25);
    const cowlMesh = new THREE.Mesh(cowlGeo, clothMat);
    cowlMesh.position.set(-0.12, 0.02, -0.05);
    cowlMesh.castShadow = true;
    kabaGroup.add(cowlMesh);

    // Gold Cloak Brooch / Clasp (Meskel Clasp)
    const clasp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 8), goldMat);
    clasp.rotation.x = Math.PI / 2;
    clasp.position.set(-0.08, 0.06, 0.14);
    clasp.castShadow = true;
    kabaGroup.add(clasp);

    return kabaGroup;
  }

  /**
   * Constructs the Axumite Warrior Browband / Headband with central solar disc
   * mounted directly to the head bone.
   */
  static buildWarriorHeadband() {
    const headGroup = new THREE.Group();
    headGroup.name = 'ethiopian-headband';

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.6,
      metalness: 0.2
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });

    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8
    });

    // Circlet band around head
    const bandGeo = new THREE.CylinderGeometry(0.145, 0.145, 0.04, 16, 1, true);
    const band = new THREE.Mesh(bandGeo, leatherMat);
    band.position.set(0, 0.07, 0.02);
    headGroup.add(band);

    // Axumite Gold Solar Disc Medallion at center brow
    const discGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.012, 12);
    discGeo.rotateX(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, goldMat);
    disc.position.set(0, 0.07, 0.165);
    disc.castShadow = true;
    headGroup.add(disc);

    // Center Emerald / Opal Gem
    const gemGeo = new THREE.OctahedronGeometry(0.016, 0);
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 0.07, 0.174);
    headGroup.add(gem);

    return headGroup;
  }

  /**
   * Constructs traditional Ethiopian protective leather talisman scroll necklace (ክታብ • Kitab)
   */
  static buildKitabAmulet() {
    const kitabGroup = new THREE.Group();
    kitabGroup.name = 'ethiopian-kitab';

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x452311,
      roughness: 0.55,
      metalness: 0.2
    });
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.9 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.3 });

    // Leather scroll pendant pouch
    const pouchGeo = new THREE.BoxGeometry(0.07, 0.05, 0.022);
    const pouch = new THREE.Mesh(pouchGeo, leatherMat);
    pouch.position.set(0, -0.16, 0.155);
    pouch.castShadow = true;
    kitabGroup.add(pouch);

    // Silver ornamental band around scroll
    const sBand = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.015, 0.025), silverMat);
    sBand.position.set(0, -0.16, 0.155);
    kitabGroup.add(sBand);

    // Braided cord around neck
    const cordGeo = new THREE.TorusGeometry(0.12, 0.007, 6, 16);
    cordGeo.rotateX(Math.PI / 2.3);
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.set(0, -0.06, 0.08);
    kitabGroup.add(cord);

    return kitabGroup;
  }
}
