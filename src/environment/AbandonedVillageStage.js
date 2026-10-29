import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { BoxCollider, CircleCollider } from '../physics/Colliders.js';

/**
 * Level 1 Playable Environment: Gondar City & Emperor Fasilides Avenue
 * Authentic modern Ethiopian city street featuring:
 * - Completely FLAT urban asphalt ground plane (NO curved stone bowl walls)
 * - 220-meter long dual-lane aggregate asphalt avenue with yellow dashed centerline, zebra crossings, and red-white curbs
 * - Continuous multi-storey commercial buildings lining both sides of the avenue with storefront glass,
 *   roll-up shutters, Amharic signs, balconies, rooftop black Roto water tanks (ሮቶ), and satellite dishes
 * - Highly detailed vehicle fleet: Classic Blue & White Lada 2101 taxi with chrome grille and composite headlamps,
 *   Toyota HiAce minibus taxis with luggage roof racks, modern Toyota Corolla sedan, Bajaj auto-rickshaws, and Isuzu cargo truck
 * - Central Axum Obelisk traffic roundabout monument
 * - Sidewalk Bunna Bet coffee ceremony terrace and cultural minstrel station
 */
export class AbandonedVillageStage {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();
    this.colliders = [];

    this.initMaterials();
    this.buildTerrain();
    this.buildRealisticEthiopianStreetAndAvenue();
    this.buildAxumObeliskMonument();
    this.buildEthiopianVehicleFleet();
    this.buildEthiopianStreetBuildings();
    this.buildEthiopianFlagsAndStreetLights();
    this.buildEthiopianBazaarAndCoffeeCeremony();
    this.buildAzmariMusicStation();
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

    this.timberMat = new THREE.MeshStandardMaterial({
      map: this.woodTex,
      roughness: 0.8,
      metalness: 0.1
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });

    this.clayMat = new THREE.MeshStandardMaterial({
      color: 0x221814,
      roughness: 0.8,
      metalness: 0.1
    });

