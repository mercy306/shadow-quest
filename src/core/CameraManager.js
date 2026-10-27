import * as THREE from 'three';

export class CameraManager {
  constructor(fov = 60, aspect = window.innerWidth / window.innerHeight, near = 0.1, far = 1000) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.baseFOV = fov;
    this.targetFOV = fov;

    // Orbit parameters
    this.distance = 5.8;
    this.targetDistance = 5.8;
    this.minDistance = 2.0;
    this.maxDistance = 12.0;
    this.lookAtOffset = new THREE.Vector3(0, 1.5, 0);
    this.targetLookAtOffset = new THREE.Vector3(0, 1.5, 0);
    this.isRiding = false;

    // Spherical angles (in radians)
    // theta = horizontal azimuth (yaw), phi = vertical elevation (pitch)
    this.theta = Math.PI; // Face down negative Z by default
    this.phi = Math.PI * 0.38; // Slightly looking down from above

    // Pitch constraints (prevent camera from flipping upside down or dipping through floor)
    this.minPhi = Math.PI * 0.12; // Looking steep downward (~21 degrees from zenith)
    this.maxPhi = Math.PI * 0.48; // Looking near horizon (~86 degrees, preventing dipping below floor)

    // Sensitivity and smoothing
    this.mouseSensitivity = 0.0022;
    this.invertY = false;
    this.smoothSpeed = 16.0;

    // Internal tracking vectors
    this.currentPosition = new THREE.Vector3(0, 4, 8);
    this.desiredPosition = new THREE.Vector3();
    this.currentLookTarget = new THREE.Vector3(0, 1.5, 0);

    this.isPointerLocked = false;
    this.isLockEnabled = true;
    this.onLockChangeCallbacks = [];

