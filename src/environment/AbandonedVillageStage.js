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
    this.buildRealisticEthiopianStreetAndAvenue();
    this.buildAxumObeliskMonument();
    this.buildEthiopianVehicleFleet();
    this.buildEthiopianStreetBuildings();
    this.buildEthiopianFlagsAndStreetLights();
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
    this.roadTex = TextureGenerator.createAsphaltRoadTexture(1024, 2048);
    this.sidewalkTex = TextureGenerator.createSidewalkTileTexture(512);

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: this.roadTex,
      roughness: 0.82,
      metalness: 0.08
    });

    this.sidewalkMat = new THREE.MeshStandardMaterial({
      map: this.sidewalkTex,
      roughness: 0.85,
      metalness: 0.05
    });

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

    // Ethiopian National Tricolor Materials
    this.flagGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    this.flagYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });
    this.flagRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
    this.flagBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });

    // Ethiopian Public Transport (Blue & White Minibus Taxi, Lada & Bajaj)
    this.taxiBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.35, metalness: 0.4 });
    this.taxiWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 });
    this.ladaBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.45 });
    this.truckGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    this.burlapMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.95 });
    this.glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85 });
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
    this.curbWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
    this.curbRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });
    this.kioskMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, metalness: 0.3 });
    this.graniteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.15 });

    // Urban Street Infrastructure & Buildings
    this.rotoMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, metalness: 0.1 });
    this.shutterMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.55 });
    this.buildingWallMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9, metalness: 0.05 });
    this.balconyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
    this.trafficRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.6 });
    this.trafficYellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 });
    this.trafficGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
  }

  createSignTexture(amharic, english, bg = '#1e3a8a', fg = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 120);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(amharic, 256, 52);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(english, 256, 96);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  buildTerrain() {
    const geo = new THREE.PlaneGeometry(160, 160, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.hypot(x, z);

      // Smooth central plateau for the Ethiopian City, surrounded by Simien mountain ranges
      let y = 0;
      if (dist > 36) {
        y = Math.pow((dist - 36) / 22, 1.8) * 12.0;
      }
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    this.groundMesh = new THREE.Mesh(geo, this.cobbleMat);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    this.terrain = {
      getTerrainHeight: (x, z) => {
        const dist = Math.hypot(x, z);
        if (dist > 36) {
          return Math.pow((dist - 36) / 22, 1.8) * 12.0;
        }
        return 0;
      }
    };

    if (this.physicsWorld) {
      this.physicsWorld.setTerrain(this.terrain);
    }
  }

  /**
   * Realistic Modern/Historic Ethiopian Street:
   * Dual-lane Asphalt Avenue with textured aggregate, painted dashed yellow centerline,
   * solid white gutter lines, broad realistic Zebra Crossings (ዜብራ መንገድ), elevated concrete sidewalks,
   * red-white curb blocks, overhead cantilever traffic signals, taxi stop shelter, and billboards.
   */
  buildRealisticEthiopianStreetAndAvenue() {
    const streetGroup = new THREE.Group();

    // 1. Dual-Lane Asphalt Roadway (10.6m wide x 72m long)
    const roadGeo = new THREE.PlaneGeometry(10.6, 72.0);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, this.asphaltMat);
    roadMesh.position.set(0, 0.02, 0);
    roadMesh.receiveShadow = true;
    streetGroup.add(roadMesh);

    // 2. Elevated Concrete Sidewalks (5.4m wide x 72m long x 0.22m high)
    [-8.0, 8.0].forEach(sideX => {
      const walkGeo = new THREE.BoxGeometry(5.2, 0.22, 72.0);
      const walk = new THREE.Mesh(walkGeo, this.sidewalkMat);
      walk.position.set(sideX, 0.11, 0);
      walk.receiveShadow = true;
      streetGroup.add(walk);
    });

    // 3. Alternating Red and White Stone Road Curbs with sloped ramp cuts at Zebra Crossings
    [-5.35, 5.35].forEach(xCur => {
      const curbCount = 32;
      const curbLen = 2.25;
      for (let c = 0; c < curbCount; c++) {
        const curbZ = -36.0 + c * curbLen + curbLen / 2;
        const isNearZebra = Math.abs(Math.abs(curbZ) - 16.0) < 1.4;
        const curbH = isNearZebra ? 0.08 : 0.24;
        const isRed = (c % 2 === 0);
        const curb = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, curbH, curbLen - 0.04),
          isRed ? this.curbRedMat : this.curbWhiteMat
        );
        curb.position.set(xCur, curbH / 2 + 0.01, curbZ);
        curb.receiveShadow = true;
        streetGroup.add(curb);
      }
    });

    // 4. Central Roundabout Ring around the Axum Obelisk (radius 6.8m)
    const ringGeo = new THREE.RingGeometry(6.4, 6.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, this.curbWhiteMat);
    ringMesh.position.set(0, 0.12, 0);
    streetGroup.add(ringMesh);

    // 5. Overhead Cantilever Traffic Signal Gantries (የትራፊክ መብራት)
    [-16.0, 16.0].forEach((zCross, idx) => {
      const gantryGroup = new THREE.Group();
      const isSouth = (idx === 0);
      gantryGroup.position.set(isSouth ? -5.5 : 5.5, 0, zCross);

      const mastGeo = new THREE.CylinderGeometry(0.14, 0.18, 5.8, 10);
      const mast = new THREE.Mesh(mastGeo, this.tireMat);
      mast.position.y = 2.9;
      gantryGroup.add(mast);

      const armLen = 4.2;
      const armGeo = new THREE.BoxGeometry(armLen, 0.14, 0.14);
      const arm = new THREE.Mesh(armGeo, this.tireMat);
      arm.position.set(isSouth ? armLen / 2 : -armLen / 2, 5.4, 0);
      gantryGroup.add(arm);

      const sigBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.95, 0.25), this.tireMat);
      sigBox.position.set(isSouth ? 2.8 : -2.8, 4.8, 0);
      gantryGroup.add(sigBox);

      const lensR = 0.09;
      const redLens = new THREE.Mesh(new THREE.CircleGeometry(lensR, 12), this.trafficRedMat);
      redLens.position.set(isSouth ? 2.8 : -2.8, 5.12, isSouth ? 0.13 : -0.13);
      if (!isSouth) redLens.rotation.y = Math.PI;
      gantryGroup.add(redLens);

      const yelLens = new THREE.Mesh(new THREE.CircleGeometry(lensR, 12), this.trafficYellowMat);
      yelLens.position.set(isSouth ? 2.8 : -2.8, 4.8, isSouth ? 0.13 : -0.13);
      if (!isSouth) yelLens.rotation.y = Math.PI;
      gantryGroup.add(yelLens);

      const grnLens = new THREE.Mesh(new THREE.CircleGeometry(lensR, 12), this.trafficGreenMat);
      grnLens.position.set(isSouth ? 2.8 : -2.8, 4.48, isSouth ? 0.13 : -0.13);
      if (!isSouth) grnLens.rotation.y = Math.PI;
      gantryGroup.add(grnLens);

      const pedBox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.52, 0.2), this.tireMat);
      pedBox.position.set(0, 2.2, 0);
      gantryGroup.add(pedBox);

      const walkFigure = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), this.trafficGreenMat);
      walkFigure.position.set(0, 2.1, isSouth ? 0.11 : -0.11);
      if (!isSouth) walkFigure.rotation.y = Math.PI;
      gantryGroup.add(walkFigure);

      streetGroup.add(gantryGroup);
    });

    // 6. Modern Ethiopian Taxi & Bus Stop Shelter (የታክሲ ማቆሚያ ዳስ)
    const shelterGroup = new THREE.Group();
    shelterGroup.position.set(7.5, 0.22, -8.0);

    const sPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8);
    [
      { x: -1.8, z: -1.0 }, { x: 1.8, z: -1.0 },
      { x: -1.8, z: 1.0 }, { x: 1.8, z: 1.0 }
    ].forEach(sp => {
      const p = new THREE.Mesh(sPostGeo, this.kioskMat);
      p.position.set(sp.x, 1.4, sp.z);
      shelterGroup.add(p);
    });

    const sRoof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.6), this.timberMat);
    sRoof.position.set(0, 2.85, 0);
    sRoof.rotation.x = -0.05;
    shelterGroup.add(sRoof);

    const sGlass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.06), this.glassMat);
    sGlass.position.set(0, 1.4, 0.95);
    shelterGroup.add(sGlass);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.5), this.flagYellowMat);
    bench.position.set(0, 0.45, 0.6);
    shelterGroup.add(bench);

    const shelterSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('የታክሲና ባስ ማቆሚያ', 'TAXI & ANBESSA BUS STOP', '#1e3a8a', '#facc15')
    });
    const sSign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.65, 0.08), shelterSignMat);
    sSign.position.set(0, 3.1, -1.0);
    shelterGroup.add(sSign);

    streetGroup.add(shelterGroup);

    // 7. Commercial Billboards along the Avenue
    const telebirrGroup = new THREE.Group();
    telebirrGroup.position.set(-8.5, 0.22, -22.0);

    const bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 5.5, 8), this.tireMat);
    bPost.position.y = 2.75;
    telebirrGroup.add(bPost);

    const telebirrSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('ቴሌብር • telebirr', 'ቀላል፣ ፈጣን እና አስተማማኝ • FAST & SECURE', '#0284c7', '#ffffff')
    });
    const tBoard = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.2, 0.12), telebirrSignMat);
    tBoard.position.set(0, 4.4, 0);
    telebirrGroup.add(tBoard);
    streetGroup.add(telebirrGroup);

    const cbeGroup = new THREE.Group();
    cbeGroup.position.set(8.5, 0.22, -22.0);

    const cbePost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 5.5, 8), this.tireMat);
    cbePost.position.y = 2.75;
    cbeGroup.add(cbePost);

    const cbeSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('የኢትዮጵያ ንግድ ባንክ', 'COMMERCIAL BANK OF ETHIOPIA • CBE', '#7e22ce', '#fef08a')
    });
    const cBoard = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.2, 0.12), cbeSignMat);
    cBoard.position.set(0, 4.4, 0);
    cbeGroup.add(cBoard);
    streetGroup.add(cbeGroup);

    // 8. Green Ethiopian Street Name Signs
    const streetSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('አፄ ፋሲል ጎዳና', 'EMPEROR FASILIDES AVENUE', '#15803d', '#ffffff')
    });
    [-5.6, 5.6].forEach(sx => {
      const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.4, 8), this.tireMat);
      sPole.position.set(sx, 1.7, -3.0);
      streetGroup.add(sPole);

      const sPlacard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.06), streetSignMat);
      sPlacard.position.set(sx, 3.2, -3.0);
      streetGroup.add(sPlacard);
    });

    // 9. Concrete Sidewalk Tree Planters
    [-7.2, 7.2].forEach(px => {
      [-26, -10, 10, 26].forEach(pz => {
        const planter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), this.cobbleMat);
        planter.position.set(px, 0.4, pz);
        streetGroup.add(planter);

        const treeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6), this.timberMat);
        treeStem.position.set(px, 1.2, pz);
        streetGroup.add(treeStem);

        const treeCrown = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), this.qetemaMat);
        treeCrown.position.set(px, 2.0, pz);
        streetGroup.add(treeCrown);
      });
    });

    this.group.add(streetGroup);
  }

  /**
   * Towering Granite Axum Obelisk / Stela (የአክሱም ሐውልት)
   */
  buildAxumObeliskMonument() {
    const obeliskGroup = new THREE.Group();
    obeliskGroup.position.set(0, 0, 0);

    const steps = [
      { w: 7.0, h: 0.35 },
      { w: 5.5, h: 0.35 },
      { w: 4.2, h: 0.35 }
    ];
    let stepY = 0;
    steps.forEach((s) => {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.w), this.graniteMat);
      stepMesh.position.y = stepY + s.h / 2;
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      obeliskGroup.add(stepMesh);
      stepY += s.h;
    });

    const shaftH = 14.5;
    const baseW = 1.9;
    const baseD = 1.4;
    const shaftGeo = new THREE.BoxGeometry(baseW, shaftH, baseD);
    const shaft = new THREE.Mesh(shaftGeo, this.graniteMat);
    shaft.position.y = stepY + shaftH / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    obeliskGroup.add(shaft);

    const bandMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    for (let f = 1; f <= 5; f++) {
      const bandY = stepY + f * 2.3;
      const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.12, 0.22, baseD + 0.12), bandMat);
      beamMesh.position.y = bandY;
      obeliskGroup.add(beamMesh);

      const winMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, baseD + 0.16), bandMat);
      winMesh.position.y = bandY + 0.7;
      obeliskGroup.add(winMesh);
    }

    const apexGeo = new THREE.CylinderGeometry(0.68, 0.68, baseD, 16);
    apexGeo.rotateZ(Math.PI / 2);
    apexGeo.rotateY(Math.PI / 2);
    const apex = new THREE.Mesh(apexGeo, this.graniteMat);
    apex.position.y = stepY + shaftH + 0.2;
    apex.castShadow = true;
    obeliskGroup.add(apex);

    const solarDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, baseD + 0.05, 12), this.goldMat);
    solarDisc.rotation.x = Math.PI / 2;
    solarDisc.position.y = stepY + shaftH + 0.2;
    obeliskGroup.add(solarDisc);

    const signMat = new THREE.MeshBasicMaterial({ map: this.createSignTexture('የአክሱም ሐውልት', 'AXUM OBELISK MONUMENT', '#1e293b', '#fbbf24') });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.1), signMat);
    signBoard.position.set(0, 1.4, 3.2);
    obeliskGroup.add(signBoard);

    this.group.add(obeliskGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(0, 0, 3.2);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * Authentic Fleet of Ethiopian Vehicles:
   * 1. Toyota HiAce Minibus Taxi #1 (Luggage roof rack, decal "እግዚአብሔር ይመስገን", Piazza tag)
   * 2. Toyota HiAce Minibus Taxi #2 (Roof rack, decal "የእናት ምርቃት", Merkato tag)
   * 3. Blue Ethiopian Bajaj #1
   * 4. Yellow/Green Ethiopian Bajaj #2
   * 5. Classic Blue & White Lada 2101 City Taxi
   * 6. Isuzu Commercial Cargo Truck (Loaded with burlap grain/coffee sacks)
   */
  buildEthiopianVehicleFleet() {
    const fleetGroup = new THREE.Group();

    const buildMinibus = (x, z, rotY, decalAmharic, routeTag, plateNum) => {
      const taxi = new THREE.Group();
      taxi.position.set(x, 0, z);
      taxi.rotation.y = rotY;

      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.0, 4.6), this.taxiBlueMat);
      lowerBody.position.y = 0.85;
      lowerBody.castShadow = true;
      taxi.add(lowerBody);

      const upperBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 4.2), this.taxiWhiteMat);
      upperBody.position.y = 1.75;
      upperBody.castShadow = true;
      taxi.add(upperBody);

      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.7, 0.1), this.glassMat);
      windshield.position.set(0, 1.7, 2.06);
      windshield.rotation.x = -0.15;
      taxi.add(windshield);

      const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 0.1), this.glassMat);
      rearWindow.position.set(0, 1.7, -2.06);
      taxi.add(rearWindow);

      [-1.01, 1.01].forEach(sideX => {
        const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 3.2), this.glassMat);
        sideWin.position.set(sideX, 1.7, 0);
        taxi.add(sideWin);
      });

      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 2.8), this.balconyMat);
      rack.position.set(0, 2.3, -0.2);
      taxi.add(rack);

      const luggage1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.7), this.burlapMat);
      luggage1.position.set(-0.35, 2.55, -0.5);
      taxi.add(luggage1);

      const luggage2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), this.flagYellowMat);
      luggage2.position.set(0.35, 2.52, 0.4);
      taxi.add(luggage2);

      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14);
      wheelGeo.rotateZ(Math.PI / 2);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
      [
        { x: -1.05, z: 1.4 }, { x: 1.05, z: 1.4 },
        { x: -1.05, z: -1.4 }, { x: 1.05, z: -1.4 }
      ].forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, this.tireMat);
        wheel.position.set(pos.x, 0.38, pos.z);
        wheel.castShadow = true;
        taxi.add(wheel);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 10), hubMat);
        hub.rotateZ(Math.PI / 2);
        hub.position.set(pos.x, 0.38, pos.z);
        taxi.add(hub);
      });

      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 0.1), this.tireMat);
      grille.position.set(0, 0.85, 2.32);
      taxi.add(grille);

      [-0.75, 0.75].forEach(lx => {
        const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10), this.lanternGlowMat);
        headlight.rotateX(Math.PI / 2);
        headlight.position.set(lx, 0.88, 2.33);
        taxi.add(headlight);
      });

      const routeSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(routeTag, 'SERVICE', '#dc2626', '#ffffff')
      });
      const routeCard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.05), routeSignMat);
      routeCard.position.set(0.45, 1.55, 2.08);
      taxi.add(routeCard);

      const decalSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(decalAmharic, 'BLESSING', '#15803d', '#fef08a')
      });
      const decalCard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.26, 0.05), decalSignMat);
      decalCard.position.set(0, 1.85, -2.12);
      taxi.add(decalCard);

      const plateMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(plateNum, 'TAXI', '#facc15', '#1e1b4b')
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.24, 0.05), plateMat);
      plate.position.set(0, 0.52, 2.34);
      taxi.add(plate);

      return taxi;
    };

    const taxi1 = buildMinibus(3.8, -13.0, -Math.PI / 16, 'እግዚአብሔር ይመስገን', 'ፒያሳ', 'አ.አ 3 - 48291');
    fleetGroup.add(taxi1);
    if (this.physicsWorld) {
      const colTaxi1 = new BoxCollider(3.8, -13.0, 1.3, 2.4);
      this.physicsWorld.addCollider(colTaxi1);
      this.colliders.push(colTaxi1);
    }

    const taxi2 = buildMinibus(-3.8, 18.0, Math.PI - 0.1, 'የእናት ምርቃት', 'መርካቶ', 'አ.አ 3 - 19284');
    fleetGroup.add(taxi2);
    if (this.physicsWorld) {
      const colTaxi2 = new BoxCollider(-3.8, 18.0, 1.3, 2.4);
      this.physicsWorld.addCollider(colTaxi2);
      this.colliders.push(colTaxi2);
    }

    const buildBajaj = (x, z, rotY, bodyMat) => {
      const bajaj = new THREE.Group();
      bajaj.position.set(x, 0, z);
      bajaj.rotation.y = rotY;

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 2.4), bodyMat);
      body.position.y = 0.65;
      body.castShadow = true;
      bajaj.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.8, 2.2), this.tireMat);
      roof.position.y = 1.45;
      roof.castShadow = true;
      bajaj.add(roof);

      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.08), this.glassMat);
      win.position.set(0, 1.35, 1.08);
      win.rotation.x = -0.15;
      bajaj.add(win);

      const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), this.lanternGlowMat);
      headlight.rotateX(Math.PI / 2);
      headlight.position.set(0, 0.72, 1.22);
      bajaj.add(headlight);

      const bWheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12);
      bWheelGeo.rotateZ(Math.PI / 2);

      const fWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
      fWheel.position.set(0, 0.28, 0.95);
      bajaj.add(fWheel);

      [-0.68, 0.68].forEach(wx => {
        const rWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
        rWheel.position.set(wx, 0.28, -0.75);
        bajaj.add(rWheel);
      });

      return bajaj;
    };

    const bajaj1 = buildBajaj(7.5, -4.5, -Math.PI / 4, this.taxiBlueMat);
    fleetGroup.add(bajaj1);
    const bajaj2 = buildBajaj(-7.2, -8.0, Math.PI / 3, this.flagYellowMat);
    fleetGroup.add(bajaj2);

    const lada = new THREE.Group();
    lada.position.set(3.6, 0, -24.0);
    lada.rotation.y = -Math.PI / 18;

    const ladaLower = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 4.2), this.ladaBlueMat);
    ladaLower.position.y = 0.65;
    ladaLower.castShadow = true;
    lada.add(ladaLower);

    const ladaCabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.7, 2.4), this.taxiWhiteMat);
    ladaCabin.position.set(0, 1.35, -0.2);
    lada.add(ladaCabin);

    const ladaWind = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.08), this.glassMat);
    ladaWind.position.set(0, 1.32, 1.02);
    ladaWind.rotation.x = -0.25;
    lada.add(ladaWind);

    const ladaWheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12);
    ladaWheelGeo.rotateZ(Math.PI / 2);
    [
      { x: -0.92, z: 1.25 }, { x: 0.92, z: 1.25 },
      { x: -0.92, z: -1.25 }, { x: 0.92, z: -1.25 }
    ].forEach(lp => {
      const lw = new THREE.Mesh(ladaWheelGeo, this.tireMat);
      lw.position.set(lp.x, 0.32, lp.z);
      lada.add(lw);
    });

    [-0.65, 0.65].forEach(hx => {
      const lhl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), this.lanternGlowMat);
      lhl.rotateX(Math.PI / 2);
      lhl.position.set(hx, 0.68, 2.12);
      lada.add(lhl);
    });
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.15), this.tireMat);
    bumper.position.set(0, 0.42, 2.15);
    lada.add(bumper);

    fleetGroup.add(lada);

    const truck = new THREE.Group();
    truck.position.set(-3.8, 0, 8.0);
    truck.rotation.y = Math.PI - 0.05;

    const truckCab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 1.8), this.taxiWhiteMat);
    truckCab.position.y = 1.6;
    truckCab.castShadow = true;
    truck.add(truckCab);

    const tWind = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.8, 0.08), this.glassMat);
    tWind.position.set(0, 1.8, 3.02);
    truck.add(tWind);

    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 4.2), this.truckGreenMat);
    bed.position.set(0, 1.5, -1.0);
    bed.castShadow = true;
    truck.add(bed);

    for (let sy = 0; sy < 2; sy++) {
      for (let sz = -2.4; sz <= 0.4; sz += 0.85) {
        [-0.55, 0.55].forEach(sx => {
          const sack = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.75), this.burlapMat);
          sack.position.set(sx, 1.6 + sy * 0.45, sz);
          truck.add(sack);
        });
      }
    }

    const tWheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.32, 14);
    tWheelGeo.rotateZ(Math.PI / 2);
    [
      { x: -1.15, z: 2.1 }, { x: 1.15, z: 2.1 },
      { x: -1.15, z: -1.2 }, { x: 1.15, z: -1.2 },
      { x: -1.15, z: -2.1 }, { x: 1.15, z: -2.1 }
    ].forEach(tp => {
      const tw = new THREE.Mesh(tWheelGeo, this.tireMat);
      tw.position.set(tp.x, 0.44, tp.z);
      tw.castShadow = true;
      truck.add(tw);
    });

    fleetGroup.add(truck);
    if (this.physicsWorld) {
      const colTruck = new BoxCollider(-3.8, 8.0, 1.4, 3.2);
      this.physicsWorld.addCollider(colTruck);
      this.colliders.push(colTruck);
    }

    this.group.add(fleetGroup);
  }

  /**
   * Continuous Multi-Storey Urban Ethiopian Street Buildings Framing the Avenue:
   * Ground-floor commercial shops with roll-up shutters and Amharic signs,
   * upper floor residential balconies with railings and laundry,
   * and black cylindrical Roto water tanks (ሮቶ) & satellite dishes on every rooftop.
   */
  buildEthiopianStreetBuildings() {
    const buildingsGroup = new THREE.Group();

    const buildUrbanBuilding = (config) => {
      const bldg = new THREE.Group();
      bldg.position.set(config.x, 0, config.z);

      const w = config.w || 7.5;
      const h = config.h || 7.8;
      const d = config.d || 7.0;

      const shellGeo = new THREE.BoxGeometry(w, h, d);
      const shell = new THREE.Mesh(shellGeo, this.buildingWallMat);
      shell.position.y = h / 2;
      shell.castShadow = true;
      shell.receiveShadow = true;
      bldg.add(shell);

      const shutter = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 2.6, 0.12), this.shutterMat);
      shutter.position.set(0, 1.3, d / 2 + 0.08);
      bldg.add(shutter);

      const signMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(config.amharicSign, config.englishSign, config.signBg, config.signFg)
      });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.95, 0.14), signMat);
      sign.position.set(0, 3.2, d / 2 + 0.15);
      bldg.add(sign);

      if (config.hasAwning) {
        const awningMat = config.awningMat || this.curbRedMat;
        const awning = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.15, 2.2), awningMat);
        awning.position.set(0, 2.8, d / 2 + 1.1);
        awning.rotation.x = 0.14;
        awning.castShadow = true;
        bldg.add(awning);
      }

      for (let floor = 2; floor <= Math.floor(h / 3.0); floor++) {
        const floorY = floor * 2.8;
        if (floorY + 1.2 < h) {
          const bSlab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.18, 1.4), this.cobbleMat);
          bSlab.position.set(0, floorY, d / 2 + 0.7);
          bldg.add(bSlab);

          const bRail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.85, 0.08), this.balconyMat);
          bRail.position.set(0, floorY + 0.45, d / 2 + 1.35);
          bldg.add(bRail);

          const uWin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.1), this.glassMat);
          uWin.position.set(0, floorY + 0.9, d / 2 + 0.06);
          bldg.add(uWin);
        }
      }

      const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.65, d + 0.1), this.buildingWallMat);
      parapet.position.y = h + 0.32;
      bldg.add(parapet);

      const rotoGroup = new THREE.Group();
      rotoGroup.position.set(-w * 0.25, h, -d * 0.2);

      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 1.4), this.balconyMat);
      stand.position.y = 0.32;
      rotoGroup.add(stand);

      const tankGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.4, 16);
      const tank = new THREE.Mesh(tankGeo, this.rotoMat);
      tank.position.y = 1.35;
      tank.castShadow = true;
      rotoGroup.add(tank);

      bldg.add(rotoGroup);

      const dishGroup = new THREE.Group();
      dishGroup.position.set(w * 0.25, h + 0.2, d * 0.2);

      const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), this.balconyMat);
      dishMast.position.y = 0.45;
      dishGroup.add(dishMast);

      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3), this.taxiWhiteMat);
      dish.rotation.x = Math.PI / 3;
      dish.position.set(0, 0.8, 0);
      dishGroup.add(dish);

      bldg.add(dishGroup);

      if (this.physicsWorld) {
        const col = new BoxCollider(config.x, config.z, w / 2 + 0.2, d / 2 + 0.2);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }

      return bldg;
    };

    // WEST STREET BLOCK (x: -14.5)
    const bunnaBet = buildUrbanBuilding({
      x: -14.5, z: -4.0, w: 7.2, h: 7.6, d: 7.0,
      amharicSign: 'ቡና ቤት', englishSign: 'TRADITIONAL BUNNA BET',
      signBg: '#78350f', signFg: '#fef08a', hasAwning: true, awningMat: this.timberMat
    });
    const stoolMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    [
      { x: -9.8, z: -3.2 }, { x: -8.8, z: -4.4 }, { x: -9.6, z: -5.6 }
    ].forEach(sp => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.38, 10), stoolMat);
      stool.position.set(sp.x, 0.4, sp.z);
      buildingsGroup.add(stool);
    });
    buildingsGroup.add(bunnaBet);

    const sigaBet = buildUrbanBuilding({
      x: -14.5, z: -13.0, w: 6.8, h: 7.4, d: 6.8,
      amharicSign: 'ስጋ ቤት', englishSign: 'SIGA BET • BUTCHERY',
      signBg: '#991b1b', signFg: '#ffffff', hasAwning: true, awningMat: this.curbRedMat
    });
    buildingsGroup.add(sigaBet);

    const awashBank = buildUrbanBuilding({
      x: -14.5, z: 6.0, w: 7.6, h: 9.8, d: 7.0,
      amharicSign: 'አዋሽ ባንክ', englishSign: 'AWASH BANK • PIASSA BRANCH',
      signBg: '#0369a1', signFg: '#f97316', hasAwning: false
    });
    buildingsGroup.add(awashBank);

    const teleKiosk = buildUrbanBuilding({
      x: -14.5, z: -21.0, w: 6.5, h: 7.2, d: 6.5,
      amharicSign: 'ቴሌብር ኪዮስክ', englishSign: 'TELEBIRR & MINI-MARKET',
      signBg: '#0284c7', signFg: '#ffffff', hasAwning: true, awningMat: this.flagYellowMat
    });
    buildingsGroup.add(teleKiosk);

    const juiceBet = buildUrbanBuilding({
      x: -14.5, z: 14.5, w: 6.6, h: 7.4, d: 6.8,
      amharicSign: 'ጁስ ቤት', englishSign: 'SPECIAL SPRIS JUICE BET',
      signBg: '#15803d', signFg: '#fef08a', hasAwning: true, awningMat: this.flagGreenMat
    });
    buildingsGroup.add(juiceBet);

    // EAST STREET BLOCK (x: 14.5)
    const clothShop = buildUrbanBuilding({
      x: 14.5, z: 6.5, w: 7.2, h: 7.6, d: 7.0,
      amharicSign: 'የባህል ልብስ', englishSign: 'ETHIOPIAN CULTURAL DRESS',
      signBg: '#15803d', signFg: '#fef08a', hasAwning: true, awningMat: this.flagYellowMat
    });
    [-1.2, 1.2].forEach(mx => {
      const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.52, 1.4, 12), this.parchmentMat);
      dress.position.set(11.2, 1.0, 6.5 + mx);
      buildingsGroup.add(dress);
      const tibeb = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.18, 12), this.flagYellowMat);
      tibeb.position.set(11.2, 0.45, 6.5 + mx);
      buildingsGroup.add(tibeb);
    });
    buildingsGroup.add(clothShop);

    const dashenBank = buildUrbanBuilding({
      x: 14.5, z: -4.0, w: 7.6, h: 9.8, d: 7.0,
      amharicSign: 'ዳሽን ባንክ', englishSign: 'DASHEN BANK • ALWAYS AHEAD',
      signBg: '#1e3a8a', signFg: '#fbbf24', hasAwning: false
    });
    buildingsGroup.add(dashenBank);

    const pharmacy = buildUrbanBuilding({
      x: 14.5, z: -13.0, w: 6.8, h: 7.4, d: 6.8,
      amharicSign: 'ፋርማሲ', englishSign: 'COMMUNITY HEALTH PHARMACY',
      signBg: '#059669', signFg: '#ffffff', hasAwning: true, awningMat: this.flagGreenMat
    });
    buildingsGroup.add(pharmacy);

    const craftShop = buildUrbanBuilding({
      x: 14.5, z: 15.0, w: 6.8, h: 7.4, d: 6.8,
      amharicSign: 'የዕደ ጥበብ', englishSign: 'TRADITIONAL MESOB & CRAFTS',
      signBg: '#b45309', signFg: '#fef3c7', hasAwning: true, awningMat: this.timberMat
    });
    buildingsGroup.add(craftShop);

    this.group.add(buildingsGroup);
  }

  /**
   * Ethiopian Tricolors, Utility Power Poles, and Amber Street Lamps
   */
  buildEthiopianFlagsAndStreetLights() {
    const decGroup = new THREE.Group();

    // 1. Tall Flagpoles Flying Ethiopian Tricolor (Green, Gold, Red)
    const flagpolePositions = [
      { x: -3.5, z: -24.0 },
      { x: 3.5, z: -24.0 },
      { x: -5.0, z: 2.0 },
      { x: 5.0, z: 2.0 }
    ];

    flagpolePositions.forEach(fp => {
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 8.5, 8);
      const pole = new THREE.Mesh(poleGeo, this.goldMat);
      pole.position.set(fp.x, 4.25, fp.z);
      pole.castShadow = true;
      decGroup.add(pole);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), this.goldMat);
      finial.position.set(fp.x, 8.65, fp.z);
      decGroup.add(finial);

      const flagW = 2.4;
      const stripeH = 0.48;

      const gStripe = new THREE.Mesh(new THREE.PlaneGeometry(flagW, stripeH), this.flagGreenMat);
      gStripe.position.set(fp.x + flagW / 2 + 0.05, 8.2, fp.z);
      gStripe.rotation.y = 0.25;
      decGroup.add(gStripe);

      const yStripe = new THREE.Mesh(new THREE.PlaneGeometry(flagW, stripeH), this.flagYellowMat);
      yStripe.position.set(fp.x + flagW / 2 + 0.05, 8.2 - stripeH, fp.z);
      yStripe.rotation.y = 0.25;
      decGroup.add(yStripe);

      const star = new THREE.Mesh(new THREE.CircleGeometry(0.16, 10), this.flagBlueMat);
      star.position.set(fp.x + flagW / 2 + 0.05, 8.2 - stripeH, fp.z + 0.01);
      star.rotation.y = 0.25;
      decGroup.add(star);

      const rStripe = new THREE.Mesh(new THREE.PlaneGeometry(flagW, stripeH), this.flagRedMat);
      rStripe.position.set(fp.x + flagW / 2 + 0.05, 8.2 - stripeH * 2, fp.z);
      rStripe.rotation.y = 0.25;
      decGroup.add(rStripe);
    });

    // 2. Utility Power Poles
    const polePositions = [
      { x: -5.5, z: -28.0 },
      { x: -5.5, z: -8.0 },
      { x: -5.5, z: 12.0 }
    ];
    polePositions.forEach(pp => {
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9.2, 8), this.timberMat);
      uPole.position.set(pp.x, 4.6, pp.z);
      uPole.castShadow = true;
      decGroup.add(uPole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 2.2), this.timberMat);
      arm.position.set(pp.x, 8.6, pp.z);
      decGroup.add(arm);

      [-0.8, 0, 0.8].forEach(iz => {
        const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 6), this.parchmentMat);
        ins.position.set(pp.x, 8.75, pp.z + iz);
        decGroup.add(ins);
      });
    });

    // 3. Ornate Street Lamps with Warm Amber Lanterns
    const lampPositions = [
      { x: -4.3, z: -20.0 },
      { x: 4.3, z: -20.0 },
      { x: -4.3, z: -4.0 },
      { x: 4.3, z: -4.0 },
      { x: -4.3, z: 16.0 },
      { x: 4.3, z: 16.0 }
    ];
    lampPositions.forEach(lp => {
      const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.8, 8), this.tireMat);
      lampPost.position.set(lp.x, 2.4, lp.z);
      lampPost.castShadow = true;
      decGroup.add(lampPost);

      const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), this.lanternGlowMat);
      lantern.position.set(lp.x, 4.9, lp.z);
      decGroup.add(lantern);

      const lampLight = new THREE.PointLight(0xf59e0b, 0.8, 8);
      lampLight.position.set(lp.x, 4.9, lp.z);
      decGroup.add(lampLight);
    });

    this.group.add(decGroup);
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
