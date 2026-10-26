import * as THREE from 'three';

/**
 * Circle / Cylinder Collider (for Trees, Rocks, Pillars, Altars)
 */
export class CircleCollider {
  constructor(x, z, radius, minY = -100, maxY = 100, tag = 'obstacle') {
    this.type = 'circle';
    this.x = x;
    this.z = z;
    this.radius = radius;
    this.minY = minY;
    this.maxY = maxY;
    this.tag = tag;
  }

  test(px, py, pz, pRadius, pHeight) {
    // Check vertical overlap
    if (py + pHeight < this.minY || py > this.maxY) {
      return null;
    }

    const dx = px - this.x;
    const dz = pz - this.z;
    const distSq = dx * dx + dz * dz;
    const minDist = this.radius + pRadius;

    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq);
      if (dist === 0) {
        // Direct overlap fallback
        return {
          normalX: 1,
          normalZ: 0,
          depth: minDist
        };
      }
      return {
        normalX: dx / dist,
        normalZ: dz / dist,
        depth: minDist - dist
      };
    }

    return null;
  }
}

/**
 * Oriented Bounding Box (OBB) Collider (for Fallen Logs, Ruin Walls)
 */
export class BoxCollider {
  constructor(x, z, halfWidth, halfLength, rotationY = 0, minY = -100, maxY = 100, tag = 'wall') {
    this.type = 'box';
    this.x = x;
    this.z = z;
    this.halfWidth = halfWidth;
    this.halfLength = halfLength;
    this.rotationY = rotationY;
    this.minY = minY;
    this.maxY = maxY;
    this.tag = tag;

    this.cosR = Math.cos(-rotationY);
    this.sinR = Math.sin(-rotationY);
  }

  test(px, py, pz, pRadius, pHeight) {
    if (py + pHeight < this.minY || py > this.maxY) {
      return null;
    }

    // Transform player into box's local coordinate frame
    const dx = px - this.x;
    const dz = pz - this.z;
    const localX = dx * this.cosR - dz * this.sinR;
    const localZ = dx * this.sinR + dz * this.cosR;

    // Find closest point on box in local space
    const clampedX = Math.max(-this.halfWidth, Math.min(this.halfWidth, localX));
    const clampedZ = Math.max(-this.halfLength, Math.min(this.halfLength, localZ));

    const diffX = localX - clampedX;
    const diffZ = localZ - clampedZ;
    const distSq = diffX * diffX + diffZ * diffZ;

    if (distSq < pRadius * pRadius) {
      let localNormalX = 0;
      let localNormalZ = 0;
      let depth = 0;

      if (distSq === 0) {
        // Player center is inside the box; push out along closest local axis
        const penX = this.halfWidth - Math.abs(localX);
        const penZ = this.halfLength - Math.abs(localZ);
        if (penX < penZ) {
          localNormalX = localX >= 0 ? 1 : -1;
          depth = penX + pRadius;
        } else {
          localNormalZ = localZ >= 0 ? 1 : -1;
          depth = penZ + pRadius;
        }
      } else {
        const dist = Math.sqrt(distSq);
        localNormalX = diffX / dist;
        localNormalZ = diffZ / dist;
        depth = pRadius - dist;
      }

      // Rotate local normal back to world space
      const cosWorld = Math.cos(this.rotationY);
      const sinWorld = Math.sin(this.rotationY);
      const worldNormalX = localNormalX * cosWorld - localNormalZ * sinWorld;
      const worldNormalZ = localNormalX * sinWorld + localNormalZ * cosWorld;

      return {
        normalX: worldNormalX,
        normalZ: worldNormalZ,
        depth: depth
      };
    }

    return null;
  }
}
