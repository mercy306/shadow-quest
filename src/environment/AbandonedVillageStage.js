import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { BoxCollider, CircleCollider } from '../physics/Colliders.js';

/**
 * Level 1 Playable Environment: Harar Jugol (ሓረር ጁጎል) - The Historic Walled City
 * UNESCO World Heritage site and 4th holy city of Islam, meticulously recreated:
 * - Completely FLAT urban city ground plane with asphalt avenue and cobblestone lanes
 * - The Ancient Fortified Jugol Wall (የጀጎል ግንብ) with battlements and watch posts
 * - Shoa Gate (ሸዋ በር / Asmadin Bari) - Grand western ceremonial gate with twin watchtowers & horseshoe archway
 * - Buda Gate (ቡዳ በር / Asum Bari) & The Famed Hyena Feeding Station (የሐረር ጅብ መመገቢያ) with 3D spotted hyenas & Hyena Man
 * - Jamia Mosque (አል-ጃሚዕ ታላቁ መስጊድ) - Historic white Grand Mosque with twin minarets and golden crescent finials
 * - Arthur Rimbaud Cultural Center & Museum (የአርተር ራምቦ ሙዚየም) - Indian-Harari timber manor with stained glass & carved balconies
 * - Ras Mekonnen Palace (የራስ መኮንን ቤተ-መንግሥት) - Historic palace with stone colonnades and grand imperial steps
 * - Gidir Magala Central Market (ግድር መጋላ) - Colorful canopied bazaar with Harari woven baskets, spices, and Harar coffee
 * - Traditional Harari Gegar Townhouses (የሐረሪ ባህል ቤቶች) in iconic Harari Indigo Blue, Terracotta, and Whitewash
 * - Authentic Harar Vehicle Fleet - The Bajaj Capital: Blue/White & Green/Yellow Bajaj auto-rickshaws, Lada taxi, & HiAce minibus
 * - Sidewalk Harar Coffee & Tea Ceremony terrace with frankincense burner and Qetema grass
 */
export class AbandonedVillageStage {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();
    this.colliders = [];
    this.animatedHyenas = [];
    this.animatedPedestrians = [];

    this.initMaterials();
    this.buildTerrain();
    this.buildRealisticHararAvenue();
    this.buildJugolFortifiedWalls();
    this.buildShoaGateAsmadinBari();
    this.buildBudaGateAndHyenaFeedingStation();
    this.buildJamiaGrandMosque();
    this.buildArthurRimbaudMuseum();
    this.buildRasMekonnenPalace();
    this.buildGidirMagalaCentralMarket();
    this.buildHarariStreetBuildings();
    this.buildOverheadTricolorBuntings();
    this.buildHararVehicleFleet();
    this.buildHararCoffeeAndTeaTerrace();
    this.buildHararPedestrians();
    this.buildAzmariAndHarariMusicStation();
    this.buildCityStreetFurnitureAndLights();
    this.buildDistantHighwayPortals();
    this.buildAtmosphericSunlightMotes();

