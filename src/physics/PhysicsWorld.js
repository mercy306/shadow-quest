import * as THREE from 'three';
import { CircleCollider, BoxCollider } from './Colliders.js';

export class PhysicsWorld {
  constructor(terrain = null) {
    this.terrain = terrain;
    this.worldRadius = 115.0; // Playable boundary radius
    this.cellSize = 16.0;

    // Spatial hash grid for fast O(1) broadphase lookups
    this.grid = new Map();
    this.colliders = [];
    this.platforms = [];
  }

  clear() {
    this.colliders = [];
    this.platforms = [];
    this.grid.clear();
    this.terrain = null;
  }

  setTerrain(terrain) {
    this.terrain = terrain;
  }

  _hashKey(cx, cz) {
    return `${cx}_${cz}`;
  }

  addCollider(collider) {
    this.colliders.push(collider);

    // Estimate bounding box of collider
    let minX, maxX, minZ, maxZ;
    if (collider.type === 'circle') {
      minX = collider.x - collider.radius;
      maxX = collider.x + collider.radius;
      minZ = collider.z - collider.radius;
      maxZ = collider.z + collider.radius;
    } else if (collider.type === 'box') {
      const maxDim = Math.hypot(collider.halfWidth, collider.halfLength);
      minX = collider.x - maxDim;
      maxX = collider.x + maxDim;
      minZ = collider.z - maxDim;
      maxZ = collider.z + maxDim;
    } else {
      minX = collider.x - 5;
      maxX = collider.x + 5;
      minZ = collider.z - 5;
      maxZ = collider.z + 5;
    }

    const minCx = Math.floor(minX / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const minCz = Math.floor(minZ / this.cellSize);
    const maxCz = Math.floor(maxZ / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = this._hashKey(cx, cz);
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key).push(collider);
      }
    }
  }

  removeCollider(collider) {
    const idx = this.colliders.indexOf(collider);
    if (idx !== -1) {
      this.colliders.splice(idx, 1);
    }
    for (const cell of this.grid.values()) {
      const cIdx = cell.indexOf(collider);
      if (cIdx !== -1) {
        cell.splice(cIdx, 1);
      }
    }
  }

  /**
   * Registers elevated walkable surfaces such as stone platforms, stairs, or dais.
   */
  addPlatform(platform) {
    this.platforms.push(platform);
  }

  /**
   * Queries nearby colliders around a point (x, z) within search radius.
   */
  getNearbyColliders(x, z, radius = 2.0) {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCz = Math.floor((z - radius) / this.cellSize);
    const maxCz = Math.floor((z + radius) / this.cellSize);

    const nearby = new Set();
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = this._hashKey(cx, cz);
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            nearby.add(cell[i]);
          }
        }
      }
    }
    return Array.from(nearby);
  }

  /**
   * Computes the effective walkable ground height at (x, z) considering
   * terrain elevation and elevated platforms/stairs.
   */
  getGroundHeight(x, z, currentY = 0) {
    let groundY = this.terrain ? this.terrain.getTerrainHeight(x, z) : 0;

    // Check elevated platforms
    for (let i = 0; i < this.platforms.length; i++) {
      const plat = this.platforms[i];
      if (plat.isPointInside(x, z)) {
        const platY = plat.getHeight(x, z);
        // Only walk on top if entity is high enough to step onto it or already on top
        if (currentY >= platY - 0.45) {
          if (platY > groundY) {
            groundY = platY;
          }
        }
      }
    }

    return groundY;
  }

  /**
   * Resolves horizontal collisions for an entity (player, enemy, etc.)
   * providing smooth sliding along obstacle surfaces and boundary clamping.
   */
  resolveCollisions(position, radius = 0.45, height = 1.8) {
    // 1. Playable world perimeter boundary check
    const distFromOrigin = Math.hypot(position.x, position.z);
    if (distFromOrigin > this.worldRadius - radius) {
      const factor = (this.worldRadius - radius) / distFromOrigin;
      position.x *= factor;
      position.z *= factor;
    }

    // 2. Iterate nearby obstacle colliders (2 passes for crisp corner sliding)
    const passes = 2;
    for (let p = 0; p < passes; p++) {
      const nearby = this.getNearbyColliders(position.x, position.z, radius + 1.5);

      for (let i = 0; i < nearby.length; i++) {
        const col = nearby[i];
        const hit = col.test(position.x, position.y, position.z, radius, height);

        if (hit && hit.depth > 0.0001) {
          // Push entity out along contact normal
          position.x += hit.normalX * hit.depth;
          position.z += hit.normalZ * hit.depth;
        }
      }

      // Check platform perimeter walls (if walking against an elevated platform without jumping)
      for (let i = 0; i < this.platforms.length; i++) {
        const plat = this.platforms[i];
        if (plat.hasWall && plat.isPointInside(position.x, position.z)) {
          const platY = plat.getHeight(position.x, position.z);
          // If entity is too low to step up, push away from platform perimeter
          if (position.y < platY - 0.45) {
            plat.resolveWallCollision(position, radius);
          }
        }
      }
    }
  }

  /**
   * Fast line-of-sight raycast from camera target to desired camera position.
   * Prevents camera from passing through terrain, stone ruins, and pillars.
   */
  raycastCamera(from, to, minTerrainOffset = 0.8) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const maxDist = dir.length();
    if (maxDist < 0.01) return to.clone();
    dir.normalize();

    let safeDist = maxDist;
    const steps = 14;

    // Raymarch along the line segment
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * maxDist;
      const sampleX = from.x + dir.x * t;
      const sampleY = from.y + dir.y * t;
      const sampleZ = from.z + dir.z * t;

      // Check terrain elevation
      if (this.terrain) {
        const terrainH = this.terrain.getTerrainHeight(sampleX, sampleZ) + minTerrainOffset;
        if (sampleY < terrainH) {
          safeDist = Math.max(1.8, t - 0.4);
          break;
        }
      }

      // Check solid ruins walls and pillars
      const nearby = this.getNearbyColliders(sampleX, sampleZ, 1.2);
      let hitSolid = false;
      for (let j = 0; j < nearby.length; j++) {
        const col = nearby[j];
        if (col.tag === 'wall' || col.tag === 'pillar') {
          const hit = col.test(sampleX, sampleY - 0.5, sampleZ, 0.4, 1.0);
          if (hit) {
            hitSolid = true;
            break;
          }
        }
      }

      if (hitSolid) {
        safeDist = Math.max(1.8, t - 0.5);
        break;
      }
    }

    return from.clone().add(dir.multiplyScalar(safeDist));
  }

  /**
   * Fast line-of-sight raycast from observer eye to target point.
   * Checks for obstructions by terrain elevation, ruin walls, pillars, rocks, and obstacles.
   * @param {THREE.Vector3} from - Observer eye position
   * @param {THREE.Vector3} to - Target position
   * @returns {boolean} true if line of sight is clear, false if obstructed
   */
  hasLineOfSight(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const maxDist = Math.hypot(dx, dy, dz);
    if (maxDist < 0.25) return true;

    const dirX = dx / maxDist;
    const dirY = dy / maxDist;
    const dirZ = dz / maxDist;

    // Adaptive step count along ray
    const steps = Math.min(24, Math.max(6, Math.floor(maxDist * 1.4)));

    for (let i = 1; i < steps; i++) {
      const t = (i / steps) * maxDist;
      const sampleX = from.x + dirX * t;
      const sampleY = from.y + dirY * t;
      const sampleZ = from.z + dirZ * t;

      // 1. Terrain elevation obstruction check
      if (this.terrain) {
        const terrainH = this.terrain.getTerrainHeight(sampleX, sampleZ);
        if (sampleY < terrainH + 0.15) {
          return false; // Hill or terrain crest blocks sight
        }
      }

      // 2. Solid colliders obstruction check (ruin walls, stone pillars, boulders)
      const nearby = this.getNearbyColliders(sampleX, sampleZ, 1.4);
      for (let j = 0; j < nearby.length; j++) {
        const col = nearby[j];
        const tag = col.tag;
        if (tag === 'wall' || tag === 'pillar' || tag === 'rock' || tag === 'stone' || tag === 'obstacle') {
          const hit = col.test(sampleX, sampleY - 0.4, sampleZ, 0.35, 1.2);
          if (hit) {
            return false; // Solid physical obstacle blocks line of sight
          }
        }
      }
    }

    return true;
  }
}
