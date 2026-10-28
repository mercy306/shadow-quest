import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const cache = new Map();
const inFlight = new Map();

/**
 * Loads a GLTF/GLB model with deduplicated in-flight requests and instanced cloning.
 * Ensures identical models (like Soldier.glb or EnemyGuardian.glb) are downloaded only once.
 */
export async function loadSharedModel(url) {
  if (cache.has(url)) {
    const entry = cache.get(url);
    return {
      scene: SkeletonUtils.clone(entry.scene),
      animations: entry.animations
    };
  }

  if (inFlight.has(url)) {
    const entry = await inFlight.get(url);
    return {
      scene: SkeletonUtils.clone(entry.scene),
      animations: entry.animations
    };
  }

  const promise = (async () => {
    try {
      const gltf = await loader.loadAsync(url);
      const entry = {
        scene: gltf.scene,
        animations: gltf.animations || []
      };
      cache.set(url, entry);
      return entry;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, promise);
  const entry = await promise;
  return {
    scene: SkeletonUtils.clone(entry.scene),
    animations: entry.animations
  };
}
