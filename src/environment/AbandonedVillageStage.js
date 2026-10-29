import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { BoxCollider, CircleCollider } from '../physics/Colliders.js';

/**
 * Level 4 Playable Environment: The Abandoned Village
 * A deserted medieval settlement with ruined timber-framed cottages,
 * the Crowfall Windmill with rotating vanes, the central Sunken Wellhouse,
 * and palisade gate barricades.
 */
export class AbandonedVillageStage {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();
    this.colliders = [];

    this.windmillSails = null;

    this.initMaterials();
    this.buildTerrain();
    this.buildFasilidesCastle();
    this.buildEthiopianBazaarAndCoffeeCeremony();
    this.buildAzmariMusicStation();
    this.buildCityWallsAndArchedGates();
    this.buildCottages();
    this.buildBetGiyorgisShrine();
    this.buildCrowfallWindmill();
    this.buildVillageWellhouse();
    this.buildSecretElderLockbox();
    this.buildPassagePortals();

    this.scene.add(this.group);
  }

  initMaterials() {
    this.stoneTex = TextureGenerator.createStoneTexture(512);
    this.woodTex = TextureGenerator.createWoodTexture(512);

    this.cobbleMat = new THREE.MeshStandardMaterial({
      map: this.stoneTex,
      roughness: 0.85,
      metalness: 0.15
    });

    this.tuffMat = new THREE.MeshStandardMaterial({
      color: 0x8b4538, // Warm reddish-brown volcanic tuff stone of Lalibela
      roughness: 0.92,
      metalness: 0.08
    });

    this.timberMat = new THREE.MeshStandardMaterial({
      map: this.woodTex,
      roughness: 0.8,
      metalness: 0.1
    });

    this.thatchMat = new THREE.MeshStandardMaterial({
      color: 0x473c2b,
      roughness: 0.95,
      metalness: 0.05
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });

    this.clayMat = new THREE.MeshStandardMaterial({
      color: 0x221814, // Traditional blackened pottery clay of Ethiopian Jebena
      roughness: 0.8,
      metalness: 0.1
    });

    this.qetemaMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a, // Fresh aromatic green grass carpet (ቀጤማ)
      roughness: 0.85,
      metalness: 0.05
    });

    this.berbereMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Vibrant red Ethiopian Berbere spice
      roughness: 0.95
    });

    this.parchmentMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7, // Goatskin parchment resonator of Masenqo
      roughness: 0.85
    });

    this.lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 2.0,
      roughness: 0.2
    });

    this.runeGateMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.0,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85
    });
  }

  buildTerrain() {
    const geo = new THREE.PlaneGeometry(160, 160, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.hypot(x, z);

      // Village sits in a shallow bowl nestled between gentle ridges
      let y = (Math.sin(x * 0.06) + Math.cos(z * 0.06)) * 0.8;
      if (dist > 44) {
        y += Math.pow((dist - 44) / 22, 1.8) * 12.0;
      }
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    this.groundMesh = new THREE.Mesh(geo, this.cobbleMat);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    this.terrain = {
      getTerrainHeight: (x, z) => {
        let y = (Math.sin(x * 0.06) + Math.cos(z * 0.06)) * 0.8;
        const dist = Math.hypot(x, z);
        if (dist > 44) {
          y += Math.pow((dist - 44) / 22, 1.8) * 12.0;
        }
        return y;
      }
    };

    if (this.physicsWorld) {
      this.physicsWorld.setTerrain(this.terrain);
    }
  }

  /**
   * The Imperial Stone Castle of Emperor Fasilides (የፋሲል ግንብ)
   * The famed 17th-century royal castle of Gondar with 4 corner towers, domed caps, and battlements.
   */
  buildFasilidesCastle() {
    const castleGroup = new THREE.Group();
    castleGroup.position.set(16, 0, 16);

    // 1. Central 2-Story Rectangular Stone Keep
    const keepW = 13.5;
    const keepD = 10.5;
    const keepH = 8.5;
    const keepGeo = new THREE.BoxGeometry(keepW, keepH, keepD);
    const keepMesh = new THREE.Mesh(keepGeo, this.cobbleMat);
    keepMesh.position.y = keepH / 2;
    keepMesh.castShadow = true;
    keepMesh.receiveShadow = true;
    castleGroup.add(keepMesh);

    // 2. Four Cylindrical Corner Towers with Domed Caps (iconic Gondar architecture)
    const towerR = 1.7;
    const towerH = 10.8;
    const cornerOffsets = [
      { x: -keepW / 2, z: -keepD / 2 },
      { x: keepW / 2, z: -keepD / 2 },
      { x: -keepW / 2, z: keepD / 2 },
      { x: keepW / 2, z: keepD / 2 }
    ];

    cornerOffsets.forEach(pos => {
      // Tower shaft
      const towerGeo = new THREE.CylinderGeometry(towerR, towerR * 1.08, towerH, 16);
      const tower = new THREE.Mesh(towerGeo, this.cobbleMat);
      tower.position.set(pos.x, towerH / 2, pos.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      castleGroup.add(tower);

      // Egg-shaped Gondarine stone dome cap
      const domeGeo = new THREE.SphereGeometry(towerR * 1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, this.cobbleMat);
      dome.position.set(pos.x, towerH, pos.z);
      dome.castShadow = true;
      castleGroup.add(dome);

      // Golden Ethiopian Cross finial at tower apex (የጉልላት መስቀል)
      const crossFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), this.goldMat);
      crossFinial.position.set(pos.x, towerH + towerR + 0.25, pos.z);
      castleGroup.add(crossFinial);
      const crossCross = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.06), this.goldMat);
      crossCross.position.set(pos.x, towerH + towerR + 0.35, pos.z);
      castleGroup.add(crossCross);

      if (this.physicsWorld) {
        const cCol = new CircleCollider(16 + pos.x, 16 + pos.z, towerR + 0.3);
        this.physicsWorld.addCollider(cCol);
        this.colliders.push(cCol);
      }
    });

    // 3. Crenelated Parapet along castle roof (የግንብ አናት ዙፋን)
    const parapetGeo = new THREE.BoxGeometry(keepW + 0.4, 0.7, keepD + 0.4);
    const parapet = new THREE.Mesh(parapetGeo, this.cobbleMat);
    parapet.position.y = keepH + 0.35;
    castleGroup.add(parapet);

    // 4. Ras Balcony on the front facade
    const balconyGeo = new THREE.BoxGeometry(3.6, 0.25, 1.4);
    const balcony = new THREE.Mesh(balconyGeo, this.timberMat);
    balcony.position.set(0, 5.2, -keepD / 2 - 0.7);
    balcony.castShadow = true;
    castleGroup.add(balcony);

    // Arched Main Entrance Gate
    const doorGeo = new THREE.BoxGeometry(2.4, 3.4, 0.4);
    const door = new THREE.Mesh(doorGeo, this.timberMat);
    door.position.set(0, 1.7, -keepD / 2 - 0.1);
    castleGroup.add(door);

    this.group.add(castleGroup);

    if (this.physicsWorld) {
      const bCol = new BoxCollider(16, 16, keepW / 2 + 0.4, keepD / 2 + 0.4);
      this.physicsWorld.addCollider(bCol);
      this.colliders.push(bCol);
    }
  }

  /**
   * Traditional Ethiopian Bazaar (ገበያ) and Authentic Coffee Ceremony (የቡና ሥነ-ሥርዓት)
   * Featuring Qetema fresh green carpet grass, clay Jebena coffee pots, Rekebot table,
   * smoking frankincense burner (Itan), and colorful woven Mesob wicker tables.
   */
  buildEthiopianBazaarAndCoffeeCeremony() {
    const bazaarGroup = new THREE.Group();
    bazaarGroup.position.set(6, 0, -8);

    // --- A. THE TRADITIONAL COFFEE CEREMONY CORNER ---
    // 1. Fresh green grass carpet strewn on the ground (ቀጤማ • Qetema)
    const qetemaGeo = new THREE.CylinderGeometry(2.5, 2.7, 0.04, 16);
    const qetema = new THREE.Mesh(qetemaGeo, this.qetemaMat);
    qetema.position.set(0, 0.02, 0);
    qetema.receiveShadow = true;
    bazaarGroup.add(qetema);

    // 2. Low wooden coffee table (ረከቦት • Rekebot)
    const rekebotGeo = new THREE.BoxGeometry(1.6, 0.32, 0.9);
    const rekebot = new THREE.Mesh(rekebotGeo, this.timberMat);
    rekebot.position.set(0, 0.18, 0);
    rekebot.castShadow = true;
    bazaarGroup.add(rekebot);

    // Six miniature white porcelain coffee cups (ሲኒ • Cini)
    const ciniMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const cini = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.06, 8), ciniMat);
        cini.position.set(-0.35 + col * 0.35, 0.37, -0.15 + row * 0.3);
        bazaarGroup.add(cini);
      }
    }

    // 3. Authentic Black Clay Coffee Pot (ጀበና • Jebena)
    const jebenaGroup = new THREE.Group();
    jebenaGroup.position.set(0.6, 0.06, 0.4);

    // Spherical clay pot body
    const jebenaBody = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), this.clayMat);
    jebenaBody.position.y = 0.24;
    jebenaBody.castShadow = true;
    jebenaGroup.add(jebenaBody);

    // Tall slender neck
    const jebenaNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.38, 10), this.clayMat);
    jebenaNeck.position.y = 0.55;
    jebenaGroup.add(jebenaNeck);

    // Pouring spout
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 8), this.clayMat);
    spout.position.set(0.16, 0.34, 0);
    spout.rotation.z = -Math.PI / 4;
    jebenaGroup.add(spout);

    // Curved handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 12, Math.PI), this.clayMat);
    handle.position.set(-0.16, 0.38, 0);
    handle.rotation.z = Math.PI / 2;
    jebenaGroup.add(handle);

    // Straw ring stand (ማተርጎሻ • Matargosha)
    const stand = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 12), this.thatchMat);
    stand.rotation.x = Math.PI / 2;
    stand.position.y = 0.04;
    jebenaGroup.add(stand);

    bazaarGroup.add(jebenaGroup);

    // 4. Traditional Frankincense Incense Burner (ዕጣን ማቡኸር • Mabukhar)
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.24, 8), this.clayMat);
    burner.position.set(-0.7, 0.12, 0.4);
    bazaarGroup.add(burner);

    // Glowing incense embers with subtle flickering pointlight
    const emberLight = new THREE.PointLight(0xf59e0b, 1.5, 4.0);
    emberLight.position.set(-0.7, 0.3, 0.4);
    bazaarGroup.add(emberLight);

    // --- B. TRADITIONAL WOVEN MESOB TABLES (መሶብ) ---
    const mesobColors = [0x15803d, 0xeab308, 0xb91c1c];
    [-3.2, 3.2].forEach((xSide) => {
      const mesobGroup = new THREE.Group();
      mesobGroup.position.set(xSide, 0, -1.2);

      // Conical base of Mesob
      const baseGeo = new THREE.CylinderGeometry(0.65, 0.45, 0.75, 12);
      const baseMesh = new THREE.Mesh(baseGeo, this.thatchMat);
      baseMesh.position.y = 0.38;
      baseMesh.castShadow = true;
      mesobGroup.add(baseMesh);

      // Colorful woven decorative rings (Tricolor diamond embroidery)
      mesobColors.forEach((col, ringIdx) => {
        const ringMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 4, 12), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.2 + ringIdx * 0.16;
        mesobGroup.add(ring);
      });

      // Pointed conical lid of Mesob
      const lidGeo = new THREE.ConeGeometry(0.72, 0.85, 12);
      const lidMesh = new THREE.Mesh(lidGeo, this.thatchMat);
      lidMesh.position.y = 1.15;
      lidMesh.castShadow = true;
      mesobGroup.add(lidMesh);

      // Top handle finial
      const topKnob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), this.goldMat);
      topKnob.position.y = 1.62;
      mesobGroup.add(topKnob);

      bazaarGroup.add(mesobGroup);
    });

    // --- C. SPICE SACKS (የበርበሬና ቅመማቅመም ከረጢት) ---
    const spiceBags = [
      { x: -1.8, z: 1.2, col: 0xb91c1c, name: 'Berbere' },
      { x: -1.2, z: 1.4, col: 0xf59e0b, name: 'Turmeric' },
      { x: 1.4, z: 1.2, col: 0x3d271d, name: 'Coffee Beans' }
    ];
    spiceBags.forEach(sp => {
      const sackGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.45, 10);
      const sackMesh = new THREE.Mesh(sackGeo, this.timberMat);
      sackMesh.position.set(sp.x, 0.22, sp.z);
      bazaarGroup.add(sackMesh);

      const spiceTopGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 8);
      const spiceMat = new THREE.MeshStandardMaterial({ color: sp.col, roughness: 0.95 });
      const spiceTop = new THREE.Mesh(spiceTopGeo, spiceMat);
      spiceTop.position.set(sp.x, 0.45, sp.z);
      bazaarGroup.add(spiceTop);
    });

    this.group.add(bazaarGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(6, -8, 2.8);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * The Azmari Minstrel Station (የአዝማሪ ቤት)
   * Traditional Ethiopian musical instruments: 3D Masenqo, Krar, and Kebero drum.
   */
  buildAzmariMusicStation() {
    const musicGroup = new THREE.Group();
    musicGroup.position.set(-8, 0, -8);

    // Raised circular wooden carpet dais
    const daisGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.25, 12);
    const dais = new THREE.Mesh(daisGeo, this.timberMat);
    dais.position.y = 0.12;
    dais.receiveShadow = true;
    musicGroup.add(dais);

    // 1. Traditional Ethiopian Single-String Lute (ማሲንቆ • Masenqo)
    const masenqoGroup = new THREE.Group();
    masenqoGroup.position.set(-0.6, 0.25, 0.3);
    masenqoGroup.rotation.y = 0.4;

    // Diamond-shaped resonator box (goatskin parchment)
    const boxGeo = new THREE.BoxGeometry(0.35, 0.35, 0.18);
    boxGeo.rotateZ(Math.PI / 4);
    const boxMesh = new THREE.Mesh(boxGeo, this.parchmentMat);
    boxMesh.position.y = 0.4;
    boxMesh.castShadow = true;
    masenqoGroup.add(boxMesh);

    // Long wooden neck rod
    const neckGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.9, 8);
    const neck = new THREE.Mesh(neckGeo, this.timberMat);
    neck.position.y = 0.85;
    masenqoGroup.add(neck);

    // Tuning peg at top
    const peg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.03), this.timberMat);
    peg.position.y = 1.25;
    masenqoGroup.add(peg);

    // Horsehair bow (መጎተቻ • Bow)
    const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 6), this.timberMat);
    bow.rotation.z = Math.PI / 3;
    bow.position.set(0.2, 0.5, 0.08);
    masenqoGroup.add(bow);

    musicGroup.add(masenqoGroup);

    // 2. Traditional Ethiopian Lyre (ክራር • Krar)
    const krarGroup = new THREE.Group();
    krarGroup.position.set(0.6, 0.25, 0.2);
    krarGroup.rotation.y = -0.3;

    // Oval wooden soundbox
    const soundbox = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.12, 10), this.parchmentMat);
    soundbox.position.y = 0.25;
    soundbox.castShadow = true;
    krarGroup.add(soundbox);

    // Two wooden arms reaching upward
    [-0.2, 0.2].forEach((xSide, i) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.7, 6), this.timberMat);
      arm.position.set(xSide, 0.6, 0);
      arm.rotation.z = (i === 0 ? 1 : -1) * 0.15;
      krarGroup.add(arm);
    });

    // Top horizontal crossbar
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 6), this.timberMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 0.95, 0);
    krarGroup.add(crossbar);

    musicGroup.add(krarGroup);

    // 3. Double-Headed Ceremonial Drum (ከበሮ • Kebero)
    const keberoGeo = new THREE.CylinderGeometry(0.32, 0.42, 0.85, 12);
    const kebero = new THREE.Mesh(keberoGeo, this.parchmentMat);
    kebero.position.set(0, 0.65, -0.6);
    kebero.rotation.z = Math.PI / 6;
    kebero.castShadow = true;
    musicGroup.add(kebero);

    this.group.add(musicGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(-8, -8, 2.5);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * Historic Stone City Walls and Gondarine Arched Gates (የከተማው ቅጥር በር)
   */
  buildCityWallsAndArchedGates() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -32);

    [-4.5, 4.5].forEach(xSide => {
      const gTower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 8.5, 12), this.cobbleMat);
      gTower.position.set(xSide, 4.25, 0);
      gTower.castShadow = true;
      gateGroup.add(gTower);

      const gDome = new THREE.Mesh(new THREE.SphereGeometry(1.65, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.cobbleMat);
      gDome.position.set(xSide, 8.5, 0);
      gateGroup.add(gDome);

      const gCross = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.08), this.goldMat);
      gCross.position.set(xSide, 10.4, 0);
      gateGroup.add(gCross);
    });

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.4, 1.8), this.cobbleMat);
    lintel.position.set(0, 7.8, 0);
    gateGroup.add(lintel);

    [-18, 18].forEach(xWall => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 1.6), this.cobbleMat);
      wall.position.set(xWall, 2.75, 0);
      wall.castShadow = true;
      gateGroup.add(wall);

      if (this.physicsWorld) {
        const col = new BoxCollider(xWall, -32, 8.2, 1.0);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }
    });

    this.group.add(gateGroup);
  }

  buildCottages() {
    // Traditional Ethiopian circular stone Tukuls (ቱኩል) with conical thatched roofs
    const tukulConfigs = [
      { x: -16, z: -15, rotY: 0.2, r: 4.2, h: 4.8, name: 'Weaver’s Tukul (የሸማኔ ቤት)' },
      { x: 16, z: -18, rotY: -0.3, r: 3.8, h: 4.5, name: 'Blacksmith’s Forge (የአንጥረኛ ቤት)' },
      { x: -22, z: 16, rotY: 0.6, r: 4.6, h: 5.2, name: 'Hermitage Sanctuary (የባሕታዊ ማደሪያ)' },
      { x: 18, z: 18, rotY: -0.5, r: 4.0, h: 4.8, name: 'Guest Dwelling (የእንግዳ ማረፊያ)' }
    ];

    const finialMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 });

    tukulConfigs.forEach(c => {
      const tukulGroup = new THREE.Group();
      tukulGroup.position.set(c.x, 0, c.z);
      tukulGroup.rotation.y = c.rotY;

      // Circular stone wall base
      const wallsGeo = new THREE.CylinderGeometry(c.r, c.r * 1.05, c.h, 16);
      const walls = new THREE.Mesh(wallsGeo, this.cobbleMat);
      walls.position.y = c.h / 2;
      walls.castShadow = true;
      walls.receiveShadow = true;
      tukulGroup.add(walls);

      // Traditional conical thatched roof (ሳር ክዳን)
      const roofH = 3.4;
      const roofGeo = new THREE.ConeGeometry(c.r * 1.25, roofH, 16);
      const roof = new THREE.Mesh(roofGeo, this.thatchMat);
      roof.position.y = c.h + roofH / 2;
      roof.castShadow = true;
      tukulGroup.add(roof);

      // Clay / Brass finial at the roof apex (የጣሪያ ማሰሪያ / ጉልላት)
      const finialGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const finial = new THREE.Mesh(finialGeo, finialMat);
      finial.position.y = c.h + roofH + 0.25;
      tukulGroup.add(finial);

      // Carved wooden entrance door
      const doorGeo = new THREE.BoxGeometry(1.4, 2.4, 0.35);
      const door = new THREE.Mesh(doorGeo, this.timberMat);
      door.position.set(0, 1.2, c.r);
      tukulGroup.add(door);

      this.group.add(tukulGroup);

      if (this.physicsWorld) {
        const col = new CircleCollider(c.x, c.z, c.r + 0.4);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }
    });
  }

  /**
   * Monolithic Rock-Hewn Greek Cross Church inspired by Bet Giyorgis (ቤተ ጊዮርጊስ) in Lalibela
   */
  buildBetGiyorgisShrine() {
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(-1.0, 0, -2.0);

    // Carved rock trench platform
    const trenchGeo = new THREE.BoxGeometry(16, 0.4, 16);
    const trench = new THREE.Mesh(trenchGeo, this.cobbleMat);
    trench.position.y = 0.2;
    trench.receiveShadow = true;
    shrineGroup.add(trench);

    // Monolithic Greek Cross Footprint (two intersecting perpendicular stone blocks)
    const armLen = 8.5;
    const armWidth = 3.2;
    const wallHeight = 6.2;

    const arm1Geo = new THREE.BoxGeometry(armLen, wallHeight, armWidth);
    const arm1 = new THREE.Mesh(arm1Geo, this.tuffMat);
    arm1.position.y = wallHeight / 2 + 0.4;
    arm1.castShadow = true;
    arm1.receiveShadow = true;
    shrineGroup.add(arm1);

    const arm2Geo = new THREE.BoxGeometry(armWidth, wallHeight, armLen);
    const arm2 = new THREE.Mesh(arm2Geo, this.tuffMat);
    arm2.position.y = wallHeight / 2 + 0.4;
    arm2.castShadow = true;
    arm2.receiveShadow = true;
    shrineGroup.add(arm2);

    // Flat roof carved with authentic concentric Greek Crosses (symbol of Bet Giyorgis)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x6e352b,
      roughness: 0.95
    });
    const roofArm1 = new THREE.Mesh(new THREE.BoxGeometry(armLen + 0.1, 0.25, armWidth + 0.1), roofMat);
    roofArm1.position.y = wallHeight + 0.52;
    shrineGroup.add(roofArm1);

    const roofArm2 = new THREE.Mesh(new THREE.BoxGeometry(armWidth + 0.1, 0.25, armLen + 0.1), roofMat);
    roofArm2.position.y = wallHeight + 0.52;
    shrineGroup.add(roofArm2);

    // Carved Axumite style ogival arched windows with cross apertures
    const winMat = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.9 });
    [-2.6, 2.6].forEach(xOff => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, armWidth + 0.08), winMat);
      win.position.set(xOff, 3.8, 0);
      shrineGroup.add(win);
    });

    this.group.add(shrineGroup);

    if (this.physicsWorld) {
      const col1 = new BoxCollider(-1.0, -2.0, armLen / 2 + 0.2, armWidth / 2 + 0.2);
      const col2 = new BoxCollider(-1.0, -2.0, armWidth / 2 + 0.2, armLen / 2 + 0.2);
      this.physicsWorld.addCollider(col1);
      this.physicsWorld.addCollider(col2);
      this.colliders.push(col1, col2);
    }
  }

  buildCrowfallWindmill() {
    // Crowfall Windmill at x: 26, z: -2
    const windmillGroup = new THREE.Group();
    windmillGroup.position.set(26, 0, -2);

    // Stone base tower
    const baseGeo = new THREE.CylinderGeometry(3.6, 4.4, 9.0, 10);
    const base = new THREE.Mesh(baseGeo, this.cobbleMat);
    base.position.y = 4.5;
    base.castShadow = true;
    base.receiveShadow = true;
    windmillGroup.add(base);

    // Conical cap roof
    const capGeo = new THREE.ConeGeometry(3.8, 2.8, 10);
    const cap = new THREE.Mesh(capGeo, this.thatchMat);
    cap.position.y = 10.4;
    cap.castShadow = true;
    windmillGroup.add(cap);

    // Rotating Sails Hub
    const sailsGroup = new THREE.Group();
    sailsGroup.position.set(0, 8.5, 3.8);

    const hubGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, this.timberMat);
    sailsGroup.add(hub);

    // 4 sails
    const vaneGeo = new THREE.BoxGeometry(0.5, 7.0, 0.1);
    for (let i = 0; i < 4; i++) {
      const vane = new THREE.Mesh(vaneGeo, this.timberMat);
      vane.rotation.z = (i * Math.PI) / 2;
      vane.castShadow = true;
      sailsGroup.add(vane);
    }

    windmillGroup.add(sailsGroup);
    this.windmillSails = sailsGroup;

    // Lantern hanging on the door
    const lanternGeo = new THREE.DodecahedronGeometry(0.35);
    const lantern = new THREE.Mesh(lanternGeo, this.lanternGlowMat);
    lantern.position.set(0, 2.8, 4.1);
    windmillGroup.add(lantern);

    const lanternLight = new THREE.PointLight(0xf59e0b, 1.2, 12);
    lanternLight.position.set(26, 2.8, 2.3);
    this.group.add(lanternLight);

    this.group.add(windmillGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(26, -2, 4.2);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  buildVillageWellhouse() {
    // Sunken Wellhouse at x: -5, z: 5
    const wellGroup = new THREE.Group();
    wellGroup.position.set(-5, 0, 5);

    // Stone well ring
    const wellGeo = new THREE.CylinderGeometry(1.8, 2.0, 1.2, 12, 1, true);
    const well = new THREE.Mesh(wellGeo, this.cobbleMat);
    well.position.y = 0.6;
    well.castShadow = true;
    wellGroup.add(well);

    // Timber posts & roof canopy
    [-1.6, 1.6].forEach(px => {
      const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.8, 6);
      const post = new THREE.Mesh(postGeo, this.timberMat);
      post.position.set(px, 1.4, 0);
      post.castShadow = true;
      wellGroup.add(post);
    });

    const roofGeo = new THREE.ConeGeometry(2.4, 1.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, this.thatchMat);
    roof.position.y = 3.0;
    roof.castShadow = true;
    wellGroup.add(roof);

    // Well shaft dark interior / secret passage descent indicator
    const discGeo = new THREE.CircleGeometry(1.6, 16);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: 0x047857,
      emissiveIntensity: 1.2
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.3;
    wellGroup.add(disc);

    this.group.add(wellGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(-5, 5, 2.2);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  buildPalisadeBarricades() {
    // Palisade logs along southern approach and borders
    const logGeo = new THREE.CylinderGeometry(0.2, 0.25, 3.2, 6);
    const fenceGroup = new THREE.Group();

    for (let x = -20; x <= 20; x += 1.6) {
      if (Math.abs(x) < 4.0) continue; // Gate opening
      const log = new THREE.Mesh(logGeo, this.timberMat);
      log.position.set(x, 1.6, -38);
      log.rotation.z = (Math.random() - 0.5) * 0.1;
      log.castShadow = true;
      fenceGroup.add(log);
    }

    this.group.add(fenceGroup);

    if (this.physicsWorld) {
      const colLeft = new BoxCollider(-12, -38, 16, 1.5);
      const colRight = new BoxCollider(12, -38, 16, 1.5);
      this.physicsWorld.addCollider(colLeft);
      this.physicsWorld.addCollider(colRight);
      this.colliders.push(colLeft, colRight);
    }
  }

  buildSecretElderLockbox() {
    // Secret Elder's Lockbox behind the manor at x: -25, z: -15
    const chestGroup = new THREE.Group();
    chestGroup.position.set(-25, 0.5, -15);

    const chestGeo = new THREE.BoxGeometry(1.3, 0.8, 0.9);
    const chest = new THREE.Mesh(chestGeo, this.timberMat);
    chest.position.y = 0.4;
    chest.castShadow = true;
    chestGroup.add(chest);

    // Emerald jewel rune on lid
    const runeGeo = new THREE.OctahedronGeometry(0.3);
    const rune = new THREE.Mesh(runeGeo, this.runeGateMat);
    rune.position.set(0, 0.85, 0);
    chestGroup.add(rune);

    this.group.add(chestGroup);

    if (this.physicsWorld) {
      const col = new BoxCollider(-25, -15, 1.6, 1.4);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  buildPassagePortals() {
    const passages = [
      { name: 'Dark Forest Palisade Gate', x: 0, y: 0, z: -40, rotY: 0 },
      { name: 'Mountain Pass Footpath', x: -35, y: 1.0, z: 15, rotY: Math.PI / 2 },
      { name: 'Whispering Cavern Cellar', x: -5, y: 0.2, z: 5, rotY: 0 }
    ];

    passages.forEach(p => {
      if (p.name.includes('Cellar')) return; // Covered by wellhouse

      const gate = new THREE.Group();
      gate.position.set(p.x, p.y, p.z);
      gate.rotation.y = p.rotY;

      const postGeo = new THREE.CylinderGeometry(0.35, 0.45, 4.5, 6);
      const lp = new THREE.Mesh(postGeo, this.timberMat);
      lp.position.set(-2.2, 2.25, 0);
      lp.castShadow = true;
      gate.add(lp);

      const rp = new THREE.Mesh(postGeo, this.timberMat);
      rp.position.set(2.2, 2.25, 0);
      rp.castShadow = true;
      gate.add(rp);

      const topGeo = new THREE.BoxGeometry(5.0, 0.6, 0.6);
      const top = new THREE.Mesh(topGeo, this.timberMat);
      top.position.set(0, 4.3, 0);
      top.castShadow = true;
      gate.add(top);

      const runeGeo = new THREE.RingGeometry(0.4, 1.1, 16);
      const rune = new THREE.Mesh(runeGeo, this.runeGateMat);
      rune.position.set(0, 2.4, 0);
      gate.add(rune);

      this.group.add(gate);
    });
  }

  update(deltaTime) {
    if (this.windmillSails) {
      this.windmillSails.rotation.z += deltaTime * 0.85;
    }
  }

  dispose() {
    if (this.physicsWorld && this.colliders.length > 0) {
      this.colliders.forEach(col => {
        if (typeof this.physicsWorld.removeCollider === 'function') {
          this.physicsWorld.removeCollider(col);
        }
      });
      this.colliders = [];
    }

    if (this.group && this.scene) {
      this.scene.remove(this.group);
      this.group.traverse(child => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
  }
}
