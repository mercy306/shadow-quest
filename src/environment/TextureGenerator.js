import * as THREE from 'three';

/**
 * Procedural texture generator for realistic, self-contained PBR materials.
 * Generates high quality textures dynamically via HTML5 Canvas without external dependencies.
 */
export class TextureGenerator {
  /**
   * Generates terrain diffuse texture with a worn dirt/pebble path blending into mossy forest floor.
   */
  static createTerrainTexture(size = 1024, getPathDistanceFn) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Forest colors
    const grassDark = [28, 48, 24];      // Deep forest green
    const grassMid = [46, 76, 38];       // Lush moss green
    const grassLight = [68, 105, 52];    // Sunlit foliage green
    const dirtDark = [62, 46, 32];       // Damp earth
    const dirtLight = [95, 75, 54];      // Dry gravel path
    const stonePebble = [110, 105, 96];  // Path stone specks

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Normalized world coordinates (-125 to +125 world space)
        const wx = (x / size - 0.5) * 250;
        const wz = (y / size - 0.5) * 250;

        // Noise frequencies
        const n1 = Math.sin(wx * 0.15) * Math.cos(wz * 0.15);
        const n2 = Math.sin(wx * 0.4 + 1.2) * Math.sin(wz * 0.4 + 2.1) * 0.5;
        const grain = (Math.random() - 0.5) * 0.15;
        const noise = (n1 + n2) * 0.5 + 0.5 + grain;

        // Path proximity (0 = on path center, 1 = far in deep forest)
        let pathFactor = 1.0;
        if (getPathDistanceFn) {
          const dist = getPathDistanceFn(wx, wz);
          const pathWidth = 3.8;
          const blendWidth = 3.2;
          if (dist < pathWidth) {
            pathFactor = 0.0;
          } else if (dist < pathWidth + blendWidth) {
            pathFactor = (dist - pathWidth) / blendWidth;
          }
        }

        // Base grass color
        let r, g, b;
        if (noise < 0.45) {
          const t = noise / 0.45;
          r = grassDark[0] * (1 - t) + grassMid[0] * t;
          g = grassDark[1] * (1 - t) + grassMid[1] * t;
          b = grassDark[2] * (1 - t) + grassMid[2] * t;
        } else {
          const t = (noise - 0.45) / 0.55;
          r = grassMid[0] * (1 - t) + grassLight[0] * t;
          g = grassMid[1] * (1 - t) + grassLight[1] * t;
          b = grassMid[2] * (1 - t) + grassLight[2] * t;
        }

        // Blend with path dirt & pebbles
        if (pathFactor < 1.0) {
          const pebbleNoise = Math.sin(wx * 2.5) * Math.cos(wz * 2.5);
          let pr, pg, pb;
          if (pebbleNoise > 0.6) {
            pr = stonePebble[0];
            pg = stonePebble[1];
            pb = stonePebble[2];
          } else {
            const dt = (noise + 0.2) * 0.8;
            pr = dirtDark[0] * (1 - dt) + dirtLight[0] * dt;
            pg = dirtDark[1] * (1 - dt) + dirtLight[1] * dt;
            pb = dirtDark[2] * (1 - dt) + dirtLight[2] * dt;
          }

          r = pr * (1 - pathFactor) + r * pathFactor;
          g = pg * (1 - pathFactor) + g * pathFactor;
          b = pb * (1 - pathFactor) + b * pathFactor;
        }

        data[idx] = Math.min(255, Math.max(0, Math.floor(r)));
        data[idx + 1] = Math.min(255, Math.max(0, Math.floor(g)));
        data[idx + 2] = Math.min(255, Math.max(0, Math.floor(b)));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates organic tree bark texture with vertical furrowed grain.
   */
  static createBarkTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Vertical grain pattern
        const vGrain = Math.sin(x * 0.25 + Math.sin(y * 0.05) * 8.0);
        const fineGrain = Math.sin(x * 1.2) * 0.4 + (Math.random() - 0.5) * 0.2;
        const combined = (vGrain * 0.6 + fineGrain + 1.0) * 0.5;

        // Rich brown bark tones with occasional moss greenish tint
        const baseR = 48 + combined * 35;
        const baseG = 34 + combined * 26 + (Math.random() > 0.7 ? 12 : 0);
        const baseB = 22 + combined * 18;

        data[idx] = Math.floor(baseR);
        data[idx + 1] = Math.floor(baseG);
        data[idx + 2] = Math.floor(baseB);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates weathered ancient stone texture with stone blocks, crevices, and moss.
   */
  static createStoneTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base stone slate
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, size, size);

    // Weathering noise & stone blocks
    const blockH = 32;
    const blockW = 64;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;

    for (let y = 0; y < size; y += blockH) {
      const rowOffset = (Math.floor(y / blockH) % 2) * (blockW / 2);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();

      for (let x = -blockW; x < size + blockW; x += blockW) {
        ctx.beginPath();
        ctx.moveTo(x + rowOffset, y);
        ctx.lineTo(x + rowOffset, y + blockH);
        ctx.stroke();
      }
    }

    // Add moss patches and surface speckles
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 45;
      const isMoss = Math.random() < 0.12;

      if (isMoss) {
        data[i] = Math.max(0, data[i] - 25);
        data[i + 1] = Math.min(255, data[i + 1] + 28);
        data[i + 2] = Math.max(0, data[i + 2] - 20);
      } else {
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
