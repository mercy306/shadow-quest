import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.size = 250;
    this.segments = 160;

    // Spline control points defining the winding forest trail
    this.pathPoints = [
      new THREE.Vector2(0, 15),
      new THREE.Vector2(0, 0),
      new THREE.Vector2(6, -18),
      new THREE.Vector2(16, -35),
      new THREE.Vector2(28, -52),
      new THREE.Vector2(40, -75)
    ];

    this.initTerrain();
  }

  /**
   * Calculates distance from (x, z) to the nearest segment of the winding forest trail.
   */
  getPathDistance(x, z) {
    const p = new THREE.Vector2(x, z);
    let minDist = Infinity;

    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const a = this.pathPoints[i];
      const b = this.pathPoints[i + 1];

      const ab = b.clone().sub(a);
      const ap = p.clone().sub(a);

      const lenSq = ab.lengthSq();
      let t = lenSq === 0 ? 0 : ap.dot(ab) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const proj = a.clone().add(ab.multiplyScalar(t));
      const dist = p.distanceTo(proj);
      if (dist < minDist) {
        minDist = dist;
      }
    }

    return minDist;
  }

  /**
   * Procedural height function returning natural terrain elevation at (x, z).
   */
  getHeight(x, z) {
    // 1. Natural rolling hills (multi-frequency harmonics)
    const h1 = Math.sin(x * 0.035) * Math.cos(z * 0.035) * 4.5;
    const h2 = Math.sin(x * 0.08 + 1.5) * Math.sin(z * 0.07 + 0.8) * 2.0;
    const h3 = Math.cos(x * 0.16 + 2.4) * Math.sin(z * 0.15) * 0.8;
    let baseH = h1 + h2 + h3;

    // 2. Mountainous elevation towards boundary edges to enclose the forest
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 75) {
      const edgeFactor = (distFromCenter - 75) / 50;
      baseH += Math.pow(edgeFactor, 1.8) * 14.0;
    }

    // 3. Ancient Ruins elevated bluff/plateau around (40, -75)
    const dxRuins = x - 40;
    const dzRuins = z - 75;
    const ruinsDist = Math.sqrt(dxRuins * dxRuins + dzRuins * dzRuins);
    if (ruinsDist < 35) {
      const bluffFactor = 1 - Math.min(1, ruinsDist / 35);
      baseH += bluffFactor * bluffFactor * 5.0;
    }

    // 4. Smooth trail indentation along the path
    const pathDist = this.getPathDistance(x, z);
    const pathInfluence = 6.0;
    if (pathDist < pathInfluence) {
      const t = pathDist / pathInfluence;
      const smooth = t * t * (3 - 2 * t); // Smoothstep curve
      // Flatten towards a gentle walking slope
      const pathTargetY = (z / -75) * 4.5;
      baseH = pathTargetY * (1 - smooth) + baseH * smooth;
    }

    // Flat player spawn area around (0, 0)
    const spawnDist = Math.sqrt(x * x + z * z);
    if (spawnDist < 12) {
      const st = spawnDist / 12;
      baseH = baseH * (st * st);
    }

    return baseH;
  }

  initTerrain() {
    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getHeight(vx, vz);
      pos.setY(i, vy);
    }

    geo.computeVertexNormals();

    // Generate procedural terrain texture with embedded dirt/pebble trail
    const terrainTex = TextureGenerator.createTerrainTexture(1024, (x, z) => this.getPathDistance(x, z));

    const mat = new THREE.MeshStandardMaterial({
      map: terrainTex,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
    this.scene.add(this.mesh);
  }

  getTerrainHeight(x, z) {
    return this.getHeight(x, z);
  }
}