    // Photo Mode Free Camera State
    this.isPhotoMode = false;
    this.savedGameplayCamera = null;
    this.photoCameraPos = new THREE.Vector3();
    this.photoCameraYaw = 0;
    this.photoCameraPitch = 0;
    this.photoCameraRoll = 0;
    this.photoSpeed = 9.0;
    this.photoBoundsCenter = new THREE.Vector3();
    this.photoMaxRadius = 32.0;

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookTarget);
  }

  setupPointerLock(domElement) {
    this.domElement = domElement || document.body;

    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked && this.isLockEnabled) {
        this.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement);
      this.notifyLockChange(this.isPointerLocked);
    });

    document.addEventListener('mousemove', (event) => {
      if (this.isPointerLocked) {
        this.onMouseMove(event.movementX, event.movementY);
      }
    });

    // Mouse wheel zoom
    window.addEventListener('wheel', (event) => {
      const zoomDelta = event.deltaY * 0.003;
      this.distance = THREE.MathUtils.clamp(this.distance + zoomDelta, this.minDistance, this.maxDistance);
    }, { passive: true });
  }

  requestPointerLock() {
    if (this.domElement && !this.isPointerLocked && this.isLockEnabled) {
      const promise = this.domElement.requestPointerLock();
      if (promise && promise.catch) {
        promise.catch(() => {});
      }
    }
  }

  exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  setLockEnabled(enabled) {
    this.isLockEnabled = !!enabled;
    if (!this.isLockEnabled) {
      this.exitPointerLock();
    }
  }

  onMouseMove(deltaX, deltaY) {
    // Horizontal rotation (yaw)
    this.theta -= deltaX * this.mouseSensitivity;

    // Vertical rotation (pitch)
    const pitchDelta = this.invertY ? -deltaY : deltaY;
    this.phi += pitchDelta * this.mouseSensitivity;
    this.phi = THREE.MathUtils.clamp(this.phi, this.minPhi, this.maxPhi);
  }

  setMouseSensitivity(val) {
    this.mouseSensitivity = Math.max(0.0005, Math.min(0.01, val));
  }

  setInvertY(bool) {
    this.invertY = !!bool;
  }

  updateMenuOrbit(deltaTime, center = new THREE.Vector3(0, 1.5, 0)) {
    this.theta += deltaTime * 0.08;
    this.phi = Math.PI * 0.36;
    const distance = 14.0;
    this.currentPosition.set(
      center.x + distance * Math.sin(this.phi) * Math.sin(this.theta),
      center.y + distance * Math.cos(this.phi) + 1.8,
      center.z + distance * Math.sin(this.phi) * Math.cos(this.theta)
    );
    this.currentLookTarget.copy(center);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookTarget);
  }

  setRidingMode(isRiding) {
    this.isRiding = isRiding;
    if (isRiding) {
      this.targetDistance = 7.6;
      this.targetLookAtOffset.set(0, 2.2, 0);
    } else {
      this.targetDistance = 5.8;
      this.targetLookAtOffset.set(0, 1.5, 0);
    }
  }

  update(target, deltaTime, environment = null, physicsWorld = null) {
    if (!target) return;

    // Smooth riding camera transition
    if (deltaTime > 0) {
      this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance, Math.min(1.0, deltaTime * 5.0));
      this.lookAtOffset.lerp(this.targetLookAtOffset, Math.min(1.0, deltaTime * 5.0));
    }

    const targetPos = target.getPosition ? target.getPosition() : target.position;
    const targetLook = targetPos.clone().add(this.lookAtOffset);

    // Compute desired camera position on the sphere relative to targetLook
    const sinPhi = Math.sin(this.phi);
    const cosPhi = Math.cos(this.phi);
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);

    const actualDistance = this.distance;

    this.desiredPosition.set(
      targetLook.x + actualDistance * sinPhi * sinTheta,
      targetLook.y + actualDistance * cosPhi,
      targetLook.z + actualDistance * sinPhi * cosTheta
    );

    // Collision avoidance: raycast against terrain and solid obstacles (walls, pillars)
    if (physicsWorld && typeof physicsWorld.raycastCamera === 'function') {
      const safePos = physicsWorld.raycastCamera(targetLook, this.desiredPosition, 0.9);
      this.desiredPosition.copy(safePos);
    } else if (environment && typeof environment.getTerrainHeight === 'function') {
      const terrainHeight = environment.getTerrainHeight(this.desiredPosition.x, this.desiredPosition.z);
      const minAltitude = terrainHeight + 0.9;
      if (this.desiredPosition.y < minAltitude) {
        this.desiredPosition.y = minAltitude;
      }
    }

    // Smooth exponential damping to eliminate camera jitter and sudden snaps
    const lerpFactor = 1.0 - Math.exp(-this.smoothSpeed * deltaTime);
    this.currentPosition.lerp(this.desiredPosition, lerpFactor);
    this.currentLookTarget.lerp(targetLook, lerpFactor);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookTarget);

    // Dynamic sprint velocity FOV expansion
    const isSprinting = target && target.isSprinting;
    this.targetFOV = isSprinting ? 67 : this.baseFOV;
    if (Math.abs(this.camera.fov - this.targetFOV) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFOV, 8.0 * deltaTime);
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Returns horizontal forward vector of the camera projected onto the X-Z plane.
   */
  getHorizontalForward() {
    const forward = new THREE.Vector3(-Math.sin(this.theta), 0, -Math.cos(this.theta));
    return forward.normalize();
  }

  /**
   * Returns horizontal right vector of the camera projected onto the X-Z plane.
   */
  getHorizontalRight() {
    const right = new THREE.Vector3(Math.cos(this.theta), 0, -Math.sin(this.theta));
    return right.normalize();
  }

  onResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  getCamera() {
    return this.camera;
  }

  snapToTarget(player) {
    if (!player) return;
    const playerPos = player.getPosition();
    const forward = typeof player.getForwardVector === 'function'
      ? player.getForwardVector()
      : new THREE.Vector3(0, 0, -1);

    this.theta = Math.atan2(-forward.x, -forward.z);
    this.currentLookTarget.copy(playerPos).add(this.lookAtOffset);

    const offset = new THREE.Vector3(
      this.distance * Math.sin(this.phi) * Math.sin(this.theta),
      this.distance * Math.cos(this.phi),
      this.distance * Math.sin(this.phi) * Math.cos(this.theta)
    );

    this.currentPosition.copy(this.currentLookTarget).add(offset);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookTarget);
  }

  // ===== PHOTO MODE FREE CAMERA =====

  startPhotoMode(player = null) {
    if (this.isPhotoMode) return;

    // 1. Save gameplay camera state
    this.savedGameplayCamera = {
      distance: this.distance,
      targetDistance: this.targetDistance,
      theta: this.theta,
      phi: this.phi,
      fov: this.camera.fov,
      position: this.camera.position.clone(),
      lookTarget: this.currentLookTarget.clone(),
      lookAtOffset: this.lookAtOffset.clone(),
      isRiding: this.isRiding
    };

    // 2. Initialize free camera at current camera location
    this.photoCameraPos.copy(this.camera.position);

    // Bounding center around player to prevent infinite void flight
    if (player && typeof player.getPosition === 'function') {
      this.photoBoundsCenter.copy(player.getPosition());
    } else {
      this.photoBoundsCenter.copy(this.currentLookTarget);
    }

    // Extract current camera yaw and pitch
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.photoCameraYaw = Math.atan2(dir.x, dir.z);
    this.photoCameraPitch = Math.asin(Math.max(-0.99, Math.min(0.99, dir.y)));
    this.photoCameraRoll = 0;

    this.isPhotoMode = true;
  }

  exitPhotoMode() {
    if (!this.isPhotoMode || !this.savedGameplayCamera) return;

    // Restore gameplay camera state
    const saved = this.savedGameplayCamera;
    this.distance = saved.distance;
    this.targetDistance = saved.targetDistance;
    this.theta = saved.theta;
    this.phi = saved.phi;
    this.camera.fov = saved.fov;
    this.camera.updateProjectionMatrix();

    this.currentPosition.copy(saved.position);
    this.currentLookTarget.copy(saved.lookTarget);
    this.lookAtOffset.copy(saved.lookAtOffset);
    this.isRiding = saved.isRiding;

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookTarget);
    this.camera.rotation.z = 0;

    this.isPhotoMode = false;
    this.savedGameplayCamera = null;
  }

  resetPhotoModeCamera(player = null) {
    if (!this.isPhotoMode) return;

    // Snap to default framing behind player
    const center = player ? player.getPosition() : this.photoBoundsCenter;
    const forward = (player && typeof player.getForwardVector === 'function')
      ? player.getForwardVector()
      : new THREE.Vector3(0, 0, -1);

    this.photoCameraYaw = Math.atan2(forward.x, forward.z);
    this.photoCameraPitch = -0.15;
    this.photoCameraRoll = 0;

    const defaultOffset = new THREE.Vector3(
      -Math.sin(this.photoCameraYaw) * 5.5,
      1.8,
      -Math.cos(this.photoCameraYaw) * 5.5
    );
    this.photoCameraPos.copy(center).add(defaultOffset);

    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();
  }

  setFOV(fov) {
    this.camera.fov = THREE.MathUtils.clamp(fov, 18, 95);
    this.camera.updateProjectionMatrix();
  }

  getFOV() {
    return this.camera.fov;
  }

  setRoll(radians) {
    this.photoCameraRoll = radians;
  }

  getRoll() {
    return this.photoCameraRoll;
  }

  getRollDegrees() {
    return THREE.MathUtils.radToDeg(this.photoCameraRoll);
  }

  updatePhotoMode(deltaTime, keys = {}, mouseDeltaX = 0, mouseDeltaY = 0) {
    if (!this.isPhotoMode) return;

    // 1. Mouse rotation (Yaw & Pitch)
    if (mouseDeltaX !== 0 || mouseDeltaY !== 0) {
      this.photoCameraYaw -= mouseDeltaX * this.mouseSensitivity * 1.2;
      this.photoCameraPitch -= mouseDeltaY * this.mouseSensitivity * 1.2 * (this.invertY ? -1 : 1);
      this.photoCameraPitch = THREE.MathUtils.clamp(this.photoCameraPitch, -Math.PI * 0.48, Math.PI * 0.48);
    }

    // 2. Camera Orientation Vectors
    const cosPitch = Math.cos(this.photoCameraPitch);
    const forward = new THREE.Vector3(
      Math.sin(this.photoCameraYaw) * cosPitch,
      Math.sin(this.photoCameraPitch),
      Math.cos(this.photoCameraYaw) * cosPitch
    ).normalize();

    const right = new THREE.Vector3(
      Math.cos(this.photoCameraYaw),
      0,
      -Math.sin(this.photoCameraYaw)
    ).normalize();

    const worldUp = new THREE.Vector3(0, 1, 0);

    // 3. Movement input translation
    const move = new THREE.Vector3();
    const speed = this.photoSpeed * (keys.shift ? 2.2 : (keys.alt ? 0.4 : 1.0));

    if (keys.forward) move.add(forward);
    if (keys.backward) move.sub(forward);
    if (keys.right) move.add(right);
    if (keys.left) move.sub(right);
    if (keys.up) move.add(worldUp);
    if (keys.down) move.sub(worldUp);

    if (move.lengthSq() > 0.001) {
      move.normalize().multiplyScalar(speed * deltaTime);
      this.photoCameraPos.add(move);

      // Clamp within photo mode bounding radius around scene action
      const distFromCenter = this.photoCameraPos.distanceTo(this.photoBoundsCenter);
      if (distFromCenter > this.photoMaxRadius) {
        const offset = this.photoCameraPos.clone().sub(this.photoBoundsCenter).normalize().multiplyScalar(this.photoMaxRadius);
        this.photoCameraPos.copy(this.photoBoundsCenter).add(offset);
      }
    }

    // 4. Update Three.js camera position and rotation matrix
    this.camera.position.copy(this.photoCameraPos);

    // Build rotation from yaw, pitch, roll
    const euler = new THREE.Euler(this.photoCameraPitch, this.photoCameraYaw, this.photoCameraRoll, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  onLockChange(callback) {
    if (typeof callback === 'function') {
      this.onLockChangeCallbacks.push(callback);
    }
  }

  notifyLockChange(isLocked) {
    this.onLockChangeCallbacks.forEach(cb => cb(isLocked));
  }
}
