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

  /**
   * Generates weathered timber wood planks texture with nails and woodgrain.
   */
  static createWoodTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(0, 0, size, size);

    const plankH = 48;
    ctx.strokeStyle = '#2b1810';
    ctx.lineWidth = 3;

    for (let y = 0; y < size; y += plankH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const grain = Math.sin(x * 0.4 + Math.sin(y * 0.08) * 4.0) * 15;
        const noise = (Math.random() - 0.5) * 20;
        data[idx] = Math.min(255, Math.max(0, data[idx] + grain + noise));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain * 0.7 + noise * 0.8));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain * 0.4 + noise * 0.5));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates rugged mountain rock strata texture with slate and mineral highlights.
   */
  static createMountainRockTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // Horizontal geological strata
        const strata = Math.sin(y * 0.12 + Math.cos(x * 0.05) * 6.0) * 25;
        const crag = Math.sin(x * 0.3) * Math.sin(y * 0.3) * 18;
        const noise = (Math.random() - 0.5) * 30;
        const val = strata + crag + noise;

        data[idx] = Math.min(255, Math.max(0, 95 + val));
        data[idx + 1] = Math.min(255, Math.max(0, 105 + val * 0.95));
        data[idx + 2] = Math.min(255, Math.max(0, 120 + val * 1.1));
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

  /**
   * Generates dark subterranean cavern rock texture with damp crystalline veins.
   */
  static createCavernTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e1b2e';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const crag = Math.sin(x * 0.2 + y * 0.15) * 22;
        const noise = (Math.random() - 0.5) * 25;
        const vein = Math.sin(x * 0.08 - y * 0.1) > 0.88 ? 35 : 0;

        data[idx] = Math.min(255, Math.max(0, 30 + crag * 0.5 + noise * 0.6 + vein * 0.4));
        data[idx + 1] = Math.min(255, Math.max(0, 35 + crag * 0.6 + noise * 0.7 + vein * 1.2));
        data[idx + 2] = Math.min(255, Math.max(0, 50 + crag * 0.8 + noise * 0.9 + vein * 1.5));
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

  /**
   * Generates realistic modern asphalt street texture with gravel grain,
   * yellow dashed centerline, white edge lines, zebra crossings, and manholes.
   */
  static createAsphaltRoadTexture(w = 1024, h = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // 1. Dark asphalt tarmac background with aggregate grit
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const noise = (Math.random() - 0.5) * 18;
        const tireTrack = Math.sin(x / w * Math.PI * 4) * 5;
        const base = Math.min(255, Math.max(0, 48 + noise - tireTrack));
        data[idx] = base;
        data[idx + 1] = base + 1;
        data[idx + 2] = base + 3;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 2. Solid White Edge Lines along gutters
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(38, 0);
    ctx.lineTo(38, h);
    ctx.moveTo(w - 38, 0);
    ctx.lineTo(w - 38, h);
    ctx.stroke();

    // 3. Dashed Yellow Center Line
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 16;
    ctx.setLineDash([90, 60]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Realistic Zebra Crossing (የእግረኛ ዜብራ)
    const zebraStripes = [
      { yStart: 380, hZebra: 220 },
      { yStart: 1550, hZebra: 220 }
    ];

    ctx.fillStyle = '#f8fafc';
    zebraStripes.forEach(z => {
      const stripeW = 42;
      const gap = 38;
      for (let x = 70; x < w - 70; x += stripeW + gap) {
        ctx.fillRect(x, z.yStart, stripeW, z.hZebra);
      }
    });

    // 5. Cast-Iron Manhole Covers & Drainage Grates
    const manholes = [
      { x: w * 0.32, y: 850, r: 42 },
      { x: w * 0.68, y: 1250, r: 42 }
    ];
    manholes.forEach(m => {
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 0.65, 0, Math.PI * 2);
      ctx.stroke();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates realistic concrete sidewalk paving slabs texture with chamfered joints.
   */
  static createSidewalkTileTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    const tileSize = size / 4;
    for (let x = 0; x <= size; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 12);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates authentic Harari lime-plaster wall texture (weathered stucco, lime pits, organic color wash).
   */
  static createHararPlasterTexture(baseHex = '#1d4ed8', accentHex = '#1e40af', size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);

    // Organic color gradient wash
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
    grad.addColorStop(1, accentHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Weathered plaster grain and lime efflorescence
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      const speckle = Math.random() < 0.04 ? (Math.random() - 0.5) * 45 : 0;
      data[i] = Math.min(255, Math.max(0, data[i] + noise + speckle));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + speckle));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + speckle));
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle fine hairline plaster fractures
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.lineWidth = 1.2;
    for (let f = 0; f < 6; f++) {
      let cx = Math.random() * size;
      let cy = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) {
        cx += (Math.random() - 0.5) * 45;
        cy += Math.random() * 30;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates historic Harar Jugol cobblestone street paving texture.
   * Irregular rounded limestone & basalt stones embedded in dark sand mortar.
   */
  static createHararCobblestoneTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark mortar base
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 0, size, size);

    const stoneCols = 16;
    const stoneRows = 16;
    const cellW = size / stoneCols;
    const cellH = size / stoneRows;

    const stonePalette = ['#78716c', '#a8a29e', '#57534e', '#d6d3d1', '#737373', '#8b8478'];

    for (let r = 0; r < stoneRows; r++) {
      const rowOffset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= stoneCols; c++) {
        const x = c * cellW + rowOffset + (Math.random() - 0.5) * 3;
        const y = r * cellH + (Math.random() - 0.5) * 3;
        const radX = (cellW * 0.42) + (Math.random() - 0.5) * 4;
        const radY = (cellH * 0.38) + (Math.random() - 0.5) * 4;

        ctx.fillStyle = stonePalette[Math.floor(Math.random() * stonePalette.length)];
        ctx.beginPath();
        ctx.ellipse(x + cellW * 0.5, y + cellH * 0.5, Math.max(4, radX), Math.max(4, radY), (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Highlight curve on cobblestone crown
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + cellW * 0.45, y + cellH * 0.45, Math.max(3, radX * 0.6), -Math.PI * 0.7, 0);
        ctx.stroke();
      }
    }

    // Grit noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 20;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates traditional carved Harari wooden door texture with geometric panels & iron studs.
   */
  static createHararCarvedDoorTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark aged timber base
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, 0, size, size);

    // Vertical plank lines
    ctx.strokeStyle = '#1b0000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, 0);
    ctx.lineTo(size * 0.5, size);
    ctx.stroke();

    // Outer door border
    ctx.strokeRect(16, 16, size - 32, size - 32);

    // 4 Carved geometric panels (2 on each leaf)
    const panels = [
      { x: 30, y: 35, w: size * 0.5 - 45, h: size * 0.4 - 15 },
      { x: size * 0.5 + 15, y: 35, w: size * 0.5 - 45, h: size * 0.4 - 15 },
      { x: 30, y: size * 0.5 + 10, w: size * 0.5 - 45, h: size * 0.42 },
      { x: size * 0.5 + 15, y: size * 0.5 + 10, w: size * 0.5 - 45, h: size * 0.42 }
    ];

    panels.forEach(p => {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#271007';
      ctx.lineWidth = 3;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Carved diamond in panel
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x + p.w * 0.5, p.y + 12);
      ctx.lineTo(p.x + p.w - 12, p.y + p.h * 0.5);
      ctx.lineTo(p.x + p.w * 0.5, p.y + p.h - 12);
      ctx.lineTo(p.x + 12, p.y + p.h * 0.5);
      ctx.closePath();
      ctx.stroke();
    });

    // Iron studs & bronze ring knockers
    ctx.fillStyle = '#d4af37'; // Brass knockers
    ctx.beginPath();
    ctx.arc(size * 0.5 - 32, size * 0.52, 14, 0, Math.PI * 2);
    ctx.arc(size * 0.5 + 32, size * 0.52, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates vibrant Harari woven basket texture (Mesob / Sahandari motifs).
   */
  static createHararWovenBasketTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const cx = size * 0.5;
    const cy = size * 0.5;

    // Outer woven straw background
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 0, size, size);

    // Concentric vibrant rings
    const rings = [
      { r: 110, color: '#dc2626', w: 14 },
      { r: 85, color: '#16a34a', w: 12 },
      { r: 62, color: '#eab308', w: 12 },
      { r: 42, color: '#1e3a8a', w: 10 },
      { r: 24, color: '#dc2626', w: 8 }
    ];

    rings.forEach(ring => {
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.w;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Star radial geometric teeth
    ctx.fillStyle = '#991b1b';
    const teeth = 12;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * 70;
      const y1 = cy + Math.sin(a) * 70;
      const x2 = cx + Math.cos(a + 0.15) * 98;
      const y2 = cy + Math.sin(a + 0.15) * 98;
      const x3 = cx + Math.cos(a - 0.15) * 98;
      const y3 = cy + Math.sin(a - 0.15) * 98;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates striped fabric awning texture for market stalls.
   */
  static createHararStripedAwningTexture(c1 = '#dc2626', c2 = '#fef08a', size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const stripes = 8;
    const stripeW = size / stripes;

    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? c1 : c2;
      ctx.fillRect(i * stripeW, 0, stripeW, size);
    }

    // Fabric texture weave
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
