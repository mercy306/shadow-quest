import * as THREE from 'three';

export class AnimationController {
  constructor(rootObject, animationClips = []) {
    this.root = rootObject;
    this.mixer = new THREE.AnimationMixer(this.root);
    this.actions = new Map();
    this.currentAction = null;
    this.currentClipName = '';

    this.registerClips(animationClips);
  }

  registerClips(clips) {
    clips.forEach(clip => {
      const action = this.mixer.clipAction(clip);
      // Register with original name
      this.actions.set(clip.name, action);
      // Also register lowercase alias for robust lookups
      this.actions.set(clip.name.toLowerCase(), action);
    });
  }

  /**
   * Smoothly crossfades to a specified animation action.
   */
  play(clipName, crossfadeDuration = 0.35) {
    const action = this.actions.get(clipName) || this.actions.get(clipName.toLowerCase());
    if (!action) {
      console.warn(`Animation action "${clipName}" not found. Available:`, this.getAvailableClips());
      return;
    }

    if (this.currentAction === action) {
      return; // Already playing this action
    }

    const prevAction = this.currentAction;
    this.currentAction = action;
    this.currentClipName = clipName;

    action.reset();
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);

    if (prevAction) {
      action.fadeIn(crossfadeDuration);
      prevAction.fadeOut(crossfadeDuration);
    } else {
      action.fadeIn(0.1);
    }

    action.play();
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  getCurrentClip() {
    return this.currentClipName;
  }

  setTimeScale(speed = 1.0) {
    if (this.currentAction) {
      this.currentAction.setEffectiveTimeScale(speed);
    }
  }

  getAvailableClips() {
    // Return unique original clip names
    const names = new Set();
    this.actions.forEach((_, key) => {
      if (key[0] === key[0].toUpperCase()) {
        names.add(key);
      }
    });
    return Array.from(names);
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.root);
    }
    this.actions.clear();
  }
}