    this.scene.add(this.group);
  }

  initMaterials() {
    this.stoneTex = TextureGenerator.createStoneTexture(512);
    this.woodTex = TextureGenerator.createWoodTexture(512);
    this.roadTex = TextureGenerator.createAsphaltRoadTexture(1024, 2048);
    this.sidewalkTex = TextureGenerator.createSidewalkTileTexture(512);

    // High-Resolution Tangent-Space PBR Normal Maps (gives surfaces real microscopic 3D depth)
    this.asphaltNormalTex = TextureGenerator.createAsphaltNormalMap(512);
    this.cobbleNormalTex = TextureGenerator.createCobblestoneNormalMap(512);
    this.hararPlasterNormalTex = TextureGenerator.createHararPlasterNormalMap(512);

    // Soft Contact Shadow Decal Material for grounding objects firmly to pavement
    this.contactShadowTex = TextureGenerator.createContactShadowTexture(256);
    this.contactShadowMat = new THREE.MeshBasicMaterial({
      map: this.contactShadowTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    });

    // Dedicated Harari Procedural Textures
    this.hararPlasterBlueTex = TextureGenerator.createHararPlasterTexture('#1d4ed8', '#1e40af', 512);
    this.hararPlasterLightBlueTex = TextureGenerator.createHararPlasterTexture('#38bdf8', '#0284c7', 512);
    this.hararPlasterTerracottaTex = TextureGenerator.createHararPlasterTexture('#c2410c', '#9a3412', 512);
    this.hararPlasterWhiteTex = TextureGenerator.createHararPlasterTexture('#f8fafc', '#e2e8f0', 512);
    this.hararCobbleTex = TextureGenerator.createHararCobblestoneTexture(512);
    this.hararDoorTex = TextureGenerator.createHararCarvedDoorTexture(512);
    this.hararBasketTex = TextureGenerator.createHararWovenBasketTexture(256);
    this.hararAwningTexRed = TextureGenerator.createHararStripedAwningTexture('#dc2626', '#fef08a', 256);
    this.hararAwningTexGreen = TextureGenerator.createHararStripedAwningTexture('#15803d', '#fef08a', 256);

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: this.roadTex,
      normalMap: this.asphaltNormalTex,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.78,
      metalness: 0.12
    });

    this.sidewalkMat = new THREE.MeshStandardMaterial({
      map: this.sidewalkTex,
      roughness: 0.85,
      metalness: 0.05
    });

    this.cobbleMat = new THREE.MeshStandardMaterial({
      map: this.hararCobbleTex,
      normalMap: this.cobbleNormalTex,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughness: 0.82,
      metalness: 0.15
    });

    this.timberMat = new THREE.MeshStandardMaterial({
      map: this.woodTex,
      roughness: 0.78,
      metalness: 0.1
    });

    // Iconic Two-Tone Harari Plaster Textures (from real-world Harar Jugol documentary footage)
    this.hararTwoToneBlueTex = TextureGenerator.createHararTwoToneTexture('#1d4ed8', '#f8fafc', 0.38, 512);
    this.hararTwoToneCyanTex = TextureGenerator.createHararTwoToneTexture('#0284c7', '#f8fafc', 0.38, 512);
    this.hararTwoToneTerracottaTex = TextureGenerator.createHararTwoToneTexture('#c2410c', '#f8fafc', 0.38, 512);

    this.hararTwoToneBlueMat = new THREE.MeshStandardMaterial({
      map: this.hararTwoToneBlueTex,
      normalMap: this.hararPlasterNormalTex,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughness: 0.82,
      metalness: 0.06
    });
    this.hararTwoToneCyanMat = new THREE.MeshStandardMaterial({
      map: this.hararTwoToneCyanTex,
      normalMap: this.hararPlasterNormalTex,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughness: 0.80,
      metalness: 0.06
    });
    this.hararTwoToneTerracottaMat = new THREE.MeshStandardMaterial({
      map: this.hararTwoToneTerracottaTex,
      normalMap: this.hararPlasterNormalTex,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.85,
      metalness: 0.06
    });

    // Harar Jugol Architectural Stucco Colors with Realistic Lime Plaster Texturing
    this.hararBlueMat = new THREE.MeshStandardMaterial({
      map: this.hararPlasterBlueTex,
      roughness: 0.88,
      metalness: 0.05
    });

    this.hararLightBlueMat = new THREE.MeshStandardMaterial({
      map: this.hararPlasterLightBlueTex,
      roughness: 0.85,
      metalness: 0.05
    });

    this.hararTerracottaMat = new THREE.MeshStandardMaterial({
      map: this.hararPlasterTerracottaTex,
      roughness: 0.9,
      metalness: 0.05
    });

    this.hararWhiteMat = new THREE.MeshStandardMaterial({
      map: this.hararPlasterWhiteTex,
      roughness: 0.82,
      metalness: 0.04
    });

    this.jugolStoneMat = new THREE.MeshStandardMaterial({
      map: this.stoneTex,
      color: 0x8b857c, // Historic volcanic basalt & lime mortar of the 16th-century Jugol Wall
      roughness: 0.94,
      metalness: 0.08
    });

    this.hararDoorMat = new THREE.MeshStandardMaterial({
      map: this.hararDoorTex,
      roughness: 0.75,
      metalness: 0.15
    });

    this.hararBasketMat = new THREE.MeshStandardMaterial({
      map: this.hararBasketTex,
      roughness: 0.85,
      metalness: 0.05
    });

    this.hararAwningMatRed = new THREE.MeshStandardMaterial({
      map: this.hararAwningTexRed,
      roughness: 0.75,
      metalness: 0.02
    });

    this.hararAwningMatGreen = new THREE.MeshStandardMaterial({
      map: this.hararAwningTexGreen,
      roughness: 0.75,
      metalness: 0.02
    });

    this.bougainvilleaFlowerMat = new THREE.MeshStandardMaterial({
      color: 0xdb2777, // Vibrant magenta/pink Harari Bougainvillea
      roughness: 0.55,
      metalness: 0.02
    });

    this.bougainvilleaLeafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.7,
      metalness: 0.02
    });

    this.khatLeafMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a, // Fresh Harar Khat / Chat leaves
      roughness: 0.55,
      metalness: 0.04
    });

    this.spiceBerbereMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Rich red Ethiopian Berbere
      roughness: 0.95
    });

    this.spiceTurmericMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Golden Turmeric (እርድ)
      roughness: 0.95
    });

    this.spiceCardamomMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f, // Green Cardamom (ኮረሪማ)
      roughness: 0.95
    });

    this.coffeeBeansMat = new THREE.MeshStandardMaterial({
      color: 0x271406, // Roasted dark Harar Longberry Mocha beans
      roughness: 0.85
    });

    this.islamicGreenMat = new THREE.MeshStandardMaterial({
      color: 0x047857, // Sacred Islamic emerald green of minaret domes & arches
      roughness: 0.5,
      metalness: 0.25
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25
    });

    this.clayMat = new THREE.MeshStandardMaterial({
      color: 0x271e1b,
      roughness: 0.82,
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

    // Automotive & City Livery
    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.96,
      roughness: 0.08
    });

    this.headlightBulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });

    this.turnSignalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });

    this.carGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.82
    });

    // Harar Bajaj & Vehicle Materials with High-End Automotive Metallic Clearcoat
    this.bajajBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.16, metalness: 0.72 });
    this.bajajGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.16, metalness: 0.72 });
    this.bajajYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.20, metalness: 0.65 });
    this.taxiBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.14, metalness: 0.78 });
    this.taxiWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.60 });
    this.ladaBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.14, metalness: 0.75 });
    this.truckGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    this.burlapMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.95 });
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.92 });
    this.curbWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
    this.curbRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });
    this.kioskMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, metalness: 0.3 });
    this.rotoMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, metalness: 0.1 });
    this.shutterMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.55 });
    this.balconyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });

    // Hyena Spotted Coat Material
    this.hyenaBodyMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04, // Tawny golden-tan coat
      roughness: 0.92,
      metalness: 0.02
    });
    this.hyenaSpotMat = new THREE.MeshStandardMaterial({
      color: 0x451a03, // Dark brown spots
      roughness: 0.95
    });

    // Harari Woven Basket (Mesob / Garagar) Vibrant Materials
    this.basketRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });
    this.basketGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
    this.basketPurpleMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.8 });

    // Traffic Signal Materials
    this.trafficRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.8 });
    this.trafficYellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 });
    this.trafficGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });

    // Ethiopian Tricolor
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
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(amharic, 256, 52);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(english, 256, 96);
    return new THREE.CanvasTexture(canvas);
  }

  createContactShadow(width, length, opacity = 0.8) {
    const geo = new THREE.PlaneGeometry(width, length);
    geo.rotateX(-Math.PI / 2);
    const mat = this.contactShadowMat.clone();
    mat.opacity = opacity;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.035;
    return mesh;
  }

  buildTerrain() {
    // Vast, realistic urban city ground plane with warm Ethiopian highland earth (500m x 500m)
    const geo = new THREE.PlaneGeometry(500, 500, 1, 1);
    geo.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e, // Warm Ethiopian highland terracotta & red-brown earth
      roughness: 0.95,
      metalness: 0.02
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
   * Main Avenue of Harar City:
   * 220-meter long dual-lane asphalt street with yellow dashed centerline, zebra crossings,
   * elevated concrete sidewalks, red-white curbs, and realistic leafy shade trees.
   */
  buildRealisticHararAvenue() {
    const streetGroup = new THREE.Group();
    const roadLength = 220.0;
    const roadWidth = 11.2;

    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    roadGeo.rotateX(-Math.PI / 2);
    this.roadTex.wrapS = THREE.RepeatWrapping;
    this.roadTex.wrapT = THREE.RepeatWrapping;
    this.roadTex.repeat.set(1, 3);

    const roadMesh = new THREE.Mesh(roadGeo, this.asphaltMat);
    roadMesh.position.set(0, 0.02, 0);
    roadMesh.receiveShadow = true;
    streetGroup.add(roadMesh);

    // Elevated Concrete Sidewalks
    [-8.3, 8.3].forEach(sideX => {
      const walkGeo = new THREE.BoxGeometry(5.4, 0.22, roadLength);
      const walk = new THREE.Mesh(walkGeo, this.sidewalkMat);
      walk.position.set(sideX, 0.11, 0);
      walk.receiveShadow = true;
      streetGroup.add(walk);
    });

    // Alternating Red & White Curbs with drainage grates
    [-5.6, 5.6].forEach(xCur => {
      const curbCount = 96;
      const curbLen = roadLength / curbCount;
      for (let c = 0; c < curbCount; c++) {
        const curbZ = -roadLength / 2 + c * curbLen + curbLen / 2;
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

        // Stormwater Drainage Grates along gutter every 8 sections
        if (c % 8 === 0) {
          const grate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.72), this.tireMat);
          grate.position.set(xCur > 0 ? xCur - 0.38 : xCur + 0.38, 0.03, curbZ);
          streetGroup.add(grate);
        }
      }
    });

    // Central Harar Plaza Roundabout Ring at (0, 0, 0)
    const ringGeo = new THREE.RingGeometry(6.4, 6.8, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, this.curbWhiteMat);
    ringMesh.position.set(0, 0.12, 0);
    streetGroup.add(ringMesh);

    // Harar Street Name Signs
    [-5.7, 5.7].forEach((sx, sIdx) => {
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 8), this.tireMat);
      signPost.position.set(sx, 1.6, -16.0);
      streetGroup.add(signPost);

      const stSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture('አስማዲን ጎዳና • ሸዋ በር', 'ASMADIN AVENUE • SHOA GATE WAY', '#15803d', '#ffffff')
      });
      const stPlate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.38, 0.04), stSignMat);
      stPlate.position.set(sx + (sIdx === 0 ? 0.7 : -0.7), 2.9, -16.0);
      streetGroup.add(stPlate);
    });

    // Realistic Sidewalk Shade Trees (Branched Trunks & Tiered Dense Foliage)
    [-8.0, 8.0].forEach(px => {
      [-80.0, -60.0, -40.0, -20.0, 20.0, 40.0, 60.0, 80.0].forEach(pz => {
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), this.curbWhiteMat);
        box.position.set(px, 0.28, pz);
        streetGroup.add(box);

        const soil = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 1.15), this.clayMat);
        soil.position.set(px, 0.46, pz);
        streetGroup.add(soil);

        // Organic multi-segment tree trunk
        const trunkGroup = new THREE.Group();
        trunkGroup.position.set(px, 0.48, pz);

        const trunkMain = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 8), this.timberMat);
        trunkMain.position.y = 1.1;
        trunkGroup.add(trunkMain);

        // Tiered organic leaf canopy clusters
        const leafClumps = [
          { y: 2.2, r: 1.25, h: 0.9, ox: 0, oz: 0 },
          { y: 2.7, r: 1.45, h: 0.85, ox: 0.2, oz: -0.15 },
          { y: 3.2, r: 1.35, h: 0.8, ox: -0.15, oz: 0.2 },
          { y: 3.7, r: 0.95, h: 0.75, ox: 0.05, oz: 0.05 }
        ];

        leafClumps.forEach(lc => {
          const cMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(lc.r, 1), this.flagGreenMat);
          cMesh.position.set(lc.ox, lc.y, lc.oz);
          cMesh.scale.set(1.0, lc.h / lc.r, 1.0);
          cMesh.castShadow = true;
          trunkGroup.add(cMesh);
        });

        streetGroup.add(trunkGroup);
      });
    });

    this.group.add(streetGroup);
  }

  /**
   * The Ancient Fortified Jugol Wall (የጀጎል ግንብ):
   * 16th-century defensive stone wall built by Emir Nur ibn Mujahid, encircling the historic district.
   * Features stone battlements, defensive parapets, and arrow loops.
   */
  buildJugolFortifiedWalls() {
    const wallGroup = new THREE.Group();

    // Northern & Southern boundary fortress walls flanking the city access
    const wallConfigs = [
      { x: -28.0, z: 0, length: 180, rotY: 0 },
      { x: 28.0, z: 0, length: 180, rotY: 0 }
    ];

    wallConfigs.forEach(w => {
      const wallH = 4.6;
      const wallThick = 1.6;

      // Main stone wall body
      const wallGeo = new THREE.BoxGeometry(wallThick, wallH, w.length);
      const wallMesh = new THREE.Mesh(wallGeo, this.jugolStoneMat);
      wallMesh.position.set(w.x, wallH / 2, w.z);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallGroup.add(wallMesh);

      // Crenelated battlements on top of the Jugol Wall
      const crenelCount = Math.floor(w.length / 3.0);
      for (let i = 0; i < crenelCount; i++) {
        if (i % 2 === 0) {
          const crenelGeo = new THREE.BoxGeometry(wallThick + 0.1, 0.7, 1.5);
          const crenel = new THREE.Mesh(crenelGeo, this.jugolStoneMat);
          crenel.position.set(w.x, wallH + 0.35, -w.length / 2 + i * 3.0 + 1.5);
          crenel.castShadow = true;
          wallGroup.add(crenel);
        }
      }

      if (this.physicsWorld) {
        const col = new BoxCollider(w.x, w.z, wallThick / 2 + 0.2, w.length / 2);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }
    });

    this.group.add(wallGroup);
  }

  /**
   * Helper: Cascading Harari Bougainvillea floral cluster.
   * Drapes vibrant magenta/pink petals and emerald leaves over walls, gates, and balconies.
   */
  createBougainvilleaCluster(scale = 1.0) {
    const vineGroup = new THREE.Group();

    // Weathered vine stems
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.08 * scale, 1.8 * scale, 6), this.timberMat);
    stem.position.y = -0.9 * scale;
    vineGroup.add(stem);

    const leafGeo = new THREE.DodecahedronGeometry(0.32 * scale, 0);
    const flowerGeo = new THREE.DodecahedronGeometry(0.24 * scale, 0);

    const nodes = [
      { x: 0, y: -0.2 * scale, z: 0.1 * scale, s: 1.0 },
      { x: 0.22 * scale, y: -0.55 * scale, z: 0.14 * scale, s: 0.9 },
      { x: -0.18 * scale, y: -0.85 * scale, z: 0.12 * scale, s: 0.85 },
      { x: 0.12 * scale, y: -1.25 * scale, z: 0.1 * scale, s: 0.75 },
      { x: -0.08 * scale, y: -1.55 * scale, z: 0.06 * scale, s: 0.65 }
    ];

    nodes.forEach(n => {
      const leaf = new THREE.Mesh(leafGeo, this.bougainvilleaLeafMat);
      leaf.position.set(n.x, n.y, n.z);
      leaf.scale.set(n.s, n.s * 0.85, n.s);
      vineGroup.add(leaf);

      const flower = new THREE.Mesh(flowerGeo, this.bougainvilleaFlowerMat);
      flower.position.set(n.x + 0.05 * scale, n.y + 0.03 * scale, n.z + 0.14 * scale);
      flower.scale.set(n.s * 0.9, n.s * 0.9, n.s * 0.9);
      vineGroup.add(flower);
    });

    return vineGroup;
  }

  /**
   * Shoa Gate (ሸዋ በር / Asmadin Bari):
   * The iconic main western ceremonial gate of Harar Jugol.
   * Features grand horseshoe archway, twin flanking semicircular watchtowers,
   * decorative Islamic battlements, ceremonial welcoming banner,
   * open carved wooden fortress gates, and cascading Bougainvillea.
   */
  buildShoaGateAsmadinBari() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -42.0); // Spans across the avenue

    // Twin defensive semicircular bastions flanking the avenue
    [-7.2, 7.2].forEach(tx => {
      const towerGeo = new THREE.CylinderGeometry(2.4, 2.6, 9.2, 16);
      const tower = new THREE.Mesh(towerGeo, this.hararWhiteMat);
      tower.position.set(tx, 4.6, 0);
      tower.castShadow = true;
      tower.receiveShadow = true;
      gateGroup.add(tower);

      // Upper stone cornice & flat defensive parapet
      const corniceGeo = new THREE.CylinderGeometry(2.7, 2.5, 0.4, 24);
      const cornice = new THREE.Mesh(corniceGeo, this.hararTerracottaMat);
      cornice.position.set(tx, 9.2 + 0.2, 0);
      gateGroup.add(cornice);

      // Upper parapet walkway
      const parapetWalkGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 24);
      const parapetWalk = new THREE.Mesh(parapetWalkGeo, this.jugolStoneMat);
      parapetWalk.position.set(tx, 9.4 + 0.1, 0);
      gateGroup.add(parapetWalk);

      // Authentic Harari stone battlements (crenelations) around tower rim
      const numMerlons = 8;
      for (let m = 0; m < numMerlons; m++) {
        const angle = (m / numMerlons) * Math.PI * 2;
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.4), this.hararWhiteMat);
        merlon.position.set(
          tx + Math.sin(angle) * 2.3,
          9.5 + 0.38,
          Math.cos(angle) * 2.3
        );
        merlon.rotation.y = angle;
        merlon.castShadow = true;
        merlon.receiveShadow = true;
        gateGroup.add(merlon);
      }

      // Traditional exposed timber beam ends ("monkey heads") beneath cornice
      for (let b = 0; b < 6; b++) {
        const bAngle = (b / 6) * Math.PI * 2;
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 8), this.timberMat);
        beam.rotation.x = Math.PI / 2;
        beam.rotation.z = bAngle;
        beam.position.set(
          tx + Math.sin(bAngle) * 2.55,
          9.0,
          Math.cos(bAngle) * 2.55
        );
        gateGroup.add(beam);
      }

      // Cascading Bougainvillea flowers draping down the tower
      const vine = this.createBougainvilleaCluster(1.4);
      vine.position.set(tx > 0 ? tx - 1.8 : tx + 1.8, 7.5, 1.5);
      gateGroup.add(vine);

      // Warm Guard Lanterns
      const lanternGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 8);
      const lantern = new THREE.Mesh(lanternGeo, this.headlightBulbMat);
      lantern.position.set(tx > 0 ? tx - 2.2 : tx + 2.2, 3.8, 2.2);
      gateGroup.add(lantern);

      const lanternLight = new THREE.PointLight(0xf59e0b, 0.9, 8);
      lanternLight.position.copy(lantern.position);
      gateGroup.add(lanternLight);

      if (this.physicsWorld) {
        const col = new CircleCollider(tx, -42.0, 2.7);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }
    });

    // Grand Archway Overhead Bridge
    const bridgeGeo = new THREE.BoxGeometry(12.0, 3.4, 3.2);
    const bridge = new THREE.Mesh(bridgeGeo, this.hararWhiteMat);
    bridge.position.set(0, 6.8, 0);
    bridge.castShadow = true;
    gateGroup.add(bridge);

    // Open Historic Carved Wooden Fortress Gates (የተከፈቱ የሸዋ በር የእንጨት በሮች)
    // Left leaf swung inward
    const leftGate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.8, 0.18), this.hararDoorMat);
    leftGate.position.set(-3.8, 2.4, 1.4);
    leftGate.rotation.y = Math.PI * 0.35;
    gateGroup.add(leftGate);

    // Right leaf swung inward
    const rightGate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.8, 0.18), this.hararDoorMat);
    rightGate.position.set(3.8, 2.4, 1.4);
    rightGate.rotation.y = -Math.PI * 0.35;
    gateGroup.add(rightGate);

    // Decorative Terracotta Horseshoe Arch Moldings
    const archBorder = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.45, 3.4), this.hararTerracottaMat);
    archBorder.position.set(0, 8.6, 0);
    gateGroup.add(archBorder);

    // Grand Shoa Gate Fascia Banner
    const gateSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('አስማዲን በሪ • ሸዋ በር', 'ASMADIN BARI • SHOA GATE OF HARAR JUGOL', '#15803d', '#ffffff')
    });
    const gateSign = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.5, 0.15), gateSignMat);
    gateSign.position.set(0, 6.8, 1.68);
    gateGroup.add(gateSign);

    this.group.add(gateGroup);
  }

  /**
   * Buda Gate (ቡዳ በር / Asum Bari) & The Famed Hyena Feeding Station:
   * Harar is internationally renowned for its friendly nocturnal hyena feeding tradition.
   * Situated outside the southern wall at (x: 18.0, z: -12.0):
   * Includes Buda Gate arch, the Harari Hyena Man (ጅብ መጋቢ) with a woven meat basket,
   * and 3 friendly spotted hyenas gathered around peacefully.
   */
  buildBudaGateAndHyenaFeedingStation() {
    const hyenaStation = new THREE.Group();
    hyenaStation.position.set(18.0, 0, -12.0);

    // 1. Buda Gate Arch
    const gatePillarGeo = new THREE.BoxGeometry(1.6, 5.4, 1.6);
    [-2.8, 2.8].forEach(px => {
      const p = new THREE.Mesh(gatePillarGeo, this.hararTerracottaMat);
      p.position.set(px, 2.7, 0);
      hyenaStation.add(p);
    });

    const gateArch = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.2, 1.6), this.hararTerracottaMat);
    gateArch.position.set(0, 5.8, 0);
    hyenaStation.add(gateArch);

    const signMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('ቡዳ በር • የጅብ መመገቢያ', 'BUDA GATE • HYENA FEEDING STATION', '#78350f', '#fef08a')
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.85, 0.1), signMat);
    sign.position.set(0, 5.8, 0.86);
    hyenaStation.add(sign);

    // 2. The Harari Hyena Man (የሐረር ጅብ መጋቢ)
    const feederGroup = new THREE.Group();
    feederGroup.position.set(0, 0, 4.0);

    // Low wooden stool
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.45, 12), this.timberMat);
    stool.position.y = 0.22;
    feederGroup.add(stool);

    // Harari Feeder figure in traditional white jellabiya & kofia cap
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.1, 10), this.hararWhiteMat);
    body.position.y = 0.95;
    feederGroup.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), this.clayMat);
    head.position.y = 1.62;
    feederGroup.add(head);

    // Traditional white kofia prayer cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 10), this.hararWhiteMat);
    cap.position.y = 1.76;
    feederGroup.add(cap);

    // Woven basket of raw meat strips
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.38, 12), this.burlapMat);
    basket.position.set(0.65, 0.2, 0.3);
    feederGroup.add(basket);

    // Feeding stick extended forward
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), this.timberMat);
    stick.rotation.x = Math.PI / 3;
    stick.position.set(0, 1.0, 0.55);
    feederGroup.add(stick);

    hyenaStation.add(feederGroup);

    // 3. Three 3D Spotted Hyenas (የሐረር ጅቦች • Crocuta crocuta)
    const hyenaConfigs = [
      { x: -1.6, z: 6.2, rotY: 0.35, isSitting: false },
      { x: 0.0, z: 7.2, rotY: 0.0, isSitting: true },
      { x: 1.8, z: 6.4, rotY: -0.4, isSitting: false }
    ];

    hyenaConfigs.forEach((hc, idx) => {
      const hyena = new THREE.Group();
      hyena.position.set(hc.x, 0, hc.z);
      hyena.rotation.y = hc.rotY;

      // Characteristic sloped powerful torso (high shoulders, sloping lower back)
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 1.25), this.hyenaBodyMat);
      torso.position.set(0, 0.72, 0);
      torso.rotation.x = -0.18; // Iconic sloped back of spotted hyenas
      hyena.add(torso);

      // Spots on flank
      [-0.29, 0.29].forEach(sx => {
        for (let s = -0.35; s <= 0.35; s += 0.25) {
          const spot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.12), this.hyenaSpotMat);
          spot.position.set(sx, 0.72 + (s * 0.2), s);
          hyena.add(spot);
        }
      });

      // Muscular neck and broad head
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.55), this.hyenaBodyMat);
      neck.position.set(0, 0.95, -0.6);
      neck.rotation.x = 0.25;
      hyena.add(neck);

      const headM = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.45), this.hyenaBodyMat);
      headM.position.set(0, 1.05, -0.92);
      hyena.add(headM);

      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.32), this.hyenaSpotMat);
      muzzle.position.set(0, 0.96, -1.22);
      hyena.add(muzzle);

      // Large rounded ears
      [-0.18, 0.18].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.04, 0.2, 8), this.hyenaSpotMat);
        ear.position.set(ex, 1.26, -0.85);
        ear.rotation.z = ex > 0 ? -0.2 : 0.2;
        hyena.add(ear);
      });

      // Four sturdy legs
      const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.65, 8);
      [
        { x: -0.22, z: -0.42, y: 0.33 },
        { x: 0.22, z: -0.42, y: 0.33 },
        { x: -0.2, z: 0.42, y: 0.28 },
        { x: 0.2, z: 0.42, y: 0.28 }
      ].forEach(lp => {
        const leg = new THREE.Mesh(legGeo, this.hyenaBodyMat);
        leg.position.set(lp.x, lp.y, lp.z);
        hyena.add(leg);
      });

      // Bushy tail
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.45, 6), this.hyenaSpotMat);
      tail.position.set(0, 0.65, 0.72);
      tail.rotation.x = -Math.PI / 4;
      hyena.add(tail);

      this.animatedHyenas.push(hyena);
      hyenaStation.add(hyena);
    });

    this.group.add(hyenaStation);

    if (this.physicsWorld) {
      const col = new CircleCollider(18.0, -12.0, 4.5);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * Jamia Mosque of Harar (አል-ጃሚዕ ታላቁ መስጊድ):
   * The 10th-century Grand Mosque of Harar, the spiritual heart of the city.
   * Features pristine whitewashed plaster facade, twin soaring minarets,
   * emerald-green domed spires, and golden Islamic crescents.
   */
  buildJamiaGrandMosque() {
    const mosqueGroup = new THREE.Group();
    mosqueGroup.position.set(-20.0, 0, 12.0); // Facing eastward towards the city avenue

    const w = 15.0;
    const h = 7.5;
    const d = 12.0;

    // Main prayer sanctuary hall
    const hallGeo = new THREE.BoxGeometry(w, h, d);
    const hall = new THREE.Mesh(hallGeo, this.hararWhiteMat);
    hall.position.y = h / 2;
    hall.castShadow = true;
    hall.receiveShadow = true;
    mosqueGroup.add(hall);

    // Decorative emerald green crenelated roof parapet
    const roofParapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.8, d + 0.4), this.islamicGreenMat);
    roofParapet.position.y = h + 0.4;
    mosqueGroup.add(roofParapet);

    // Central Emerald Dome
    const domeGeo = new THREE.SphereGeometry(3.2, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const centralDome = new THREE.Mesh(domeGeo, this.islamicGreenMat);
    centralDome.position.set(0, h + 0.4, 0);
    centralDome.castShadow = true;
    mosqueGroup.add(centralDome);

    const domeFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2), this.goldMat);
    domeFinial.position.set(0, h + 3.8, 0);
    mosqueGroup.add(domeFinial);

    // Twin Soaring Minarets (የመስጊዱ ኹለት ሚናሬቶች)
    [-w / 2 + 1.2, w / 2 - 1.2].forEach(mx => {
      const minaretH = 16.5;
      const minaretR = 1.35;

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(minaretR, minaretR * 1.12, minaretH, 16), this.hararWhiteMat);
      shaft.position.set(mx, minaretH / 2, d / 2 + 0.2);
      shaft.castShadow = true;
      mosqueGroup.add(shaft);

      // Muezzin Balcony (የሙአዚን በረንዳ)
      const balcony = new THREE.Mesh(new THREE.CylinderGeometry(minaretR * 1.35, minaretR * 1.2, 1.0, 16), this.islamicGreenMat);
      balcony.position.set(mx, minaretH - 1.5, d / 2 + 0.2);
      mosqueGroup.add(balcony);

      // Upper lantern turret
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(minaretR * 0.75, minaretR * 0.75, 2.4, 12), this.hararWhiteMat);
      turret.position.set(mx, minaretH + 1.2, d / 2 + 0.2);
      mosqueGroup.add(turret);

      // Green Dome Cap
      const cap = new THREE.Mesh(new THREE.ConeGeometry(minaretR * 0.9, 2.2, 12), this.islamicGreenMat);
      cap.position.set(mx, minaretH + 3.2, d / 2 + 0.2);
      mosqueGroup.add(cap);

      // Golden Crescent
      const cresc = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 6, 12, Math.PI * 1.5), this.goldMat);
      cresc.position.set(mx, minaretH + 4.5, d / 2 + 0.2);
      mosqueGroup.add(cresc);
    });

    // Grand Horseshoe Arched Main Portal
    const archMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.4 });
    const portal = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.5, 0.4), archMat);
    portal.position.set(0, 2.25, d / 2 + 0.1);
    mosqueGroup.add(portal);

    const mosqueSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('አል-ጃሚዕ ታላቁ መስጊድ', 'JAMIA GRAND MOSQUE OF HARAR', '#047857', '#ffffff')
    });
    const mosqueSign = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.1, 0.1), mosqueSignMat);
    mosqueSign.position.set(0, 5.2, d / 2 + 0.15);
    mosqueGroup.add(mosqueSign);

    this.group.add(mosqueGroup);

    if (this.physicsWorld) {
      const col = new BoxCollider(-20.0, 12.0, w / 2 + 0.5, d / 2 + 0.5);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * Arthur Rimbaud Cultural Center & Museum (የአርተር ራምቦ ሙዚየም):
   * Iconic 2-storey Indian-influenced merchant mansion where the famed French poet lived in Harar.
   * Built with carved timber verandahs, colorful stained-glass clerestory windows, and timber roofs.
   */
  buildArthurRimbaudMuseum() {
    const museumGroup = new THREE.Group();
    museumGroup.position.set(20.0, 0, 14.0);

    const w = 11.0;
    const h = 9.2;
    const d = 9.5;

    // Ground floor stone base
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, 4.2, d), this.hararTerracottaMat);
    base.position.y = 2.1;
    base.castShadow = true;
    museumGroup.add(base);

    // Upper timber floor with overhanging balconies
    const upper = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 4.4, d + 0.8), this.timberMat);
    upper.position.y = 6.4;
    upper.castShadow = true;
    museumGroup.add(upper);

    // Carved wood verandah railings
    const railing = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.9, d + 1.2), this.goldMat);
    railing.position.y = 4.8;
    museumGroup.add(railing);

    // Distinctive Rimbaud stained-glass windows (colorful clerestory lights)
    const glassColors = [0xef4444, 0x3b82f6, 0xeab308, 0x10b981];
    [-3.2, -1.0, 1.0, 3.2].forEach((wx, gIdx) => {
      const gMat = new THREE.MeshStandardMaterial({
        color: glassColors[gIdx % glassColors.length],
        emissive: glassColors[gIdx % glassColors.length],
        emissiveIntensity: 0.8,
        roughness: 0.1
      });
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.1), gMat);
      win.position.set(wx, 6.8, -d / 2 - 0.45);
      museumGroup.add(win);
    });

    // Pitched pyramid hipped roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.8, 3.4, 4), this.jugolStoneMat);
    roof.position.y = h + 1.7;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    museumGroup.add(roof);

    const signMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('የአርተር ራምቦ ሙዚየም', 'ARTHUR RIMBAUD CULTURAL CENTER', '#78350f', '#fef08a')
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.0, 0.1), signMat);
    sign.position.set(0, 3.2, -d / 2 - 0.08);
    museumGroup.add(sign);

    this.group.add(museumGroup);

    if (this.physicsWorld) {
      const col = new BoxCollider(20.0, 14.0, w / 2 + 0.6, d / 2 + 0.6);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * Ras Mekonnen Palace (የራስ መኮንን ቤተ-መንግሥት):
   * Historic palace of Governor Ras Mekonnen in Harar.
   * Built with imposing stone archways, grand steps, colonnades, and imperial balcony.
   */
  buildRasMekonnenPalace() {
    const palaceGroup = new THREE.Group();
    palaceGroup.position.set(-20.0, 0, -18.0);

    const w = 14.0;
    const h = 8.8;
    const d = 10.5;

    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.hararWhiteMat);
    mainBody.position.y = h / 2;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    palaceGroup.add(mainBody);

    // Colonnaded Front Verandah with Classical Arches
    [-4.8, -1.6, 1.6, 4.8].forEach(cx => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.2, 10), this.hararTerracottaMat);
      col.position.set(cx, 2.1, d / 2 + 1.2);
      palaceGroup.add(col);
    });

    const verandahRoof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.35, 2.6), this.hararTerracottaMat);
    verandahRoof.position.set(0, 4.3, d / 2 + 1.2);
    palaceGroup.add(verandahRoof);

    // Stately Grand Stone Entrance Steps
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(6.4 - s * 0.4, 0.25, 0.8), this.jugolStoneMat);
      step.position.set(0, s * 0.25 + 0.12, d / 2 + 2.2 - s * 0.4);
      palaceGroup.add(step);
    }

    const palaceSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('የራስ መኮንን ቤተ-መንግሥት', 'RAS MEKONNEN PALACE OF HARAR', '#1e3a8a', '#fbbf24')
    });
    const pSign = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.1, 0.1), palaceSignMat);
    pSign.position.set(0, 5.8, d / 2 + 0.1);
    palaceGroup.add(pSign);

    this.group.add(palaceGroup);

    if (this.physicsWorld) {
      const col = new BoxCollider(-20.0, -18.0, w / 2 + 0.5, d / 2 + 1.5);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * Gidir Magala Central Market (ግድር መጋላ):
   * The bustling central grand market square of Harar Jugol.
   * Features colorful market canopies, world-famous Harari woven baskets (*Garagar* & *Mesob*),
   * Harar coffee bean sacks, spice pyramids, and fresh khat bundles.
   */
  buildGidirMagalaCentralMarket() {
    const marketGroup = new THREE.Group();
    marketGroup.position.set(0, 0, 0); // At the central plaza roundabout

    // Market Plaza Centerpiece Monument: Harari Traditional Mesob Urn (የሐረሪ መሶብ)
    const mesobStand = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.6, 16), this.hararWhiteMat);
    mesobStand.position.y = 0.3;
    marketGroup.add(mesobStand);

    const mesobBody = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.85, 1.4, 16), this.basketRedMat);
    mesobBody.position.y = 1.3;
    marketGroup.add(mesobBody);

    const mesobLid = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.8, 16), this.basketGreenMat);
    mesobLid.position.y = 2.9;
    marketGroup.add(mesobLid);

    const mesobFinial = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), this.goldMat);
    mesobFinial.position.y = 3.9;
    marketGroup.add(mesobFinial);

    // Traditional Harari Market Stalls surrounding the central monument
    const stallConfigs = [
      { x: -5.5, z: -2.5, rotY: 0.35, isRedAwning: true, amharic: 'የሐረር ቅመማቅመም • SPICES' },
      { x: 5.5, z: -2.5, rotY: -0.35, isRedAwning: false, amharic: 'የሐረር ቡናና ጫት • COFFEE & KHAT' },
      { x: -5.5, z: 3.5, rotY: 0.75, isRedAwning: false, amharic: 'የሐረሪ ቅርጫቶች • WOVEN BASKETS' },
      { x: 5.5, z: 3.5, rotY: -0.75, isRedAwning: true, amharic: 'የሐረሪ ጨርቆች • TEXTILES' }
    ];

    stallConfigs.forEach(st => {
      const stall = new THREE.Group();
      stall.position.set(st.x, 0, st.z);
      stall.rotation.y = st.rotY;

      // Wooden market display table
      const table = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.75, 1.4), this.timberMat);
      table.position.y = 0.38;
      stall.add(table);

      // Striped fabric canopy awning overhead
      const awningMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.8), st.isRedAwning ? this.hararAwningMatRed : this.hararAwningMatGreen);
      awningMesh.position.set(0, 2.3, 0);
      awningMesh.rotation.x = 0.15;
      stall.add(awningMesh);

      // Four wooden canopy corner poles
      [[-1.6, -0.7], [1.6, -0.7], [-1.6, 0.7], [1.6, 0.7]].forEach(([px, pz]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), this.timberMat);
        pole.position.set(px, 1.1, pz);
        stall.add(pole);
      });

      // Hanging Woven Harari Baskets on the stall
      [-1.1, 0, 1.1].forEach((bx, bIdx) => {
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.08, 12), this.hararBasketMat);
        basket.rotation.x = Math.PI / 2;
        basket.position.set(bx, 1.9, 0.85);
        stall.add(basket);
      });

      // Tabletop Goods: Spices, Coffee, Khat
      if (st.amharic.includes('SPICES')) {
        // Conical spice pyramids: Red Berbere, Golden Turmeric, Green Cardamom
        const berbere = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 10), this.spiceBerbereMat);
        berbere.position.set(-0.85, 0.75 + 0.25, 0);
        stall.add(berbere);

        const turmeric = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.45, 10), this.spiceTurmericMat);
        turmeric.position.set(0, 0.75 + 0.22, 0);
        stall.add(turmeric);

        const cardamom = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.38, 10), this.spiceCardamomMat);
        cardamom.position.set(0.85, 0.75 + 0.19, 0);
        stall.add(cardamom);
      } else if (st.amharic.includes('COFFEE')) {
        // Open burlap sacks filled with roasted Harar Longberry Mocha coffee beans
        [-0.8, 0.8].forEach(sx => {
          const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.55, 10), this.burlapMat);
          sack.position.set(sx, 0.75 + 0.28, 0);
          stall.add(sack);

          const beans = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), this.coffeeBeansMat);
          beans.position.set(sx, 0.75 + 0.55, 0);
          stall.add(beans);
        });

        // Fresh green Khat / Chat bundles
        const khat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.6), this.khatLeafMat);
        khat.position.set(0, 0.75 + 0.12, 0);
        stall.add(khat);
      }

      marketGroup.add(stall);
    });

    const mSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('ግድር መጋላ • ማዕከላዊ ገበያ', 'GIDIR MAGALA • HARAR CENTRAL MARKET', '#15803d', '#fef08a')
    });
    const mSign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.75, 0.1), mSignMat);
    mSign.position.set(0, 1.2, 1.5);
    marketGroup.add(mSign);

    this.group.add(marketGroup);

    if (this.physicsWorld) {
      const col = new CircleCollider(0, 0, 3.2);
      this.physicsWorld.addCollider(col);
      this.colliders.push(col);
    }
  }

  /**
   * Continuous Multi-Storey Harari Street Buildings (Gegar / Gey Houses):
   * Lining both sides of the 220-meter avenue with vibrant Harari colors:
   * Brilliant Indigo Blue, Warm Desert Terracotta, and Whitewash.
   * Features roll-up security shutters, carved wooden Mashrabiya lattice balconies,
   * rooftop black Roto water tanks, and authentic Harar Amharic/English signs.
   */
  buildHarariStreetBuildings() {
    const buildingsGroup = new THREE.Group();

    const buildGegarHouse = (config) => {
      const bldg = new THREE.Group();
      bldg.position.set(config.x, 0, config.z);
      bldg.rotation.y = config.rotY || 0;

      const w = config.w || 7.2;
      const h = config.h || 8.4;
      const d = config.d || 7.0;

      // 1. Heavy Stone Base Plinth (Grounded 3D foundation along sidewalk)
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.35, 0.45, d + 0.35), this.cobbleMat);
      plinth.position.y = 0.225;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      bldg.add(plinth);

      // 2. Main Wall Plaster in signature two-tone or historic Harari plaster
      const shellGeo = new THREE.BoxGeometry(w, h, d);
      const shell = new THREE.Mesh(shellGeo, config.wallMat || this.hararBlueMat);
      shell.position.y = h / 2;
      shell.castShadow = true;
      shell.receiveShadow = true;
      bldg.add(shell);

      // 3. Horizontal Timber Stringcourse / Belt molding between ground & upper floors
      const stringCourse = new THREE.Mesh(new THREE.BoxGeometry(w + 0.22, 0.2, d + 0.22), this.timberMat);
      stringCourse.position.y = 3.65;
      stringCourse.castShadow = true;
      bldg.add(stringCourse);

      // 4. Ground Floor Commercial Frontage
      // Corrugated steel roll-up shop shutter
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, 2.7, 0.12), this.shutterMat);
      shutter.position.set(w * 0.18, 1.35, d / 2 + 0.08);
      bldg.add(shutter);

      // Shutter top housing hood & steel guides
      const shutterHood = new THREE.Mesh(new THREE.BoxGeometry(w * 0.48, 0.32, 0.26), this.timberMat);
      shutterHood.position.set(w * 0.18, 2.82, d / 2 + 0.15);
      shutterHood.castShadow = true;
      bldg.add(shutterHood);

      // Traditional Carved Harari Wooden Double Door
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.7, 0.14), this.hararDoorMat);
      door.position.set(-w * 0.24, 1.35, d / 2 + 0.1);
      bldg.add(door);

      // Heavy 3D Timber Doorframe Architrave & Stone Threshold
      const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.26), this.timberMat);
      doorLintel.position.set(-w * 0.24, 2.8, d / 2 + 0.16);
      doorLintel.castShadow = true;
      bldg.add(doorLintel);

      [-w * 0.24 - 0.88, -w * 0.24 + 0.88].forEach(jx => {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.7, 0.22), this.timberMat);
        jamb.position.set(jx, 1.35, d / 2 + 0.14);
        jamb.castShadow = true;
        bldg.add(jamb);
      });

      const doorStep = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.32), this.cobbleMat);
      doorStep.position.set(-w * 0.24, 0.07, d / 2 + 0.2);
      doorStep.castShadow = true;
      doorStep.receiveShadow = true;
      bldg.add(doorStep);

      // Storefront Signboard
      const signMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(config.amharicSign, config.englishSign, config.signBg, config.signFg)
      });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 1.05, 0.14), signMat);
      sign.position.set(0, 3.25, d / 2 + 0.16);
      bldg.add(sign);

      // Fabric / Metal Awning with diagonal support struts
      if (config.hasAwning) {
        const awningMat = config.awningMat || (config.hasStripedAwning ? this.hararAwningMatRed : this.hararAwningMatGreen);
        const awning = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.15, 2.2), awningMat);
        awning.position.set(0, 2.85, d / 2 + 1.1);
        awning.rotation.x = 0.14;
        awning.castShadow = true;
        bldg.add(awning);

        // Angled iron support struts connecting awning edge back to wall
        [-w * 0.4, w * 0.4].forEach(sx => {
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.85, 6), this.chromeMat);
          strut.rotation.x = Math.PI / 4.2;
          strut.position.set(sx, 2.2, d / 2 + 0.85);
          bldg.add(strut);
        });
      }

      // Traditional Harari Woven Wall Baskets on Upper Facade
      [-w * 0.3, w * 0.3].forEach((bx) => {
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 14), this.hararBasketMat);
        basket.rotation.x = Math.PI / 2;
        basket.position.set(bx, h - 1.4, d / 2 + 0.1);
        bldg.add(basket);
      });

      // Historic wooden ceiling rafter beams protruding beneath parapet (monkey-head timber beams)
      const rafterCount = 6;
      const rafterStep = (w - 1.2) / (rafterCount - 1);
      for (let r = 0; r < rafterCount; r++) {
        const rx = -w / 2 + 0.6 + r * rafterStep;
        const rafter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), this.timberMat);
        rafter.rotation.x = Math.PI / 2;
        rafter.position.set(rx, h - 0.25, d / 2 + 0.25);
        bldg.add(rafter);
      }

      // Cascading Bougainvillea flowers
      if (config.hasBougainvillea) {
        const vine = this.createBougainvilleaCluster(1.3);
        vine.position.set(w / 2 - 0.3, h - 1.5, d / 2 + 0.18);
        bldg.add(vine);
      }

      // 5. Upper Storeys with 3D Mashrabiya, Balconies, Timber Lintels, Projecting Sills, and Open Wooden Shutters
      for (let floor = 2; floor <= Math.floor(h / 2.8); floor++) {
        const floorY = floor * 2.7;
        if (floorY + 1.2 < h) {
          // Balcony slab
          const bSlab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.18, 1.4), this.cobbleMat);
          bSlab.position.set(0, floorY, d / 2 + 0.7);
          bSlab.castShadow = true;
          bldg.add(bSlab);

          // Wood lattice screen
          const bRail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.85, 0.08), this.timberMat);
          bRail.position.set(0, floorY + 0.45, d / 2 + 1.35);
          bRail.castShadow = true;
          bldg.add(bRail);

          // Heavy Protruding Timber Window Lintel above
          const wLintel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.28), this.timberMat);
          wLintel.position.set(0, floorY + 1.65, d / 2 + 0.14);
          wLintel.castShadow = true;
          bldg.add(wLintel);

          // Projecting Stone Window Sill below
          const wSill = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.26), this.cobbleMat);
          wSill.position.set(0, floorY + 0.2, d / 2 + 0.14);
          wSill.castShadow = true;
          bldg.add(wSill);

          // Open Wooden Window Shutters on Left & Right casting realistic shadows
          const leftShutter = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.3, 0.05), this.hararDoorMat);
          leftShutter.position.set(-1.15, floorY + 0.9, d / 2 + 0.12);
          leftShutter.rotation.y = -0.25;
          leftShutter.castShadow = true;
          bldg.add(leftShutter);

          const rightShutter = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.3, 0.05), this.hararDoorMat);
          rightShutter.position.set(1.15, floorY + 0.9, d / 2 + 0.12);
          rightShutter.rotation.y = 0.25;
          rightShutter.castShadow = true;
          bldg.add(rightShutter);

          // Recessed Window Glass
          const uWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.1), this.carGlassMat);
          uWin.position.set(0, floorY + 0.9, d / 2 + 0.06);
          bldg.add(uWin);
        }
      }

      // 6. Overhanging Corrugated Roof Eaves (Casts deep continuous shadow on top floor)
      const eaveCapping = new THREE.Mesh(new THREE.BoxGeometry(w + 0.42, 0.14, d + 0.42), this.shutterMat);
      eaveCapping.position.y = h + 0.07;
      eaveCapping.castShadow = true;
      bldg.add(eaveCapping);

      // Parapet & Rooftop ROTO tank
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.65, d + 0.1), config.wallMat || this.hararBlueMat);
      parapet.position.y = h + 0.4;
      bldg.add(parapet);

      const rotoGroup = new THREE.Group();
      rotoGroup.position.set(-w * 0.25, h + 0.1, -d * 0.2);
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.5), this.balconyMat);
      stand.position.y = 0.35;
      rotoGroup.add(stand);
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.5, 16), this.rotoMat);
      tank.position.y = 1.45;
      rotoGroup.add(tank);
      bldg.add(rotoGroup);

      // Rooftop Satellite Dish
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3), this.taxiWhiteMat);
      dish.rotation.x = Math.PI / 3;
      dish.position.set(w * 0.25, h + 1.0, d * 0.2);
      bldg.add(dish);

      // 7. Wall-mounted Electric Utility Meter & Conduit
      const meterBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.15), this.shutterMat);
      meterBox.position.set(w / 2 - 0.38, 1.8, d / 2 + 0.1);
      meterBox.castShadow = true;
      bldg.add(meterBox);

      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6), this.tireMat);
      conduit.position.set(w / 2 - 0.38, 0.9, d / 2 + 0.08);
      bldg.add(conduit);

      if (this.physicsWorld) {
        const halfX = config.rotY ? (d / 2 + 0.25) : (w / 2 + 0.25);
        const halfZ = config.rotY ? (w / 2 + 0.25) : (d / 2 + 0.25);
        const col = new BoxCollider(config.x, config.z, halfX, halfZ);
        this.physicsWorld.addCollider(col);
        this.colliders.push(col);
      }

      return bldg;
    };

    // WEST STREET BLOCK (x: -14.0, facing East towards street: rotY = Math.PI / 2)
    const westRot = Math.PI / 2;
    const westBuildings = [
      { z: -80.0, amh: 'የሐረር ቡና መፍጫ', eng: 'HARAR COFFEE ROASTERY', bg: '#78350f', fg: '#fef08a', h: 8.5, mat: this.hararTwoToneBlueMat },
      { z: -64.0, amh: 'የኢትዮጵያ ንግድ ባንክ', eng: 'CBE HARAR JUGOL BRANCH', bg: '#6b21a8', fg: '#fef08a', h: 10.2, mat: this.hararWhiteMat },
      { z: -48.0, amh: 'አል-አሚን ሻይና ሳምቡሳ', eng: 'AL-AMIN TEA & SAMBUSA CAFE', bg: '#047857', fg: '#ffffff', h: 8.4, mat: this.hararTwoToneTerracottaMat },
      { z: -32.0, amh: 'ቴሌብር ሐረር', eng: 'TELEBIRR HARAR JUGOL', bg: '#0284c7', fg: '#ffffff', h: 8.2, mat: this.hararTwoToneCyanMat },
      { z: -16.0, amh: 'የሐረሪ ባህል ቅርሶች', eng: 'HARARI CULTURAL BASKETS', bg: '#b45309', fg: '#fef3c7', h: 8.0, mat: this.hararTwoToneBlueMat },
      { z: 0.0, amh: 'አስመዲን ቡና ቤት', eng: 'ASMADIN TRADITIONAL BUNNA', bg: '#78350f', fg: '#fef08a', h: 8.4, mat: this.hararTwoToneCyanMat },
      { z: 16.0, amh: 'አዋሽ ባንክ ሸዋ በር', eng: 'AWASH BANK SHOA GATE', bg: '#0369a1', fg: '#f97316', h: 9.8, mat: this.hararWhiteMat },
      { z: 32.0, amh: 'የሐረር ፍራፍሬና ጫት', eng: 'HARAR FRESH PRODUCE', bg: '#15803d', fg: '#fef08a', h: 8.0, mat: this.hararTwoToneTerracottaMat },
      { z: 48.0, amh: 'ኤረር በር ፋርማሲ', eng: 'ERER GATE PHARMACY', bg: '#059669', fg: '#ffffff', h: 8.2, mat: this.hararTwoToneBlueMat },
      { z: 64.0, amh: 'ራስ መኮንን ሆቴል', eng: 'RAS MEKONNEN HOTEL', bg: '#b45309', fg: '#fef3c7', h: 10.5, mat: this.hararTwoToneCyanMat }
    ];

    westBuildings.forEach((b, idx) => {
      buildingsGroup.add(buildGegarHouse({
        x: -14.0, z: b.z, w: 7.2, h: b.h, d: 7.0, rotY: westRot,
        amharicSign: b.amh, englishSign: b.eng, signBg: b.bg, signFg: b.fg,
        wallMat: b.mat, hasAwning: true,
        hasBougainvillea: idx % 2 === 0,
        hasStripedAwning: idx % 3 === 0
      }));
    });

    // EAST STREET BLOCK (x: 14.0, facing West towards street: rotY = -Math.PI / 2)
    const eastRot = -Math.PI / 2;
    const eastBuildings = [
      { z: -80.0, amh: 'የሐረር የንግድ ማዕከል', eng: 'HARAR TRADE PLAZA', bg: '#1e3a8a', fg: '#fbbf24', h: 10.4, mat: this.hararWhiteMat },
      { z: -64.0, amh: 'ዳሽን ባንክ ሐረር', eng: 'DASHEN BANK HARAR', bg: '#1e3a8a', fg: '#fbbf24', h: 9.6, mat: this.hararBlueMat },
      { z: -48.0, amh: 'የሐረሪ ባህል ልብስ', eng: 'HARARI CULTURAL DRESS', bg: '#15803d', fg: '#fef08a', h: 8.4, mat: this.hararTerracottaMat },
      { z: -32.0, amh: 'የባጃጅና ታክሲ ማቆሚያ', eng: 'HARAR BAJAJ TERMINAL', bg: '#0284c7', fg: '#ffffff', h: 8.2, mat: this.hararBlueMat },
      { z: -16.0, amh: 'የሐረር ቅመማቅመም', eng: 'HARAR BERBERE & SPICES', bg: '#991b1b', fg: '#ffffff', h: 8.2, mat: this.hararTerracottaMat },
      { z: 0.0, amh: 'ግድር መጋላ መመገቢያ', eng: 'GIDIR MAGALA CUISINE', bg: '#991b1b', fg: '#ffffff', h: 8.4, mat: this.hararBlueMat },
      { z: 16.0, amh: 'ዳቦና ጣፋጭ ቤት', eng: 'HARARI PASTRY & SWEETS', bg: '#ea580c', fg: '#ffffff', h: 8.0, mat: this.hararWhiteMat },
      { z: 32.0, amh: 'ንብ ባንክ ሐረር', eng: 'NIB BANK HARAR JUGOL', bg: '#0284c7', fg: '#ffffff', h: 9.5, mat: this.hararBlueMat },
      { z: 48.0, amh: 'የእደ-ጥበብ ማዕከል', eng: 'HANDICRAFT & EMBROIDERY', bg: '#475569', fg: '#ffffff', h: 8.0, mat: this.hararTerracottaMat },
      { z: 64.0, amh: 'ጁጎል የእንግዳ ማረፊያ', eng: 'JUGOL HERITAGE LODGE', bg: '#78350f', fg: '#fef08a', h: 9.8, mat: this.hararBlueMat }
    ];

    eastBuildings.forEach((b, idx) => {
      buildingsGroup.add(buildGegarHouse({
        x: 14.0, z: b.z, w: 7.2, h: b.h, d: 7.0, rotY: eastRot,
        amharicSign: b.amh, englishSign: b.eng, signBg: b.bg, signFg: b.fg,
        wallMat: b.mat, hasAwning: true,
        hasBougainvillea: idx % 2 === 1,
        hasStripedAwning: idx % 2 === 0
      }));
    });

    this.group.add(buildingsGroup);
  }

  /**
   * Overhead Festive Ethiopian Tricolor Flag Buntings (የኢትዮጵያ ሰንደቅ-ዓላማ ጌጦች):
   * Fluttering green, yellow, and red pennant garlands strung between buildings across the street.
   */
  buildOverheadTricolorBuntings() {
    const buntingGroup = new THREE.Group();
    const garlandZs = [-60.0, -35.0, -10.0, 15.0, 40.0, 65.0];

    garlandZs.forEach(gz => {
      // Suspension cable across the street (x: -10 to +10 at y: 6.8)
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 20.4, 4), this.balconyMat);
      cable.rotation.z = Math.PI / 2;
      cable.position.set(0, 6.8, gz);
      buntingGroup.add(cable);

      // Pennant flags hanging along cable
      const pennantCount = 14;
      const pennantStep = 18.0 / (pennantCount - 1);
      const flagColors = [this.flagGreenMat, this.flagYellowMat, this.flagRedMat];

      for (let p = 0; p < pennantCount; p++) {
        const px = -9.0 + p * pennantStep;
        // Natural catenary sag
        const sag = Math.sin((p / (pennantCount - 1)) * Math.PI) * 0.45;
        const py = 6.8 - sag;

        // Inverted triangular pennant
        const flagGeo = new THREE.ConeGeometry(0.28, 0.52, 3);
        flagGeo.rotateX(Math.PI);
        const flagMesh = new THREE.Mesh(flagGeo, flagColors[p % flagColors.length]);
        flagMesh.position.set(px, py - 0.26, gz);
        buntingGroup.add(flagMesh);
      }
    });

    this.group.add(buntingGroup);
  }

  /**
   * Authentic Harar Vehicle Fleet - The Bajaj Capital of Ethiopia:
   * Real-world detailed Bajaj auto-rickshaws, classic blue & white Lada 2101 taxi,
   * iconic Toyota HiAce minibus with roof luggage, and Isuzu coffee truck.
   */
  buildHararVehicleFleet() {
    const fleetGroup = new THREE.Group();

    // Helper: Build High-Detail Realistic Harar Bajaj Auto-Rickshaw
    const buildHararBajaj = (x, z, rotY, bodyMat, routeTag, plateNum) => {
      const bajaj = new THREE.Group();
      bajaj.position.set(x, 0, z);
      bajaj.rotation.y = rotY;

      // 1. Lower chassis frame & aerodynamic sloped front cowling
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.65, 2.3), bodyMat);
      body.position.y = 0.55;
      body.castShadow = true;
      bajaj.add(body);

      // Sloped front apron / nose
      const noseGeo = new THREE.CylinderGeometry(0.35, 0.68, 0.72, 12, 1, false, 0, Math.PI);
      noseGeo.rotateY(Math.PI / 2);
      const nose = new THREE.Mesh(noseGeo, bodyMat);
      nose.position.set(0, 0.58, 1.15);
      bajaj.add(nose);

      // Front wheel mudguard fender
      const fender = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10, 1, false, 0, Math.PI), this.tireMat);
      fender.rotation.z = Math.PI / 2;
      fender.position.set(0, 0.32, 1.0);
      bajaj.add(fender);

      // 2. Tubular chrome roll cage & roof support pillars
      [[-0.62, 0.85], [0.62, 0.85], [-0.62, -0.95], [0.62, -0.95]].forEach(([cx, cz]) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.88, 8), this.chromeMat);
        pillar.position.set(cx, 1.25, cz);
        bajaj.add(pillar);
      });

      // 3. Black weatherproof vinyl canopy
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.14, 2.15), this.tireMat);
      roof.position.set(0, 1.72, -0.05);
      roof.castShadow = true;
      bajaj.add(roof);

      // Rear vinyl window curtain
      const rearCurtain = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.65, 0.04), this.tireMat);
      rearCurtain.position.set(0, 1.32, -1.02);
      bajaj.add(rearCurtain);

      // 4. Sloped front laminated glass windshield
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.58, 0.05), this.carGlassMat);
      win.position.set(0, 1.32, 0.88);
      win.rotation.x = -0.22;
      bajaj.add(win);

      // Windshield wiper blade
      const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.38, 0.02), this.tireMat);
      wiper.position.set(0, 1.3, 0.94);
      wiper.rotation.z = 0.3;
      bajaj.add(wiper);

      // 5. Chrome side view mirrors on windshield pillars
      [-0.7, 0.7].forEach((mx, mIdx) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), this.chromeMat);
        arm.position.set(mx, 1.28, 0.85);
        arm.rotation.z = mIdx === 0 ? -Math.PI / 4 : Math.PI / 4;
        bajaj.add(arm);

        const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.02), this.chromeMat);
        mirror.position.set(mx > 0 ? mx + 0.08 : mx - 0.08, 1.35, 0.85);
        bajaj.add(mirror);
      });

      // 6. Handlebars & Dashboard inside cabin
      const hBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), this.chromeMat);
      hBar.rotation.z = Math.PI / 2;
      hBar.position.set(0, 0.92, 0.55);
      bajaj.add(hBar);

      // Driver seat & rear passenger bench
      const dSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.42), this.clayMat);
      dSeat.position.set(0, 0.75, 0.15);
      bajaj.add(dSeat);

      const pBench = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.2, 0.45), this.clayMat);
      pBench.position.set(0, 0.78, -0.65);
      bajaj.add(pBench);

      // 7. Bright round headlamp with active PointLight on street
      const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 16), this.headlightBulbMat);
      headlight.rotateX(Math.PI / 2);
      headlight.position.set(0, 0.72, 1.25);
      bajaj.add(headlight);

      const headLightSource = new THREE.PointLight(0xfffbeb, 1.2, 12);
      headLightSource.position.set(0, 0.75, 2.0);
      bajaj.add(headLightSource);

      // Front single wheel with chrome fork
      const bWheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 16);
      bWheelGeo.rotateZ(Math.PI / 2);

      const fWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
      fWheel.position.set(0, 0.26, 0.98);
      bajaj.add(fWheel);

      // Rear dual wheels with chrome hubcaps
      [-0.65, 0.65].forEach(wx => {
        const rWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
        rWheel.position.set(wx, 0.26, -0.72);
        bajaj.add(rWheel);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 12), this.chromeMat);
        hub.rotateZ(Math.PI / 2);
        hub.position.set(wx > 0 ? wx + 0.02 : wx - 0.02, 0.26, -0.72);
        bajaj.add(hub);
      });

      // 8. Harar Route Sign Card (e.g., "ሸዋ በር - ግድር መጋላ")
      const rSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(routeTag, 'HARAR BAJAJ', '#15803d', '#ffffff')
      });
      const rCard = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.04), rSignMat);
      rCard.position.set(0, 1.22, 0.96);
      bajaj.add(rCard);

      // 9. Official Yellow Ethiopian Taxi License Plate
      const plateMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(plateNum, 'BAJAJ', '#facc15', '#1e1b4b')
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.04), plateMat);
      plate.position.set(0, 0.38, 1.22);
      bajaj.add(plate);

      // Spare wheel mounted on the rear
      const spareWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
      spareWheel.rotation.y = Math.PI / 2;
      spareWheel.position.set(0, 0.72, -1.14);
      bajaj.add(spareWheel);

      return bajaj;
    };

    // 1. Blue & White Harari Bajaj at Shoa Gate entrance
    fleetGroup.add(buildHararBajaj(3.8, -14.0, 0, this.bajajBlueMat, 'ሸዋ በር - ግድር መጋላ', 'ሓረሪ 2 - 38291'));

    // 2. Green & Yellow Harari Bajaj outside Gidir Magala
    fleetGroup.add(buildHararBajaj(-3.8, 16.0, Math.PI, this.bajajGreenMat, 'አስማዲን - ቡዳ በር', 'ሓረሪ 2 - 14920'));

    // 3. Golden Yellow Harari Bajaj parked near Buda Gate
    fleetGroup.add(buildHararBajaj(7.2, -6.0, -Math.PI / 4, this.bajajYellowMat, 'ጀጎል ዙሪያ', 'ሓረሪ 2 - 82910'));

    // 4. Sky Blue Harari Bajaj at West Bajaj Stop
    fleetGroup.add(buildHararBajaj(-3.8, -32.0, Math.PI * 0.1, this.bajajBlueMat, 'ኤረር በር - ሸዋ በር', 'ሓረሪ 2 - 59281'));

    // 5. Emerald Green Harari Bajaj near Rimbaud Cultural Center
    fleetGroup.add(buildHararBajaj(3.8, 32.0, -Math.PI * 0.15, this.bajajGreenMat, 'አርተር ራምቦ - ራስ መኮንን', 'ሓረሪ 2 - 47102'));

    // 6. Classic Blue & White Lada 2101 City Taxi with Roof TAXI Light
    const lada = new THREE.Group();
    lada.position.set(3.6, 0, -26.0);

    const ladaLower = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.65, 4.2), this.ladaBlueMat);
    ladaLower.position.y = 0.58;
    ladaLower.castShadow = true;
    lada.add(ladaLower);

    const ladaCabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.68, 2.4), this.taxiWhiteMat);
    ladaCabin.position.set(0, 1.25, -0.2);
    ladaCabin.castShadow = true;
    lada.add(ladaCabin);

    const ladaWind = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.58, 0.08), this.carGlassMat);
    ladaWind.position.set(0, 1.25, 1.02);
    ladaWind.rotation.x = -0.26;
    lada.add(ladaWind);

    // Illuminated Yellow Roof TAXI Sign Pod (ታክሲ)
    const taxiSignMat = new THREE.MeshBasicMaterial({
      map: this.createSignTexture('ታክሲ', 'TAXI', '#facc15', '#1e1b4b')
    });
    const taxiPod = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.22), taxiSignMat);
    taxiPod.position.set(0, 1.68, 0.1);
    lada.add(taxiPod);

    // Chrome Bumper with Overriders
    const fBump = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.16), this.chromeMat);
    fBump.position.set(0, 0.42, 2.14);
    lada.add(fBump);

    // Chrome Radiator Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.06), this.chromeMat);
    grille.position.set(0, 0.68, 2.12);
    lada.add(grille);

    // Dual Round Headlamps with Chrome Bezels
    [-0.68, 0.68].forEach(hx => {
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 20), this.chromeMat);
      bezel.position.set(hx, 0.68, 2.12);
      lada.add(bezel);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), this.headlightBulbMat);
      bulb.position.set(hx, 0.68, 2.14);
      lada.add(bulb);
    });

    const wGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    wGeo.rotateZ(Math.PI / 2);
    [
      { x: -0.92, z: 1.25 }, { x: 0.92, z: 1.25 },
      { x: -0.92, z: -1.25 }, { x: 0.92, z: -1.25 }
    ].forEach(pos => {
      const w = new THREE.Mesh(wGeo, this.tireMat);
      w.position.set(pos.x, 0.32, pos.z);
      lada.add(w);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.24, 12), this.chromeMat);
      hub.rotateZ(Math.PI / 2);
      hub.position.set(pos.x > 0 ? pos.x + 0.02 : pos.x - 0.02, 0.32, pos.z);
      lada.add(hub);
    });

    fleetGroup.add(lada);

    // 7. Iconic Ethiopian Toyota HiAce Minibus Taxi ("ሰላም ሚኒባስ")
    const minibus = new THREE.Group();
    minibus.position.set(3.8, 0, 2.0);

    const miniLower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 4.6), this.taxiBlueMat);
    miniLower.position.y = 0.68;
    miniLower.castShadow = true;
    minibus.add(miniLower);

    const miniUpper = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.95, 4.4), this.taxiWhiteMat);
    miniUpper.position.set(0, 1.55, 0);
    miniUpper.castShadow = true;
    minibus.add(miniUpper);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 4.5), this.bajajYellowMat);
    stripe.position.set(0, 1.08, 0);
    minibus.add(stripe);

    // Roof-mounted Yellow Luggage Rack with Tarpaulin Baggage
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 3.4), this.bajajYellowMat);
    rack.position.set(0, 2.15, -0.2);
    minibus.add(rack);

    const baggage1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.6), this.burlapMat);
    baggage1.position.set(0, 2.45, -0.8);
    minibus.add(baggage1);

    const baggage2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.38, 1.2), this.bajajBlueMat);
    baggage2.position.set(0, 2.42, 0.6);
    minibus.add(baggage2);

    [
      { x: -1.02, z: 1.4 }, { x: 1.02, z: 1.4 },
      { x: -1.02, z: -1.4 }, { x: 1.02, z: -1.4 }
    ].forEach(mpos => {
      const mw = new THREE.Mesh(wGeo, this.tireMat);
      mw.position.set(mpos.x, 0.34, mpos.z);
      minibus.add(mw);
    });

    fleetGroup.add(minibus);

    // 8. Isuzu Cargo Truck carrying Harar Coffee Sacks (የሐረር ቡና)
    const truck = new THREE.Group();
    truck.position.set(-3.8, 0, 32.0);
    truck.rotation.y = Math.PI;

    const truckCab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 1.8), this.taxiWhiteMat);
    truckCab.position.y = 1.6;
    truckCab.castShadow = true;
    truck.add(truckCab);

    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 4.2), this.truckGreenMat);
    bed.position.set(0, 1.5, -1.0);
    bed.castShadow = true;
    truck.add(bed);

    // Sacks of Harar Longberry Mocha Coffee
    for (let sy = 0; sy < 2; sy++) {
      for (let sz = -2.4; sz <= 0.4; sz += 0.85) {
        [-0.55, 0.55].forEach(sx => {
          const sack = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.75), this.burlapMat);
          sack.position.set(sx, 1.6 + sy * 0.45, sz);
          truck.add(sack);
        });
      }
    }

    fleetGroup.add(truck);
    this.group.add(fleetGroup);

    if (this.physicsWorld) {
      const colLada = new BoxCollider(3.6, -26.0, 1.2, 2.3);
      const colMini = new BoxCollider(3.8, 2.0, 1.3, 2.4);
      const colTruck = new BoxCollider(-3.8, 32.0, 1.4, 3.2);
      this.physicsWorld.addCollider(colLada);
      this.physicsWorld.addCollider(colMini);
      this.physicsWorld.addCollider(colTruck);
      this.colliders.push(colLada, colMini, colTruck);
    }
  }

  /**
   * Sidewalk Harar Coffee & Spiced Tea Ceremony Terrace:
   * Authentic cultural arrangement outside Asmadin Bunna Bet:
   * Aromatic Qetema grass carpet, low Rekebot wooden tray with porcelain Cini cups,
   * clay Jebena pot, glowing frankincense burner (ዕጣን), and carved wooden stools.
   */

  /**
   * Authentic Harari Pedestrian Street Life:
   * Recreates the vibrant local life seen in documentary video footage:
   * - An elder enjoying coffee in a white gabi at the Bunna Bet terrace
   * - Harari women in traditional colorful attire (Gey Anooyo) at the Gidir Magala spice market
   * - A local Bajaj driver waiting beside his vehicle
   * - A sidewalk merchant selling fresh khat bundles and citrus fruit
   */
  buildHararPedestrians() {
    const crowdGroup = new THREE.Group();

    // Helper: Create a stylized realistic textured Ethiopian pedestrian with limbs for animation
    const createPerson = ({ x, y = 0.22, z, rotY = 0, skinColor = 0x5a3825, clothesColor = 0xf8fafc, accentColor = 0x16a34a, hasGabi = false, hasKofia = false, hasShash = false, isSeated = false }) => {
      const person = new THREE.Group();
      person.position.set(x, y, z);
      person.rotation.y = rotY;

      // Contact shadow decal on the ground
      const pShadow = this.createContactShadow(0.8, 0.8, 0.7);
      pShadow.position.set(0, 0.02, 0);
      person.add(pShadow);

      const skinMat = new THREE.MeshStandardMaterial({
        color: skinColor,
        roughness: 0.82,
        metalness: 0.05
      });

      const clothesMat = new THREE.MeshStandardMaterial({
        color: clothesColor,
        roughness: 0.85,
        metalness: 0.02
      });

      const accentMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.8,
        metalness: 0.05
      });

      let headMesh = null;
      let leftArmMesh = null;
      let rightArmMesh = null;
      let cupArmMesh = null;

      if (isSeated) {
        // Seated lower body
        const thighs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.42), clothesMat);
        thighs.position.set(0, 0.42, 0.15);
        person.add(thighs);

        const calves = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.16), clothesMat);
        calves.position.set(0, 0.21, 0.35);
        person.add(calves);

        // Seated Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.28), clothesMat);
        torso.position.set(0, 0.78, 0);
        person.add(torso);

        // Head & Neck
        headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
        headMesh.position.set(0, 1.20, 0);
        person.add(headMesh);

        if (hasGabi) {
          const gabi = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.55, 10), this.hararWhiteMat);
          gabi.position.set(0, 0.78, 0);
          person.add(gabi);

          const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 10), accentMat);
          trim.position.set(0, 0.52, 0);
          person.add(trim);
        }

        if (hasKofia) {
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.08, 10), this.hararWhiteMat);
          cap.position.set(0, 1.32, 0);
          person.add(cap);
        }

        // Arm holding small cini coffee cup
        cupArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 6), clothesMat);
        cupArmMesh.rotation.x = Math.PI / 3;
        cupArmMesh.position.set(0.18, 0.72, 0.16);
        person.add(cupArmMesh);

        const cini = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.05, 8), this.hararWhiteMat);
        cini.position.set(0.18, 0.82, 0.30);
        person.add(cini);

      } else {
        // Standing legs
        const legMat = clothesMat;
        [-0.12, 0.12].forEach(lx => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.75, 8), legMat);
          leg.position.set(lx, 0.40, 0);
          person.add(leg);
        });

        // Standing Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.26), clothesMat);
        torso.position.set(0, 1.05, 0);
        person.add(torso);

        // Head
        headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
        headMesh.position.set(0, 1.48, 0);
        person.add(headMesh);

        if (hasShash) {
          const shash = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10), accentMat);
          shash.position.set(0, 1.50, -0.02);
          person.add(shash);

          const veil = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.08), accentMat);
          veil.position.set(0, 1.25, -0.12);
          person.add(veil);
        }

        if (hasKofia) {
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.08, 10), this.hararWhiteMat);
          cap.position.set(0, 1.60, 0);
          person.add(cap);
        }

        leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.58, 6), clothesMat);
        leftArmMesh.position.set(-0.24, 1.05, 0);
        person.add(leftArmMesh);

        rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.58, 6), clothesMat);
        rightArmMesh.position.set(0.24, 1.05, 0);
        person.add(rightArmMesh);
      }

      this.animatedPedestrians.push({
        group: person,
        head: headMesh,
        leftArm: leftArmMesh,
        rightArm: rightArmMesh,
        cupArm: cupArmMesh,
        type: isSeated ? 'seated' : 'standing',
        baseY: y
      });

      return person;
    };

    // 1. Elder at Coffee Terrace enjoying traditional Harar Bunna
    const elder = createPerson({
      x: -8.8, y: 0.22, z: 1.2, rotY: Math.PI * 0.15,
      skinColor: 0x4a2e1b, clothesColor: 0xf8fafc, accentColor: 0xd97706,
      hasGabi: true, hasKofia: true, isSeated: true
    });
    crowdGroup.add(elder);

    // 2. Harari Women shoppers browsing spices at Gidir Magala
    const woman1 = createPerson({
      x: -4.8, y: 0.22, z: -2.8, rotY: Math.PI * 0.65,
      skinColor: 0x5a3825, clothesColor: 0xd97706, accentColor: 0xb91c1c,
      hasShash: true, isSeated: false
    });
    crowdGroup.add(woman1);

    const woman2 = createPerson({
      x: 4.8, y: 0.22, z: 2.2, rotY: -Math.PI * 0.45,
      skinColor: 0x6b4423, clothesColor: 0x0284c7, accentColor: 0xfacc15,
      hasShash: true, isSeated: false
    });
    crowdGroup.add(woman2);

    // 3. Bajaj Driver standing near his parked Bajaj
    const driver = createPerson({
      x: 3.8, y: 0.02, z: -23.6, rotY: Math.PI * 0.3,
      skinColor: 0x54351e, clothesColor: 0x1e293b, accentColor: 0xef4444,
      hasKofia: false, isSeated: false
    });
    crowdGroup.add(driver);

    // 4. Sidewalk Khat & Fruit Merchant seated with wicker baskets
    const merchant = createPerson({
      x: 8.2, y: 0.22, z: -14.0, rotY: -Math.PI * 0.4,
      skinColor: 0x4e311a, clothesColor: 0x15803d, accentColor: 0xeab308,
      hasGabi: false, hasKofia: true, isSeated: true
    });
    crowdGroup.add(merchant);

    // Woven market baskets of fresh fruit beside merchant
    [-0.55, 0.55].forEach((bx, bIdx) => {
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.25, 10), this.burlapMat);
      basket.position.set(8.2 + bx, 0.35, -13.5);
      crowdGroup.add(basket);

      const fruitMat = new THREE.MeshStandardMaterial({ color: bIdx === 0 ? 0xf97316 : 0x84cc16, roughness: 0.6 });
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), fruitMat);
      fruit.position.set(8.2 + bx, 0.48, -13.5);
      crowdGroup.add(fruit);
    });

    // 5. Additional Street Pedestrians strolling along sidewalks
    const strollerWest = createPerson({
      x: -5.2, y: 0.22, z: -42.0, rotY: 0,
      skinColor: 0x563821, clothesColor: 0x0f766e, accentColor: 0xf59e0b,
      hasKofia: true, isSeated: false
    });
    crowdGroup.add(strollerWest);

    const strollerEast = createPerson({
      x: 5.2, y: 0.22, z: 38.0, rotY: Math.PI,
      skinColor: 0x4b2c18, clothesColor: 0x7c3aed, accentColor: 0xec4899,
      hasShash: true, isSeated: false
    });
    crowdGroup.add(strollerEast);

    this.group.add(crowdGroup);
  }

  buildHararCoffeeAndTeaTerrace() {
    const ceremonyGroup = new THREE.Group();
    ceremonyGroup.position.set(-8.8, 0.22, 0.0);

    const qetema = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.03, 16), this.qetemaMat);
    qetema.position.set(0, 0.02, 0);
    ceremonyGroup.add(qetema);

    const rekebot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.85), this.timberMat);
    rekebot.position.set(0, 0.18, 0);
    ceremonyGroup.add(rekebot);

    const ciniMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const cini = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.06, 8), ciniMat);
        cini.position.set(-0.35 + col * 0.35, 0.36, -0.15 + row * 0.3);
        ceremonyGroup.add(cini);
      }
    }

    // Black clay Jebena
    const jebenaGroup = new THREE.Group();
    jebenaGroup.position.set(0.55, 0.06, 0.35);
    const jebenaBody = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), this.clayMat);
    jebenaBody.position.y = 0.22;
    jebenaGroup.add(jebenaBody);
    const jebenaNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.35, 10), this.clayMat);
    jebenaNeck.position.y = 0.52;
    jebenaGroup.add(jebenaNeck);
    ceremonyGroup.add(jebenaGroup);

    // Glowing Frankincense Burner (ዕጣን ማቡኸር)
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.22, 8), this.clayMat);
    burner.position.set(-0.65, 0.12, 0.35);
    ceremonyGroup.add(burner);

    const emberLight = new THREE.PointLight(0xf59e0b, 1.2, 3.5);
    emberLight.position.set(-0.65, 0.28, 0.35);
    ceremonyGroup.add(emberLight);

    // Carved wooden stools
    const stoolMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    [-1.2, -0.4, 0.8].forEach((sx, sIdx) => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 10), stoolMat);
      stool.position.set(sx, 0.2, -0.8 - sIdx * 0.2);
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
   * Cultural Minstrel & Harari Music Station:
   * Features Masenqo, Krar, and traditional ceremonial Kebero drums.
   */
  buildAzmariAndHarariMusicStation() {
    const musicGroup = new THREE.Group();
    musicGroup.position.set(8.8, 0.22, -16.0);

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.22, 14), this.timberMat);
    dais.position.y = 0.11;
    musicGroup.add(dais);

    // Masenqo single-string lute
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.16), this.parchmentMat);
    boxMesh.position.set(-0.5, 0.45, 0.2);
    boxMesh.rotation.z = Math.PI / 4;
    musicGroup.add(boxMesh);

    // Krar lyre
    const krar = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.14, 12), this.timberMat);
    krar.position.set(0.5, 0.25, 0.1);
    musicGroup.add(krar);

    // Kebero drum
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
   * Real-World Street Infrastructure:
   * Concrete Utility Power Poles with Step-Down Transformers, Suspended Overhead Electrical Lines,
   * Modern Cobra-Head Street Luminaires with Warm Glow, and Ethiopian Tricolor Flagpoles.
   */
  buildCityStreetFurnitureAndLights() {
    const furnGroup = new THREE.Group();

    // 1. Concrete Utility Power Poles (Height: 8.2m) with Transformers & Suspended Power Cables
    const polePositions = [-7.8, 7.8];
    const poleZs = [-75.0, -25.0, 25.0, 75.0];

    polePositions.forEach((px, pIdx) => {
      poleZs.forEach(pz => {
        // Tapered concrete power pole
        const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 8.4, 8), this.curbWhiteMat);
        pMesh.position.set(px, 4.2, pz);
        pMesh.castShadow = true;
        furnGroup.add(pMesh);

        // Timber crossarm
        const crossarm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), this.timberMat);
        crossarm.position.set(px, 7.8, pz);
        furnGroup.add(crossarm);

        // Cylindrical transformer on selected poles
        if (pz === -25.0 || pz === 25.0) {
          const transformer = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.75, 10), this.shutterMat);
          transformer.position.set(px > 0 ? px - 0.35 : px + 0.35, 6.2, pz);
          furnGroup.add(transformer);
        }
      });

      // 3 Black Electrical Power Lines running along the length of the street between poles
      for (let w = 0; w < 3; w++) {
        const wireOffset = -0.55 + w * 0.55;
        const cableGeo = new THREE.CylinderGeometry(0.012, 0.012, 160.0, 4);
        cableGeo.rotateX(Math.PI / 2);
        const cableMesh = new THREE.Mesh(cableGeo, this.tireMat);
        cableMesh.position.set(px + wireOffset, 7.85, 0);
        furnGroup.add(cableMesh);
      }
    });

    // 2. Ethiopian Tricolor & Harari Regional Flagpoles
    [-5.7, 5.7].forEach(fx => {
      [-30.0, 2.0].forEach(fz => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 8.5, 8), this.goldMat);
        pole.position.set(fx, 4.25, fz);
        furnGroup.add(pole);

        const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), this.flagGreenMat);
        flag.position.set(fx + 1.25, 7.8, fz);
        flag.rotation.y = 0.25;
        furnGroup.add(flag);
      });
    });

    // 3. Modern Cobra-Head Street Luminaires with Warm Glow Pools
    const lampPositions = [
      { x: -5.6, z: -60.0 }, { x: 5.6, z: -60.0 },
      { x: -5.6, z: -30.0 }, { x: 5.6, z: -30.0 },
      { x: -5.6, z: 0.0 },   { x: 5.6, z: 0.0 },
      { x: -5.6, z: 30.0 },  { x: 5.6, z: 30.0 },
      { x: -5.6, z: 60.0 },  { x: 5.6, z: 60.0 }
    ];

    lampPositions.forEach(lp => {
      // Steel pole
      const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 5.4, 8), this.balconyMat);
      lampPost.position.set(lp.x, 2.7, lp.z);
      furnGroup.add(lampPost);

      // Curved cobra-head luminaire arm
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), this.balconyMat);
      arm.rotation.z = lp.x < 0 ? -Math.PI / 4 : Math.PI / 4;
      arm.position.set(lp.x < 0 ? lp.x + 0.4 : lp.x - 0.4, 5.2, lp.z);
      furnGroup.add(arm);

      // Rectangular cobra-head fixture with glowing lens
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.48), this.balconyMat);
      fixture.position.set(lp.x < 0 ? lp.x + 0.75 : lp.x - 0.75, 5.5, lp.z);
      furnGroup.add(fixture);

      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.4), this.headlightBulbMat);
      lens.position.set(lp.x < 0 ? lp.x + 0.75 : lp.x - 0.75, 5.44, lp.z);
      furnGroup.add(lens);

      const lampLight = new THREE.PointLight(0xfef08a, 1.1, 16);
      lampLight.position.set(lp.x < 0 ? lp.x + 0.75 : lp.x - 0.75, 5.2, lp.z);
      furnGroup.add(lampLight);
    });

    this.group.add(furnGroup);
  }

  /**
   * Distant Highway Portal Gantry Signs:
   * Positioned far at the boundaries of the 220m avenue (z: -105.0 and z: +105.0).
   */
  buildDistantHighwayPortals() {
    const portals = [
      {
        z: -105.0,
        amharic: 'የሐረር ጁጎል ታሪካዊ መግቢያ በር • ወደ ድሬዳዋ መንገድ',
        english: 'HISTORIC HARAR JUGOL GATEWAY • DIRE DAWA HIGHWAY'
      },
      {
        z: 105.0,
        amharic: 'የደቡብ ምስራቅ ቆላማ ምድር በር • ወደ ባቢሌና ኦጋዴን',
        english: 'SOUTHEAST GATEWAY • BABILE ELEPHANT SANCTUARY'
      }
    ];

    portals.forEach(p => {
      const gate = new THREE.Group();
      gate.position.set(0, 0, p.z);

      // Flanking stone pillars matching the 16th-century Jugol wall
      [-6.0, 6.0].forEach(cx => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 7.2, 2.0), this.jugolStoneMat);
        pillar.position.set(cx, 3.6, 0);
        pillar.castShadow = true;
        gate.add(pillar);

        // Stone battlement crenels on each pillar
        const crenel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.6), this.hararWhiteMat);
        crenel.position.set(cx, 7.2 + 0.35, 0);
        gate.add(crenel);
      });

      // Monumental arch bridge beam
      const archBeam = new THREE.Mesh(new THREE.BoxGeometry(12.8, 1.6, 2.2), this.hararWhiteMat);
      archBeam.position.set(0, 6.4, 0);
      archBeam.castShadow = true;
      gate.add(archBeam);

      // Historic Ge'ez and English gate name sign
      const signMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(p.amharic, p.english, '#047857', '#ffffff')
      });
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1.25, 0.1), signMat);
      signBoard.position.set(0, 6.4, 1.15);
      gate.add(signBoard);

      this.group.add(gate);
    });
  }

  buildAtmosphericSunlightMotes() {
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 32.0;    // X across avenue
      positions[i * 3 + 1] = 0.5 + Math.random() * 8.5;  // Y altitude
      positions[i * 3 + 2] = (Math.random() - 0.5) * 180.0; // Z street length
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.16,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sunMotes = new THREE.Points(geometry, material);
    this.group.add(this.sunMotes);
  }

  update(deltaTime) {
    const t = Date.now() * 0.002;

    // 1. Spotted Hyenas gentle breathing
    if (this.animatedHyenas && this.animatedHyenas.length > 0) {
      this.animatedHyenas.forEach((hyena, idx) => {
        hyena.rotation.z = Math.sin(t + idx * 1.5) * 0.02;
      });
    }

    // 2. Pedestrian Idle & Life Animations (head scanning, arm swing, coffee cup sipping)
    if (this.animatedPedestrians && this.animatedPedestrians.length > 0) {
      this.animatedPedestrians.forEach((p, idx) => {
        if (p.type === 'standing') {
          p.group.position.y = p.baseY + Math.sin(t * 1.6 + idx * 0.8) * 0.012;
          if (p.head) p.head.rotation.y = Math.sin(t * 0.7 + idx * 1.4) * 0.22;
          if (p.leftArm) p.leftArm.rotation.x = Math.sin(t * 1.8 + idx) * 0.18;
          if (p.rightArm) p.rightArm.rotation.x = -Math.sin(t * 1.8 + idx) * 0.18;
        } else {
          p.group.position.y = p.baseY + Math.sin(t * 1.2 + idx * 1.1) * 0.006;
          if (p.head) p.head.rotation.y = Math.sin(t * 0.5 + idx * 1.2) * 0.15;
          if (p.cupArm) {
            p.cupArm.rotation.x = Math.PI / 3 + Math.sin(t * 0.9) * 0.14;
          }
        }
      });
    }

    // 3. Floating Sun Dust Motes Drift
    if (this.sunMotes) {
      const pos = this.sunMotes.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += Math.sin(t * 0.8 + i) * 0.0025;
      }
      this.sunMotes.geometry.attributes.position.needsUpdate = true;
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
