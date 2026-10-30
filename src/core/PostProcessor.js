import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const CinematicDepthShader = {
  name: 'CinematicDepthShader',
  uniforms: {
    tDiffuse: { value: null },
    vignetteOffset: { value: 1.1 },
    vignetteDarkness: { value: 0.8 },
    saturation: { value: 1.1 },
    contrast: { value: 1.06 },
    warmth: { value: 1.03 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignetteOffset;
    uniform float vignetteDarkness;
    uniform float saturation;
    uniform float contrast;
    uniform float warmth;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 col = tex.rgb;

      // Warm Ethiopian sun grade: subtle amber lift in highlights
      col.r *= warmth;
      col.b *= (2.0 - warmth * 0.98);

      // Contrast
      col = (col - 0.5) * contrast + 0.5;

      // Saturation
      float gray = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(gray), col, saturation);

      // Subtle optical lens vignette (soft corner falloff for photographic depth)
      vec2 uv = (vUv - vec2(0.5)) * vec2(vignetteOffset);
      float vignette = clamp(1.0 - dot(uv, uv) * vignetteDarkness, 0.0, 1.0);
      col *= vignette;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), tex.a);
    }
  `
};

export class PostProcessor {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(width, height);

    // 1. Base Scene Render
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 2. High-End Physical Bloom (Subtle Ethiopian sunlight glow on plaster and vehicles)
    const bloomResolution = new THREE.Vector2(width, height);
    this.bloomPass = new UnrealBloomPass(bloomResolution, 0.32, 0.45, 0.82);
    this.composer.addPass(this.bloomPass);

    // 3. Cinematic Color Grading & Lens Depth
    this.cinematicPass = new ShaderPass(CinematicDepthShader);
    this.composer.addPass(this.cinematicPass);

    // 4. Output Pass with Tone Mapping & sRGB Color Space
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  setCamera(camera) {
    this.camera = camera;
    if (this.renderPass) {
      this.renderPass.camera = camera;
    }
  }

  setSize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass && this.bloomPass.resolution) {
      this.bloomPass.resolution.set(width, height);
    }
  }

  render(camera) {
    if (camera && camera !== this.camera) {
      this.setCamera(camera);
    }

    if (this.enabled && this.composer) {
      try {
        this.composer.render();
        return;
      } catch (err) {
        console.warn('PostProcessor render error, falling back to direct WebGL render:', err);
        this.enabled = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.composer) {
      this.composer.passes.forEach(p => {
        if (p.dispose) p.dispose();
      });
      this.composer = null;
    }
  }
}