    this.qetemaMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.85,
      metalness: 0.05
    });

    this.parchmentMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.85
    });

    // Chrome & Automotive Materials
    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.96,
      roughness: 0.08
    });

    this.headlightBulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.4,
      roughness: 0.1
    });

    this.turnSignalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9
    });

    this.tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xb91c1c,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });

    this.carGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.82
    });

    // Ethiopian Public Transport Livery & Automotive Finishes
    this.taxiBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.25, metalness: 0.65 });
    this.taxiWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.22, metalness: 0.45 });
    this.ladaBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.28, metalness: 0.6 });
    this.sedanSilverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.18, metalness: 0.75 });
    this.truckGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    this.burlapMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.95 });
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.92 });
    this.curbWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
    this.curbRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });
    this.kioskMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, metalness: 0.3 });
    this.graniteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.15 });

    // Urban Street Infrastructure & Multi-Storey Buildings
    this.rotoMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, metalness: 0.1 });
    this.shutterMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.55 });
    this.buildingWallMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9, metalness: 0.05 });
    this.balconyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
    this.trafficRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.8 });
    this.trafficYellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 });
    this.trafficGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });

    // Ethiopian Tricolor Materials
    this.flagGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    this.flagYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });
    this.flagRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
    this.flagBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
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
    return new THREE.CanvasTexture(canvas);
  }

  buildTerrain() {
    // Completely FLAT urban city ground plane (500m x 500m) - NO curved bowl walls!
    const geo = new THREE.PlaneGeometry(500, 500, 1, 1);
    geo.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean dark asphalt tarmac tone
      roughness: 0.9,
      metalness: 0.05
    });

    this.groundMesh = new THREE.Mesh(geo, groundMat);
    this.groundMesh.position.set(0, -0.01, 0);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    this.terrain = {
      getTerrainHeight: () => 0
    };

    if (this.physicsWorld) {
      this.physicsWorld.setTerrain(this.terrain);
    }
  }

  /**
   * Realistic Modern Ethiopian Street:
   * 220-meter long Dual-lane Asphalt Avenue with textured aggregate, painted dashed yellow centerline,
   * solid white shoulder lines, broad Zebra Crossings, elevated concrete sidewalks,
   * red-white curb blocks, overhead cantilever traffic signals, and street furniture.
   */
  buildRealisticEthiopianStreetAndAvenue() {
    const streetGroup = new THREE.Group();

    // 1. Dual-Lane Asphalt Roadway (11.2m wide x 220m long)
    const roadLength = 220.0;
    const roadWidth = 11.2;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    roadGeo.rotateX(-Math.PI / 2);

    // Set texture repeat for long road
    this.roadTex.wrapS = THREE.RepeatWrapping;
    this.roadTex.wrapT = THREE.RepeatWrapping;
    this.roadTex.repeat.set(1, 3);

    const roadMesh = new THREE.Mesh(roadGeo, this.asphaltMat);
    roadMesh.position.set(0, 0.02, 0);
    roadMesh.receiveShadow = true;
    streetGroup.add(roadMesh);

    // 2. Elevated Concrete Sidewalks (5.4m wide x 220m long x 0.22m high)
    [-8.3, 8.3].forEach(sideX => {
      const walkGeo = new THREE.BoxGeometry(5.4, 0.22, roadLength);
      const walk = new THREE.Mesh(walkGeo, this.sidewalkMat);
      walk.position.set(sideX, 0.11, 0);
      walk.receiveShadow = true;
      streetGroup.add(walk);
    });

    // 3. Alternating Red and White Stone Road Curbs along the entire 220m avenue
    [-5.6, 5.6].forEach(xCur => {
      const curbCount = 96;
      const curbLen = roadLength / curbCount;
      for (let c = 0; c < curbCount; c++) {
        const curbZ = -roadLength / 2 + c * curbLen + curbLen / 2;
        // Ramp cut near zebra crossings
        const isNearZebra = Math.abs(curbZ + 50) < 2.0 || Math.abs(curbZ + 16) < 2.0 || Math.abs(curbZ - 16) < 2.0 || Math.abs(curbZ - 50) < 2.0;
        const curbH = isNearZebra ? 0.08 : 0.24;
        const isRed = (c % 2 === 0);
        const curb = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, curbH, curbLen - 0.03),
          isRed ? this.curbRedMat : this.curbWhiteMat
        );
        curb.position.set(xCur, curbH / 2 + 0.01, curbZ);
        curb.receiveShadow = true;
        streetGroup.add(curb);
      }
    });

    // 4. Central Roundabout Ring around the Axum Obelisk (radius 6.8m)
    const ringGeo = new THREE.RingGeometry(6.4, 6.8, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, this.curbWhiteMat);
    ringMesh.position.set(0, 0.12, 0);
    streetGroup.add(ringMesh);

    // 5. Overhead Cantilever Traffic Signal Gantries
    [-50.0, -16.0, 16.0, 50.0].forEach((zCross, idx) => {
      const gantryGroup = new THREE.Group();
      const isSouth = (idx % 2 === 0);
      gantryGroup.position.set(isSouth ? -5.8 : 5.8, 0, zCross);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.8, 10), this.tireMat);
      mast.position.y = 2.9;
      gantryGroup.add(mast);

      const armLen = 4.4;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.14, 0.14), this.tireMat);
      arm.position.set(isSouth ? armLen / 2 : -armLen / 2, 5.4, 0);
      gantryGroup.add(arm);

      const sigBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.95, 0.25), this.tireMat);
      sigBox.position.set(isSouth ? 3.0 : -3.0, 4.8, 0);
      gantryGroup.add(sigBox);

      const lensR = 0.09;
      const redLens = new THREE.Mesh(new THREE.CircleGeometry(lensR, 12), this.trafficRedMat);
      redLens.position.set(isSouth ? 3.0 : -3.0, 5.12, isSouth ? 0.13 : -0.13);
      if (!isSouth) redLens.rotation.y = Math.PI;
      gantryGroup.add(redLens);

      const yelLens = new THREE.Mesh(new THREE.CircleGeometry(lensR, 12), this.trafficYellowMat);
      yelLens.position.set(isSouth ? 3.0 : -3.0, 4.8, isSouth ? 0.13 : -0.13);
      if (!isSouth) yelLens.rotation.y = Math.PI;
      gantryGroup.add(yelLens);

      const grnLens = new THREE.Mesh(new THREE.CircleGeometry(lensR, 12), this.trafficGreenMat);
      grnLens.position.set(isSouth ? 3.0 : -3.0, 4.48, isSouth ? 0.13 : -0.13);
      if (!isSouth) grnLens.rotation.y = Math.PI;
      gantryGroup.add(grnLens);

      streetGroup.add(gantryGroup);
    });

    // 6. Modern Ethiopian Taxi & Bus Stop Shelter
    const shelterGroup = new THREE.Group();
    shelterGroup.position.set(8.8, 0.22, -10.0);

    const sPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8);
    [
      { x: -1.8, z: -1.0 }, { x: 1.8, z: -1.0 },
      { x: -1.8, z: 1.0 }, { x: 1.8, z: 1.0 }
    ].forEach(sp => {
      const p = new THREE.Mesh(sPostGeo, this.kioskMat);
      p.position.set(sp.x, 1.4, sp.z);
      shelterGroup.add(p);
    });

    const sRoof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.6), this.balconyMat);
    sRoof.position.set(0, 2.85, 0);
    sRoof.rotation.x = -0.05;
    shelterGroup.add(sRoof);

    const sGlass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.06), this.carGlassMat);
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
    telebirrGroup.position.set(-8.8, 0.22, -26.0);
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
    cbeGroup.position.set(8.8, 0.22, -26.0);
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

    // 8. Municipal Street Name Signs
    [-5.7, 5.7].forEach((sx, sIdx) => {
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 8), this.tireMat);
      signPost.position.set(sx, 1.6, -16.0);
      streetGroup.add(signPost);

      const stSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture('አፄ ፋሲል ጎዳና', 'EMPEROR FASILIDES AVENUE', '#15803d', '#ffffff')
      });
      const stPlate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.04), stSignMat);
      stPlate.position.set(sx + (sIdx === 0 ? 0.6 : -0.6), 2.9, -16.0);
      streetGroup.add(stPlate);
    });

    // 9. Sidewalk Concrete Tree Planters extending all along the 220m avenue
    [-8.0, 8.0].forEach(px => {
      [-80.0, -60.0, -40.0, -20.0, 20.0, 40.0, 60.0, 80.0].forEach(pz => {
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 1.2), this.curbWhiteMat);
        box.position.set(px, 0.44, pz);
        streetGroup.add(box);

        const soil = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 1.0), this.clayMat);
        soil.position.set(px, 0.68, pz);
        streetGroup.add(soil);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6), this.timberMat);
        trunk.position.set(px, 1.5, pz);
        streetGroup.add(trunk);

        const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75), this.flagGreenMat);
        canopy.position.set(px, 2.5, pz);
        streetGroup.add(canopy);
      });
    });

    this.group.add(streetGroup);
  }

  /**
   * Towering Granite Axum Obelisk / Stela (የአክሱም ሐውልት)
   * Positioned inside the central roundabout ring at (0, 0, 0).
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

    const apexGeo = new THREE.CylinderGeometry(0.85, baseW * 0.45, 1.8, 12);
    const apex = new THREE.Mesh(apexGeo, this.graniteMat);
    apex.position.y = stepY + shaftH + 0.9;
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
   * Authentic Fleet of Realistic Ethiopian Vehicles:
   * Built with realistic automotive curves, chrome grilles, multi-piece composite headlights,
   * alloy rims with rubber tires, side mirrors, and authentic Ethiopian taxi decals.
   */
  buildEthiopianVehicleFleet() {
    const fleetGroup = new THREE.Group();

    // Helper: Build Realistic Toyota HiAce Minibus Taxi
    const buildMinibus = (x, z, rotY, decalAmharic, routeTag, plateNum) => {
      const taxi = new THREE.Group();
      taxi.position.set(x, 0, z);
      taxi.rotation.y = rotY;

      // Lower navy blue chassis with beveled nose
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 4.6), this.taxiBlueMat);
      lowerBody.position.y = 0.85;
      lowerBody.castShadow = true;
      taxi.add(lowerBody);

      // Upper white passenger cabin
      const upperBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 4.2), this.taxiWhiteMat);
      upperBody.position.y = 1.75;
      upperBody.castShadow = true;
      taxi.add(upperBody);

      // Sloped front windshield with black framing
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.72, 0.1), this.carGlassMat);
      windshield.position.set(0, 1.7, 2.06);
      windshield.rotation.x = -0.16;
      taxi.add(windshield);

      // Rear window
      const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 0.1), this.carGlassMat);
      rearWindow.position.set(0, 1.7, -2.06);
      taxi.add(rearWindow);

      // Side tinted passenger windows
      [-1.01, 1.01].forEach(sideX => {
        const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 3.2), this.carGlassMat);
        sideWin.position.set(sideX, 1.7, 0);
        taxi.add(sideWin);
      });

      // Rooftop luggage carrier rack (የሻንጣ መጫኛ)
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 2.8), this.balconyMat);
      rack.position.set(0, 2.3, -0.2);
      taxi.add(rack);

      const luggage1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.7), this.burlapMat);
      luggage1.position.set(-0.35, 2.55, -0.5);
      taxi.add(luggage1);

      const luggage2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), this.flagYellowMat);
      luggage2.position.set(0.35, 2.52, 0.4);
      taxi.add(luggage2);

      // 5-Spoke Alloy Wheels with Radial Rubber Tires
      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      [
        { x: -1.05, z: 1.4 }, { x: 1.05, z: 1.4 },
        { x: -1.05, z: -1.4 }, { x: 1.05, z: -1.4 }
      ].forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, this.tireMat);
        wheel.position.set(pos.x, 0.38, pos.z);
        wheel.castShadow = true;
        taxi.add(wheel);

        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.3, 10), this.chromeMat);
        rim.rotateZ(Math.PI / 2);
        rim.position.set(pos.x, 0.38, pos.z);
        taxi.add(rim);
      });

      // Multi-slat Chrome Radiator Grille
      const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 0.1), this.chromeMat);
      grilleMesh.position.set(0, 0.85, 2.32);
      taxi.add(grilleMesh);

      const fBump = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 0.18), this.balconyMat);
      fBump.position.set(0, 0.45, 2.34);
      taxi.add(fBump);

      const rBump = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 0.18), this.balconyMat);
      rBump.position.set(0, 0.45, -2.34);
      taxi.add(rBump);

      // Composite Projector Headlamps with Chrome Reflector & Amber Turn Indicator
      [-0.75, 0.75].forEach(lx => {
        // Outer bezel
        const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.1), this.chromeMat);
        bezel.position.set(lx, 0.88, 2.32);
        taxi.add(bezel);

        // White LED projector
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), this.headlightBulbMat);
        bulb.position.set(lx + (lx > 0 ? -0.06 : 0.06), 0.88, 2.36);
        taxi.add(bulb);

        // Amber turn signal
        const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.04), this.turnSignalMat);
        indicator.position.set(lx + (lx > 0 ? 0.12 : -0.12), 0.88, 2.36);
        taxi.add(indicator);

        // Side mirrors on stalks
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18), this.tireMat);
        stalk.position.set(lx * 1.35, 1.58, 1.8);
        stalk.rotation.z = lx > 0 ? -Math.PI / 3 : Math.PI / 3;
        taxi.add(stalk);

        const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.14), this.tireMat);
        mirror.position.set(lx * 1.5, 1.62, 1.8);
        taxi.add(mirror);
      });

      // Destination Route Card (e.g., "ፒያሳ • PIAZZA")
      const routeSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(routeTag, 'SERVICE', '#dc2626', '#ffffff')
      });
      const routeCard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.05), routeSignMat);
      routeCard.position.set(0.45, 1.55, 2.08);
      taxi.add(routeCard);

      // Rear Window Blessing Decal (e.g., "እግዚአብሔር ይመስገን")
      const decalSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(decalAmharic, 'BLESSING', '#15803d', '#fef08a')
      });
      const decalCard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.26, 0.05), decalSignMat);
      decalCard.position.set(0, 1.85, -2.12);
      taxi.add(decalCard);

      // Yellow Taxi License Plate
      const plateMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(plateNum, 'TAXI', '#facc15', '#1e1b4b')
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.24, 0.05), plateMat);
      plate.position.set(0, 0.52, 2.34);
      taxi.add(plate);

      return taxi;
    };

    // Helper: Build Classic Blue & White Lada 2101 City Taxi
    const buildLadaTaxi = (x, z, rotY) => {
      const lada = new THREE.Group();
      lada.position.set(x, 0, z);
      lada.rotation.y = rotY;

      // Lower blue chassis
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.65, 4.2), this.ladaBlueMat);
      lower.position.y = 0.58;
      lower.castShadow = true;
      lada.add(lower);

      // White doors and roof cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.68, 2.4), this.taxiWhiteMat);
      cabin.position.set(0, 1.25, -0.2);
      cabin.castShadow = true;
      lada.add(cabin);

      // Front & rear sloped glass
      const fGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.58, 0.08), this.carGlassMat);
      fGlass.position.set(0, 1.25, 1.02);
      fGlass.rotation.x = -0.26;
      lada.add(fGlass);

      const rGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.54, 0.08), this.carGlassMat);
      rGlass.position.set(0, 1.25, -1.42);
      rGlass.rotation.x = 0.26;
      lada.add(rGlass);

      // Chrome front bumper with rubber overriders
      const fBump = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.16), this.chromeMat);
      fBump.position.set(0, 0.42, 2.14);
      lada.add(fBump);

      [-0.45, 0.45].forEach(rx => {
        const overrider = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.18), this.tireMat);
        overrider.position.set(rx, 0.42, 2.15);
        lada.add(overrider);
      });

      // Chrome Radiator Grille with horizontal mesh
      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.06), this.chromeMat);
      grille.position.set(0, 0.68, 2.12);
      lada.add(grille);

      // Iconic Round Headlamps with Chrome Bezels & Projector Bulb
      [-0.68, 0.68].forEach(hx => {
        const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 20), this.chromeMat);
        bezel.position.set(hx, 0.68, 2.12);
        lada.add(bezel);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), this.headlightBulbMat);
        bulb.position.set(hx, 0.68, 2.14);
        lada.add(bulb);

        // Amber turn signal
        const turn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), this.turnSignalMat);
        turn.position.set(hx + (hx > 0 ? 0.14 : -0.14), 0.54, 2.12);
        lada.add(turn);
      });

      // Wheels with Chrome Hubcaps
      const wGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
      wGeo.rotateZ(Math.PI / 2);
      [
        { x: -0.92, z: 1.25 }, { x: 0.92, z: 1.25 },
        { x: -0.92, z: -1.25 }, { x: 0.92, z: -1.25 }
      ].forEach(pos => {
        const w = new THREE.Mesh(wGeo, this.tireMat);
        w.position.set(pos.x, 0.32, pos.z);
        lada.add(w);

        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 12), this.chromeMat);
        cap.rotateZ(Math.PI / 2);
        cap.position.set(pos.x, 0.32, pos.z);
        lada.add(cap);
      });

      // Illuminated Yellow Roof Taxi Sign (ታክሲ • TAXI)
      const taxiSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture('ታክሲ', 'TAXI', '#facc15', '#1e1b4b')
      });
      const taxiRoofSign = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.2, 0.2), taxiSignMat);
      taxiRoofSign.position.set(0, 1.68, -0.1);
      lada.add(taxiRoofSign);

      return lada;
    };

    // Helper: Build Modern Silver Sedan (Toyota Corolla)
    const buildSedan = (x, z, rotY) => {
      const car = new THREE.Group();
      car.position.set(x, 0, z);
      car.rotation.y = rotY;

      // Sleek lower chassis
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 4.4), this.sedanSilverMat);
      lower.position.y = 0.55;
      lower.castShadow = true;
      car.add(lower);

      // Cabin greenhouse
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.58, 2.4), this.sedanSilverMat);
      cabin.position.set(0, 1.12, -0.2);
      cabin.castShadow = true;
      car.add(cabin);

      // Front & rear sloped glass
      const fGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 0.08), this.carGlassMat);
      fGlass.position.set(0, 1.1, 1.05);
      fGlass.rotation.x = -0.35;
      car.add(fGlass);

      const rGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 0.08), this.carGlassMat);
      rGlass.position.set(0, 1.1, -1.45);
      rGlass.rotation.x = 0.35;
      car.add(rGlass);

      // 5-Spoke Sport Rims
      const wGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
      wGeo.rotateZ(Math.PI / 2);
      [
        { x: -0.92, z: 1.3 }, { x: 0.92, z: 1.3 },
        { x: -0.92, z: -1.3 }, { x: 0.92, z: -1.3 }
      ].forEach(pos => {
        const w = new THREE.Mesh(wGeo, this.tireMat);
        w.position.set(pos.x, 0.32, pos.z);
        car.add(w);

        const h = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.24, 10), this.chromeMat);
        h.rotateZ(Math.PI / 2);
        h.position.set(pos.x, 0.32, pos.z);
        car.add(h);
      });

      // Composite projector headlamps
      [-0.68, 0.68].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.1), this.chromeMat);
        hl.position.set(hx, 0.62, 2.2);
        car.add(hl);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), this.headlightBulbMat);
        bulb.position.set(hx, 0.62, 2.25);
        car.add(bulb);
      });

      return car;
    };

    // Helper: Build Bajaj Auto-Rickshaw
    const buildBajaj = (x, z, rotY, bodyMat) => {
      const bajaj = new THREE.Group();
      bajaj.position.set(x, 0, z);
      bajaj.rotation.y = rotY;

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.75, 2.3), bodyMat);
      body.position.y = 0.6;
      body.castShadow = true;
      bajaj.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 2.1), this.tireMat);
      roof.position.y = 1.35;
      roof.castShadow = true;
      bajaj.add(roof);

      const win = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.08), this.carGlassMat);
      win.position.set(0, 1.28, 1.05);
      win.rotation.x = -0.18;
      bajaj.add(win);

      const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), this.headlightBulbMat);
      headlight.rotateX(Math.PI / 2);
      headlight.position.set(0, 0.68, 1.18);
      bajaj.add(headlight);

      const bWheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 14);
      bWheelGeo.rotateZ(Math.PI / 2);

      const fWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
      fWheel.position.set(0, 0.26, 0.95);
      bajaj.add(fWheel);

      [-0.65, 0.65].forEach(wx => {
        const rWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
        rWheel.position.set(wx, 0.26, -0.72);
        bajaj.add(rWheel);
      });

      return bajaj;
    };

    // 1. Minibus Taxi 1 (Northbound)
    const taxi1 = buildMinibus(3.8, -14.0, 0, 'እግዚአብሔር ይመስገን', 'ፒያሳ', 'አ.አ 3 - 48291');
    fleetGroup.add(taxi1);
    if (this.physicsWorld) {
      const colTaxi1 = new BoxCollider(3.8, -14.0, 1.3, 2.4);
      this.physicsWorld.addCollider(colTaxi1);
      this.colliders.push(colTaxi1);
    }

    // 2. Minibus Taxi 2 (Southbound)
    const taxi2 = buildMinibus(-3.8, 22.0, Math.PI, 'የእናት ምርቃት', 'መርካቶ', 'አ.አ 3 - 19284');
    fleetGroup.add(taxi2);
    if (this.physicsWorld) {
      const colTaxi2 = new BoxCollider(-3.8, 22.0, 1.3, 2.4);
      this.physicsWorld.addCollider(colTaxi2);
      this.colliders.push(colTaxi2);
    }

    // 3. Classic Blue & White Lada 2101 City Taxi
    const lada = buildLadaTaxi(3.6, -26.0, 0);
    fleetGroup.add(lada);

    // 4. Modern Silver Sedan (Toyota Corolla)
    const sedan = buildSedan(3.8, 10.0, 0.05);
    fleetGroup.add(sedan);
    if (this.physicsWorld) {
      const colSedan = new BoxCollider(3.8, 10.0, 1.2, 2.3);
      this.physicsWorld.addCollider(colSedan);
      this.colliders.push(colSedan);
    }

    // 5. Blue Ethiopian Bajaj
    const bajaj1 = buildBajaj(7.2, -3.0, -Math.PI / 4, this.taxiBlueMat);
    fleetGroup.add(bajaj1);

    // 6. Yellow/Green Ethiopian Bajaj
    const bajaj2 = buildBajaj(-7.2, 8.0, Math.PI / 3, this.flagYellowMat);
    fleetGroup.add(bajaj2);

    // 7. Isuzu Commercial Cargo Truck
    const truck = new THREE.Group();
    truck.position.set(-3.8, 0, 5.0);
    truck.rotation.y = Math.PI;

    const truckCab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 1.8), this.taxiWhiteMat);
    truckCab.position.y = 1.6;
    truckCab.castShadow = true;
    truck.add(truckCab);

    const tWind = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.8, 0.08), this.carGlassMat);
    tWind.position.set(0, 1.8, 0.92);
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

    const tWheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.32, 16);
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
      const colTruck = new BoxCollider(-3.8, 5.0, 1.4, 3.2);
      this.physicsWorld.addCollider(colTruck);
      this.colliders.push(colTruck);
    }

    this.group.add(fleetGroup);
  }

  /**
   * Continuous Multi-Storey Urban Ethiopian Street Buildings Framing the Avenue:
   * Continuous 3-storey commercial concrete/plaster buildings line both sides of the avenue:
   * Ground-floor shops facing the street with roll-up security shutters and vibrant Amharic signage,
   * upper floor residential balconies with metal railings,
   * and black cylindrical Roto water tanks (ሮቶ) & satellite dish antennas on every rooftop.
   */
  buildEthiopianStreetBuildings() {
    const buildingsGroup = new THREE.Group();

    const buildUrbanBuilding = (config) => {
      const bldg = new THREE.Group();
      bldg.position.set(config.x, 0, config.z);
      bldg.rotation.y = config.rotY || 0;

      const w = config.w || 7.5;
      const h = config.h || 8.4;
      const d = config.d || 7.0;

      // Concrete/plaster building shell
      const shellGeo = new THREE.BoxGeometry(w, h, d);
      const shell = new THREE.Mesh(shellGeo, this.buildingWallMat);
      shell.position.y = h / 2;
      shell.castShadow = true;
      shell.receiveShadow = true;
      bldg.add(shell);

      // Roll-up corrugated metal shop shutter (የሱቅ መዝጊያ ሻተር)
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 2.7, 0.12), this.shutterMat);
      shutter.position.set(0, 1.35, d / 2 + 0.08);
      bldg.add(shutter);

      // Large Amharic & English storefront fascia sign board
      const signMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(config.amharicSign, config.englishSign, config.signBg, config.signFg)
      });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 1.05, 0.14), signMat);
      sign.position.set(0, 3.3, d / 2 + 0.15);
      bldg.add(sign);

      // Storefront canvas/metal awning
      if (config.hasAwning) {
        const awningMat = config.awningMat || this.curbRedMat;
        const awning = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.15, 2.2), awningMat);
        awning.position.set(0, 2.85, d / 2 + 1.1);
        awning.rotation.x = 0.14;
        awning.castShadow = true;
        bldg.add(awning);
      }

      // Upper floor residential balconies with railings and windows
      for (let floor = 2; floor <= Math.floor(h / 2.8); floor++) {
        const floorY = floor * 2.7;
        if (floorY + 1.2 < h) {
          const bSlab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.18, 1.4), this.cobbleMat);
          bSlab.position.set(0, floorY, d / 2 + 0.7);
          bldg.add(bSlab);

          const bRail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.85, 0.08), this.balconyMat);
          bRail.position.set(0, floorY + 0.45, d / 2 + 1.35);
          bldg.add(bRail);

          const uWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.1), this.carGlassMat);
          uWin.position.set(0, floorY + 0.9, d / 2 + 0.06);
          bldg.add(uWin);
        }
      }

      // Roof parapet
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.65, d + 0.1), this.buildingWallMat);
      parapet.position.y = h + 0.32;
      bldg.add(parapet);

      // Rooftop black plastic Roto water tank (የጣሪያ ሮቶ የውሃ ታንከር)
      const rotoGroup = new THREE.Group();
      rotoGroup.position.set(-w * 0.25, h, -d * 0.2);

      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.5), this.balconyMat);
      stand.position.y = 0.35;
      rotoGroup.add(stand);

      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.5, 16), this.rotoMat);
      tank.position.y = 1.45;
      tank.castShadow = true;
      rotoGroup.add(tank);

      bldg.add(rotoGroup);

      // Rooftop satellite dish antenna
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

      // Aligned physics collider
      if (this.physicsWorld) {
        const halfX = config.rotY ? (d / 2 + 0.2) : (w / 2 + 0.2);
        const halfZ = config.rotY ? (w / 2 + 0.2) : (d / 2 + 0.2);
        const col = new BoxCollider(config.x, config.z, halfX, halfZ);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }

      return bldg;
    };

    // WEST STREET BLOCK (x: -14.0, facing East towards street: rotY = Math.PI / 2)
    const westRot = Math.PI / 2;

    const westBuildings = [
      { z: -80.0, amh: 'ቶታል ነዳጅ ማደያ', eng: 'TOTAL ENERGIES STATION', bg: '#dc2626', fg: '#ffffff', h: 8.5 },
      { z: -64.0, amh: 'የኢትዮጵያ ንግድ ባንክ', eng: 'COMMERCIAL BANK OF ETHIOPIA', bg: '#6b21a8', fg: '#fef08a', h: 10.2 },
      { z: -48.0, amh: 'ሱፐር ማርኬት', eng: 'CITY HYPER MARKET', bg: '#0369a1', fg: '#ffffff', h: 8.4 },
      { z: -32.0, amh: 'ቴሌብር ኪዮስክ', eng: 'TELEBIRR & MINI-MARKET', bg: '#0284c7', fg: '#ffffff', h: 8.2 },
      { z: -16.0, amh: 'ስጋ ቤት', eng: 'SIGA BET • BUTCHERY', bg: '#991b1b', fg: '#ffffff', h: 8.0 },
      { z: 0.0, amh: 'ቡና ቤት', eng: 'TRADITIONAL BUNNA BET', bg: '#78350f', fg: '#fef08a', h: 8.4 },
      { z: 16.0, amh: 'አዋሽ ባንክ', eng: 'AWASH BANK • PIASSA BRANCH', bg: '#0369a1', fg: '#f97316', h: 9.8 },
      { z: 32.0, amh: 'ጁስ ቤት', eng: 'SPECIAL SPRIS JUICE BET', bg: '#15803d', fg: '#fef08a', h: 8.0 },
      { z: 48.0, amh: 'አንበሳ ፋርማሲ', eng: 'LION COMMUNITY PHARMACY', bg: '#059669', fg: '#ffffff', h: 8.2 },
      { z: 64.0, amh: 'ፋሲል ሆቴል', eng: 'FASILIDES HOTEL & SUITES', bg: '#b45309', fg: '#fef3c7', h: 10.5 }
    ];

    westBuildings.forEach(b => {
      buildingsGroup.add(buildUrbanBuilding({
        x: -14.0, z: b.z, w: 7.2, h: b.h, d: 7.0, rotY: westRot,
        amharicSign: b.amh, englishSign: b.eng, signBg: b.bg, signFg: b.fg,
        hasAwning: true
      }));
    });

    // EAST STREET BLOCK (x: 14.0, facing West towards street: rotY = -Math.PI / 2)
    const eastRot = -Math.PI / 2;

    const eastBuildings = [
      { z: -80.0, amh: 'የንግድ ማዕከል', eng: 'GONDAR TRADE CENTER', bg: '#1e3a8a', fg: '#fbbf24', h: 10.4 },
      { z: -64.0, amh: 'ዳሽን ባንክ', eng: 'DASHEN BANK • ALWAYS AHEAD', bg: '#1e3a8a', fg: '#fbbf24', h: 9.6 },
      { z: -48.0, amh: 'የሀበሻ ባህል ልብስ', eng: 'HABESHA CULTURAL DRESS', bg: '#15803d', fg: '#fef08a', h: 8.4 },
      { z: -32.0, amh: 'አንበሳ የከተማ አውቶቡስ', eng: 'ANBESSA CITY BUS TERMINAL', bg: '#b91c1c', fg: '#ffffff', h: 8.2 },
      { z: -16.0, amh: 'የዕደ ጥበብና መሶብ', eng: 'TRADITIONAL MESOB & CRAFTS', bg: '#b45309', fg: '#fef3c7', h: 8.2 },
      { z: 0.0, amh: 'ባህላዊ የምግብ አዳራሽ', eng: 'SPECIAL KITFO & GOURMET', bg: '#991b1b', fg: '#ffffff', h: 8.4 },
      { z: 16.0, amh: 'ዳቦና ኬክ ቤት', eng: 'FRESH PASTRY & BAKERY', bg: '#ea580c', fg: '#ffffff', h: 8.0 },
      { z: 32.0, amh: 'ንብ ባንክ', eng: 'NIB INTERNATIONAL BANK', bg: '#0284c7', fg: '#ffffff', h: 9.5 },
      { z: 48.0, amh: 'ማተሚያ ቤት', eng: 'STATIONERY & DIGITAL PRINTING', bg: '#475569', fg: '#ffffff', h: 8.0 },
      { z: 64.0, amh: 'የቡና ላኪዎች ክለብ', eng: 'COFFEE EXPORTERS LOUNGE', bg: '#78350f', fg: '#fef08a', h: 9.8 }
    ];

    eastBuildings.forEach(b => {
      buildingsGroup.add(buildUrbanBuilding({
        x: 14.0, z: b.z, w: 7.2, h: b.h, d: 7.0, rotY: eastRot,
        amharicSign: b.amh, englishSign: b.eng, signBg: b.bg, signFg: b.fg,
        hasAwning: true
      }));
    });

    this.group.add(buildingsGroup);
  }

  /**
   * Ethiopian Tricolors, Utility Power Poles, and Amber Street Lamps
   */
  buildEthiopianFlagsAndStreetLights() {
    const decGroup = new THREE.Group();

    // 1. Tall Flagpoles Flying Ethiopian Tricolor
    const flagpolePositions = [
      { x: -5.7, z: -30.0 },
      { x: 5.7, z: -30.0 },
      { x: -5.7, z: 2.0 },
      { x: 5.7, z: 2.0 }
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

    // 2. Concrete Utility Power Poles with Cylindrical Transformers
    const polePositions = [
      { x: -5.7, z: -50.0 },
      { x: -5.7, z: -20.0 },
      { x: -5.7, z: 10.0 },
      { x: -5.7, z: 40.0 }
    ];
    polePositions.forEach(pp => {
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9.2, 8), this.balconyMat);
      uPole.position.set(pp.x, 4.6, pp.z);
      uPole.castShadow = true;
      decGroup.add(uPole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 2.2), this.balconyMat);
      arm.position.set(pp.x, 8.6, pp.z);
      decGroup.add(arm);

      const trans = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.75, 10), this.shutterMat);
      trans.position.set(pp.x, 7.8, pp.z + 0.35);
      decGroup.add(trans);

      [-0.8, 0, 0.8].forEach(iz => {
        const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 6), this.parchmentMat);
        ins.position.set(pp.x, 8.75, pp.z + iz);
        decGroup.add(ins);
      });
    });

    // 3. Ornate Street Lamps with Warm Amber Illumination
    const lampPositions = [
      { x: -5.6, z: -60.0 }, { x: 5.6, z: -60.0 },
      { x: -5.6, z: -30.0 }, { x: 5.6, z: -30.0 },
      { x: -5.6, z: 0.0 },   { x: 5.6, z: 0.0 },
      { x: -5.6, z: 30.0 },  { x: 5.6, z: 30.0 },
      { x: -5.6, z: 60.0 },  { x: 5.6, z: 60.0 }
    ];
    lampPositions.forEach(lp => {
      const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.8, 8), this.tireMat);
      lampPost.position.set(lp.x, 2.4, lp.z);
      lampPost.castShadow = true;
      decGroup.add(lampPost);

      const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), this.turnSignalMat);
      lantern.position.set(lp.x, 4.9, lp.z);
      decGroup.add(lantern);

      const lampLight = new THREE.PointLight(0xf59e0b, 0.8, 12);
      lampLight.position.set(lp.x, 4.9, lp.z);
      decGroup.add(lampLight);
    });

    this.group.add(decGroup);
  }

  /**
   * Sidewalk Coffee Ceremony Terrace outside Bunna Bet:
   * Authentic cultural arrangement: Aromatic green grass carpet (ቀጤማ),
   * low Rekebot wooden tray with porcelain Cini cups, smoking clay Jebena,
   * glowing incense burner (ዕጣን), and carved wooden stools for customers.
   */
  buildEthiopianBazaarAndCoffeeCeremony() {
    const ceremonyGroup = new THREE.Group();
    ceremonyGroup.position.set(-8.8, 0.22, 0.0);

    // 1. Fresh green grass carpet strewn on the sidewalk (ቀጤማ • Qetema)
    const qetema = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.03, 16), this.qetemaMat);
    qetema.position.set(0, 0.02, 0);
    qetema.receiveShadow = true;
    ceremonyGroup.add(qetema);

    // 2. Low wooden coffee table (ረከቦት • Rekebot)
    const rekebot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.85), this.timberMat);
    rekebot.position.set(0, 0.18, 0);
    rekebot.castShadow = true;
    ceremonyGroup.add(rekebot);

    // Porcelain coffee cups (ሲኒ • Cini)
    const ciniMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const cini = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.06, 8), ciniMat);
        cini.position.set(-0.35 + col * 0.35, 0.36, -0.15 + row * 0.3);
        ceremonyGroup.add(cini);
      }
    }

    // 3. Authentic Black Clay Coffee Pot (ጀበና • Jebena)
    const jebenaGroup = new THREE.Group();
    jebenaGroup.position.set(0.55, 0.06, 0.35);

    const jebenaBody = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), this.clayMat);
    jebenaBody.position.y = 0.22;
    jebenaBody.castShadow = true;
    jebenaGroup.add(jebenaBody);

    const jebenaNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.35, 10), this.clayMat);
    jebenaNeck.position.y = 0.52;
    jebenaGroup.add(jebenaNeck);

    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.2, 8), this.clayMat);
    spout.position.set(0.15, 0.32, 0);
    spout.rotation.z = -Math.PI / 4;
    jebenaGroup.add(spout);

    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 12, Math.PI), this.clayMat);
    handle.position.set(-0.15, 0.35, 0);
    handle.rotation.z = Math.PI / 2;
    jebenaGroup.add(handle);

    ceremonyGroup.add(jebenaGroup);

    // 4. Frankincense Incense Burner (ዕጣን ማቡኸር) with warm glowing embers
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.22, 8), this.clayMat);
    burner.position.set(-0.65, 0.12, 0.35);
    ceremonyGroup.add(burner);

    const emberLight = new THREE.PointLight(0xf59e0b, 1.2, 3.5);
    emberLight.position.set(-0.65, 0.28, 0.35);
    ceremonyGroup.add(emberLight);

    // 5. Traditional carved wooden stools (በርጩማ • Berchuma)
    const stoolMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    [
      { x: -1.2, z: -0.8 }, { x: -0.4, z: -1.2 }, { x: 0.8, z: -1.0 }
    ].forEach(sp => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 10), stoolMat);
      stool.position.set(sp.x, 0.2, sp.z);
      ceremonyGroup.add(stool);
    });

    this.group.add(ceremonyGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(-8.8, 0.0, 2.2);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * The Azmari Minstrel Station (የአዝማሪ ጣቢያ)
   * Traditional Ethiopian musical instruments displayed on a carved wooden platform outside the Cultural Gallery:
   * Masenqo (single-string lute), Krar (lyre), and Kebero ceremonial drum.
   */
  buildAzmariMusicStation() {
    const musicGroup = new THREE.Group();
    musicGroup.position.set(8.8, 0.22, -16.0);

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.22, 14), this.timberMat);
    dais.position.y = 0.11;
    dais.receiveShadow = true;
    musicGroup.add(dais);

    // 1. Single-String Lute (ማሲንቆ • Masenqo)
    const masenqoGroup = new THREE.Group();
    masenqoGroup.position.set(-0.5, 0.22, 0.2);
    masenqoGroup.rotation.y = 0.4;

    const boxGeo = new THREE.BoxGeometry(0.32, 0.32, 0.16);
    boxGeo.rotateZ(Math.PI / 4);
    const boxMesh = new THREE.Mesh(boxGeo, this.parchmentMat);
    boxMesh.position.y = 0.38;
    boxMesh.castShadow = true;
    masenqoGroup.add(boxMesh);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.85, 8), this.timberMat);
    neck.position.y = 0.8;
    masenqoGroup.add(neck);

    const peg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), this.timberMat);
    peg.position.y = 1.18;
    masenqoGroup.add(peg);

    const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), this.timberMat);
    bow.rotation.z = Math.PI / 3;
    bow.position.set(0.2, 0.45, 0.1);
    masenqoGroup.add(bow);

    musicGroup.add(masenqoGroup);

    // 2. Ethiopian Lyre (ክራር • Krar)
    const krarGroup = new THREE.Group();
    krarGroup.position.set(0.5, 0.22, 0.1);
    krarGroup.rotation.y = -0.3;

    const kBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.14, 12), this.timberMat);
    kBowl.position.y = 0.15;
    krarGroup.add(kBowl);

    [-0.2, 0.2].forEach(ax => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 6), this.timberMat);
      arm.position.set(ax, 0.45, 0);
      krarGroup.add(arm);
    });

    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.46, 6), this.timberMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 0.75, 0);
    krarGroup.add(crossbar);

    musicGroup.add(krarGroup);

    // 3. Double-Headed Drum (ከበሮ • Kebero)
    const kebero = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.65, 12), this.timberMat);
    kebero.rotation.z = Math.PI / 6;
    kebero.position.set(0, 0.4, -0.6);
    musicGroup.add(kebero);

    this.group.add(musicGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(8.8, -16.0, 2.2);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * Distant Highway Portal Gantry Signs:
   * Positioned far at the distant boundaries of the 220m avenue (z: -105.0 and z: +105.0),
   * preserving an open, long, uninterrupted view of the street ahead!
   */
  buildPassagePortals() {
    const portals = [
      {
        z: -105.0,
        amharic: 'የጎንደር ከተማ መውጫ ➔ ወደ አክሱም',
        english: 'GONDAR HIGHWAY EXIT ➔ TO AXUM MONUMENT'
      },
      {
        z: 105.0,
        amharic: 'ወደ ስሜን ተራሮች አውራ ጎዳና',
        english: 'SIMIEN FREEWAY ➔ TO MOUNTAIN PASS'
      }
    ];

    portals.forEach(p => {
      const gantry = new THREE.Group();
      gantry.position.set(0, 0, p.z);

      [-5.8, 5.8].forEach(cx => {
        const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 6.4, 8), this.balconyMat);
        colMesh.position.set(cx, 3.2, 0);
        gantry.add(colMesh);
      });

      const truss = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.4, 0.4), this.balconyMat);
      truss.position.set(0, 6.0, 0);
      gantry.add(truss);

      const signMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(p.amharic, p.english, '#15803d', '#ffffff')
      });
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.4, 0.1), signMat);
      signBoard.position.set(0, 5.2, 0);
      gantry.add(signBoard);

      this.group.add(gantry);
    });
  }

  update(deltaTime) {
    // Stage update hook
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
