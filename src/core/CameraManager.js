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

  onLockChange(callback) {
    if (typeof callback === 'function') {
      this.onLockChangeCallbacks.push(callback);
    }
  }

  notifyLockChange(isLocked) {
    this.onLockChangeCallbacks.forEach(cb => cb(isLocked));
  }
}
