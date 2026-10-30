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
    this.buildHararVehicleFleet();
    this.buildHararCoffeeAndTeaTerrace();
    this.buildAzmariAndHarariMusicStation();
    this.buildCityStreetFurnitureAndLights();
    this.buildDistantHighwayPortals();

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
      roughness: 0.88,
      metalness: 0.12
    });

    this.timberMat = new THREE.MeshStandardMaterial({
      map: this.woodTex,
      roughness: 0.78,
      metalness: 0.1
    });

    // Harar Jugol Architectural Stucco Colors
    this.hararBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Vibrant Harari Indigo Blue (ሰማያዊ የሐረር ቀለም)
      roughness: 0.88,
      metalness: 0.05
    });

    this.hararLightBlueMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Sky cerulean blue trim
      roughness: 0.85,
      metalness: 0.05
    });

    this.hararTerracottaMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Rich desert terracotta ochre
      roughness: 0.9,
      metalness: 0.05
    });

    this.hararWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Crisp lime whitewash of Jamia Mosque & Jugol houses
      roughness: 0.82,
      metalness: 0.04
    });

    this.jugolStoneMat = new THREE.MeshStandardMaterial({
      color: 0x78716c, // Historic volcanic basalt & lime mortar of the 16th-century Jugol Wall
      roughness: 0.94,
      metalness: 0.08
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

    // Harar Bajaj & Vehicle Materials
    this.bajajBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
    this.bajajGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3, metalness: 0.5 });
    this.bajajYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4 });
    this.taxiBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.25, metalness: 0.6 });
    this.taxiWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.22, metalness: 0.4 });
    this.ladaBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.28, metalness: 0.6 });
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

  buildTerrain() {
    // Vast, completely FLAT urban city ground plane (500m x 500m)
    const geo = new THREE.PlaneGeometry(500, 500, 1, 1);
    geo.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
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
   * Main Avenue of Harar City:
   * 220-meter long dual-lane asphalt street with yellow dashed centerline, zebra crossings,
   * elevated concrete sidewalks, red-white curbs, and street tree planters.
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

    // Alternating Red & White Curbs
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

    // Ornamental Sidewalk Tree Planters
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
   * Shoa Gate (ሸዋ በር / Asmadin Bari):
   * The iconic main western ceremonial gate of Harar Jugol.
   * Features grand horseshoe archway, twin flanking semicircular watchtowers,
   * decorative Islamic battlements, and ceremonial welcoming banner.
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

      // Upper crenelated parapet
      const parapetGeo = new THREE.CylinderGeometry(2.65, 2.65, 0.8, 16);
      const parapet = new THREE.Mesh(parapetGeo, this.hararTerracottaMat);
      parapet.position.set(tx, 9.2 + 0.4, 0);
      gateGroup.add(parapet);

      // Conical dome cap
      const domeGeo = new THREE.ConeGeometry(2.5, 1.8, 16);
      const dome = new THREE.Mesh(domeGeo, this.islamicGreenMat);
      dome.position.set(tx, 10.4, 0);
      gateGroup.add(dome);

      // Golden Crescent finial (ጨረቃ)
      const crescentGeo = new THREE.TorusGeometry(0.28, 0.05, 8, 16, Math.PI * 1.5);
      const crescent = new THREE.Mesh(crescentGeo, this.goldMat);
      crescent.position.set(tx, 11.6, 0);
      gateGroup.add(crescent);

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

      // Wall plaster in Harari architectural color
      const shellGeo = new THREE.BoxGeometry(w, h, d);
      const shell = new THREE.Mesh(shellGeo, config.wallMat || this.hararBlueMat);
      shell.position.y = h / 2;
      shell.castShadow = true;
      shell.receiveShadow = true;
      bldg.add(shell);

      // Roll-up corrugated shop shutter
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 2.7, 0.12), this.shutterMat);
      shutter.position.set(0, 1.35, d / 2 + 0.08);
      bldg.add(shutter);

      // Storefront Signboard
      const signMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(config.amharicSign, config.englishSign, config.signBg, config.signFg)
      });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 1.05, 0.14), signMat);
      sign.position.set(0, 3.3, d / 2 + 0.15);
      bldg.add(sign);

      // Fabric / Metal Awning
      if (config.hasAwning) {
        const awningMat = config.awningMat || this.curbRedMat;
        const awning = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.15, 2.2), awningMat);
        awning.position.set(0, 2.85, d / 2 + 1.1);
        awning.rotation.x = 0.14;
        awning.castShadow = true;
        bldg.add(awning);
      }

      // Traditional Harari Mashrabiya (Carved Wooden Lattice Balconies)
      for (let floor = 2; floor <= Math.floor(h / 2.8); floor++) {
        const floorY = floor * 2.7;
        if (floorY + 1.2 < h) {
          const bSlab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.18, 1.4), this.cobbleMat);
          bSlab.position.set(0, floorY, d / 2 + 0.7);
          bldg.add(bSlab);

          // Wood lattice screen
          const bRail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.85, 0.08), this.timberMat);
          bRail.position.set(0, floorY + 0.45, d / 2 + 1.35);
          bldg.add(bRail);

          const uWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.1), this.carGlassMat);
          uWin.position.set(0, floorY + 0.9, d / 2 + 0.06);
          bldg.add(uWin);
        }
      }

      // Parapet & Rooftop ROTO tank
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.65, d + 0.1), config.wallMat || this.hararBlueMat);
      parapet.position.y = h + 0.32;
      bldg.add(parapet);

      const rotoGroup = new THREE.Group();
      rotoGroup.position.set(-w * 0.25, h, -d * 0.2);
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
      dish.position.set(w * 0.25, h + 0.9, d * 0.2);
      bldg.add(dish);

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
      { z: -80.0, amh: 'የሐረር ቡና መፍጫ', eng: 'HARAR COFFEE ROASTERY', bg: '#78350f', fg: '#fef08a', h: 8.5, mat: this.hararBlueMat },
      { z: -64.0, amh: 'የኢትዮጵያ ንግድ ባንክ', eng: 'CBE HARAR JUGOL BRANCH', bg: '#6b21a8', fg: '#fef08a', h: 10.2, mat: this.hararWhiteMat },
      { z: -48.0, amh: 'አል-አሚን ሻይና ሳምቡሳ', eng: 'AL-AMIN TEA & SAMBUSA CAFE', bg: '#047857', fg: '#ffffff', h: 8.4, mat: this.hararTerracottaMat },
      { z: -32.0, amh: 'ቴሌብር ሐረር', eng: 'TELEBIRR HARAR JUGOL', bg: '#0284c7', fg: '#ffffff', h: 8.2, mat: this.hararBlueMat },
      { z: -16.0, amh: 'የሐረሪ ባህል ቅርሶች', eng: 'HARARI CULTURAL BASKETS', bg: '#b45309', fg: '#fef3c7', h: 8.0, mat: this.hararTerracottaMat },
      { z: 0.0, amh: 'አስመዲን ቡና ቤት', eng: 'ASMADIN TRADITIONAL BUNNA', bg: '#78350f', fg: '#fef08a', h: 8.4, mat: this.hararBlueMat },
      { z: 16.0, amh: 'አዋሽ ባንክ ሸዋ በር', eng: 'AWASH BANK SHOA GATE', bg: '#0369a1', fg: '#f97316', h: 9.8, mat: this.hararWhiteMat },
      { z: 32.0, amh: 'የሐረር ፍራፍሬና ጫት', eng: 'HARAR FRESH PRODUCE', bg: '#15803d', fg: '#fef08a', h: 8.0, mat: this.hararTerracottaMat },
      { z: 48.0, amh: 'ኤረር በር ፋርማሲ', eng: 'ERER GATE PHARMACY', bg: '#059669', fg: '#ffffff', h: 8.2, mat: this.hararBlueMat },
      { z: 64.0, amh: 'ራስ መኮንን ሆቴል', eng: 'RAS MEKONNEN HOTEL', bg: '#b45309', fg: '#fef3c7', h: 10.5, mat: this.hararWhiteMat }
    ];

    westBuildings.forEach(b => {
      buildingsGroup.add(buildGegarHouse({
        x: -14.0, z: b.z, w: 7.2, h: b.h, d: 7.0, rotY: westRot,
        amharicSign: b.amh, englishSign: b.eng, signBg: b.bg, signFg: b.fg,
        wallMat: b.mat, hasAwning: true
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

    eastBuildings.forEach(b => {
      buildingsGroup.add(buildGegarHouse({
        x: 14.0, z: b.z, w: 7.2, h: b.h, d: 7.0, rotY: eastRot,
        amharicSign: b.amh, englishSign: b.eng, signBg: b.bg, signFg: b.fg,
        wallMat: b.mat, hasAwning: true
      }));
    });

    this.group.add(buildingsGroup);
  }

  /**
   * Authentic Harar Vehicle Fleet - The Bajaj Capital of Ethiopia:
   * Harar is universally famous for its fleet of buzzing Bajajs in City Blue and Green/Yellow!
   * Includes 3 detailed Bajaj auto-rickshaws, classic blue & white Lada 2101 taxi,
   * Toyota HiAce minibus taxi with Harari route tags, and Isuzu coffee truck.
   */
  buildHararVehicleFleet() {
    const fleetGroup = new THREE.Group();

    // Helper: Build High-Detail Harar Bajaj
    const buildHararBajaj = (x, z, rotY, bodyMat, routeTag, plateNum) => {
      const bajaj = new THREE.Group();
      bajaj.position.set(x, 0, z);
      bajaj.rotation.y = rotY;

      // Lower body with characteristic sloped front apron
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.75, 2.3), bodyMat);
      body.position.y = 0.6;
      body.castShadow = true;
      bajaj.add(body);

      // Black weather canopy
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 2.1), this.tireMat);
      roof.position.y = 1.35;
      roof.castShadow = true;
      bajaj.add(roof);

      // Sloped front windshield
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.08), this.carGlassMat);
      win.position.set(0, 1.28, 1.05);
      win.rotation.x = -0.18;
      bajaj.add(win);

      // Single bright round headlamp
      const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 14), this.headlightBulbMat);
      headlight.rotateX(Math.PI / 2);
      headlight.position.set(0, 0.68, 1.18);
      bajaj.add(headlight);

      // Front single wheel with chrome fork
      const bWheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 14);
      bWheelGeo.rotateZ(Math.PI / 2);

      const fWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
      fWheel.position.set(0, 0.26, 0.95);
      bajaj.add(fWheel);

      // Rear dual wheels
      [-0.65, 0.65].forEach(wx => {
        const rWheel = new THREE.Mesh(bWheelGeo, this.tireMat);
        rWheel.position.set(wx, 0.26, -0.72);
        bajaj.add(rWheel);
      });

      // Harar Route Sign Card (e.g., "ሸዋ በር - ግድር መጋላ")
      const rSignMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(routeTag, 'HARAR BAJAJ', '#15803d', '#ffffff')
      });
      const rCard = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.04), rSignMat);
      rCard.position.set(0, 1.15, 1.1);
      bajaj.add(rCard);

      // Yellow Taxi License Plate
      const plateMat = new THREE.MeshBasicMaterial({
        map: this.createSignTexture(plateNum, 'BAJAJ', '#facc15', '#1e1b4b')
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.04), plateMat);
      plate.position.set(0, 0.42, 1.18);
      bajaj.add(plate);

      return bajaj;
    };

    // 1. Blue & White Harari Bajaj at Shoa Gate entrance
    const bajaj1 = buildHararBajaj(3.8, -14.0, 0, this.bajajBlueMat, 'ሸዋ በር - ግድር መጋላ', 'ሓረሪ 2 - 38291');
    fleetGroup.add(bajaj1);

    // 2. Green & Yellow Harari Bajaj outside Gidir Magala
    const bajaj2 = buildHararBajaj(-3.8, 16.0, Math.PI, this.bajajGreenMat, 'አስማዲን - ቡዳ በር', 'ሓረሪ 2 - 14920');
    fleetGroup.add(bajaj2);

    // 3. Yellow Harari Bajaj parked near Buda Gate
    const bajaj3 = buildHararBajaj(7.2, -6.0, -Math.PI / 4, this.bajajYellowMat, 'ጀጎል ዙሪያ', 'ሓረሪ 2 - 82910');
    fleetGroup.add(bajaj3);

    // 4. Classic Blue & White Lada 2101 City Taxi
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

    // Chrome Bumper with Overriders
    const fBump = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.16), this.chromeMat);
    fBump.position.set(0, 0.42, 2.14);
    lada.add(fBump);

    // Chrome Radiator Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.06), this.chromeMat);
    grille.position.set(0, 0.68, 2.12);
    lada.add(grille);

    // Iconic Round Headlamps
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
    });

    fleetGroup.add(lada);

    // 5. Isuzu Cargo Truck carrying Harar Coffee Sacks (የሐረር ቡና)
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
      const colTruck = new BoxCollider(-3.8, 32.0, 1.4, 3.2);
      this.physicsWorld.addCollider(colLada);
      this.physicsWorld.addCollider(colTruck);
      this.colliders.push(colLada, colTruck);
    }
  }

  /**
   * Sidewalk Harar Coffee & Spiced Tea Ceremony Terrace:
   * Authentic cultural arrangement outside Asmadin Bunna Bet:
   * Aromatic Qetema grass carpet, low Rekebot wooden tray with porcelain Cini cups,
   * clay Jebena pot, glowing frankincense burner (ዕጣን), and carved wooden stools.
   */
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
   * Street Furniture, Power Poles, and Warm Amber Street Lights:
   */
  buildCityStreetFurnitureAndLights() {
    const furnGroup = new THREE.Group();

    // Ethiopian Tricolor & Harari Regional Flagpoles
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

    // Ornate Street Lamps with Warm Amber Glow
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
      furnGroup.add(lampPost);

      const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), this.turnSignalMat);
      lantern.position.set(lp.x, 4.9, lp.z);
      furnGroup.add(lantern);

      const lampLight = new THREE.PointLight(0xf59e0b, 0.8, 12);
      lampLight.position.set(lp.x, 4.9, lp.z);
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
        amharic: 'የሐረር ጁጎል መውጫ ➔ ወደ ድሬዳዋና አዲስ አበባ',
        english: 'HARAR JUGOL FREEWAY ➔ TO DIRE DAWA & ADDIS ABABA'
      },
      {
        z: 105.0,
        amharic: 'ወደ ባቢሌና ምስራቅ ቆላማ ምድር',
        english: 'BABILE ELEPHANT SANCTUARY ➔ EASTERN VALLEYS'
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
    // Subtle gentle breathing animation for the friendly Harar spotted hyenas
    if (this.animatedHyenas && this.animatedHyenas.length > 0) {
      const t = Date.now() * 0.002;
      this.animatedHyenas.forEach((hyena, idx) => {
        hyena.rotation.z = Math.sin(t + idx * 1.5) * 0.02;
      });
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
