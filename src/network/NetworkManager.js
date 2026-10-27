import * as THREE from 'three';
import { RemotePlayer } from '../entities/RemotePlayer.js';

export const ConnectionStatus = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  IN_ROOM: 'IN_ROOM',
  ERROR: 'ERROR'
};

/**
 * NetworkManager
 * Handles WebSocket communication with the authoritative Shadow Quest co-op server.
 */
export class NetworkManager {
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.status = ConnectionStatus.DISCONNECTED;
    this.serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `ws://${window.location.hostname}:8080`
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

    this.clientId = null;
    this.roomCode = null;
    this.playerIndex = 0; // 1 = Host, 2 = Guest
    this.isHost = false;
    this.peerId = null;
    this.peerName = null;

    // Latency tracking
    this.latency = 0;
    this.lastPingSent = 0;
    this.pingInterval = null;

    // Outgoing sync rate (20 Hz = 50ms interval)
    this.syncInterval = null;
    this.syncRateMs = 50;

    // Remote Player entity in 3D scene
    this.remotePlayer = null;

    // Callbacks for UI and game systems
    this.onStatusChangeCallbacks = [];
    this.onPeerJoinCallbacks = [];
    this.onPeerLeaveCallbacks = [];
  }

  onStatusChange(cb) {
    if (typeof cb === 'function') this.onStatusChangeCallbacks.push(cb);
  }

  onPeerJoin(cb) {
    if (typeof cb === 'function') this.onPeerJoinCallbacks.push(cb);
  }

  onPeerLeave(cb) {
    if (typeof cb === 'function') this.onPeerLeaveCallbacks.push(cb);
  }

  setStatus(status) {
    this.status = status;
    this.onStatusChangeCallbacks.forEach(cb => cb(status));
    this.updateHUDStatus();
  }

  connect(customUrl = null) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    const url = customUrl || this.serverUrl;
    this.setStatus(ConnectionStatus.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        this.setStatus(ConnectionStatus.ERROR);
        return reject(err);
      }

      this.ws.onopen = () => {
        this.setStatus(ConnectionStatus.CONNECTED);
        this.startPingLoop();
        this.startSyncLoop();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (err) {
          console.error('[NetworkManager] Error parsing server message:', err);
        }
      };

      this.ws.onclose = () => {
        this.stopPingLoop();
        this.stopSyncLoop();
        this.cleanUpRemotePlayer();
        this.setStatus(ConnectionStatus.DISCONNECTED);
      };

      this.ws.onerror = (err) => {
        console.warn('[NetworkManager] WebSocket error:', err);
        this.setStatus(ConnectionStatus.ERROR);
        reject(err);
      };
    });
  }

  disconnect() {
    this.stopPingLoop();
    this.stopSyncLoop();
    this.cleanUpRemotePlayer();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'LEAVE_ROOM' });
        this.ws.close();
      }
      this.ws = null;
    }

    this.roomCode = null;
    this.playerIndex = 0;
    this.isHost = false;
    this.peerId = null;
    this.peerName = null;
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  async createRoom(playerName = 'Player 1') {
    await this.connect();
    const stageIndex = this.game.levelManager ? this.game.levelManager.currentLevelIndex : 0;
    this.send({
      type: 'CREATE_ROOM',
      playerName,
      stageIndex
    });
  }

  async joinRoom(roomCode, playerName = 'Player 2') {
    await this.connect();
    this.send({
      type: 'JOIN_ROOM',
      roomCode: (roomCode || '').toUpperCase().trim(),
      playerName
    });
  }

  leaveRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomCode) {
      this.send({ type: 'LEAVE_ROOM' });
    }
    this.cleanUpRemotePlayer();
    this.roomCode = null;
    this.playerIndex = 0;
    this.isHost = false;
    this.peerId = null;
    this.peerName = null;
    this.setStatus(this.ws?.readyState === WebSocket.OPEN ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED);
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'HANDSHAKE':
        this.clientId = msg.clientId;
        break;

      case 'PONG':
        if (msg.clientTime) {
          this.latency = Math.max(1, Math.round((Date.now() - msg.clientTime) / 2));
          this.updateHUDStatus();
        }
        break;

      case 'ROOM_CREATED':
        this.roomCode = msg.roomCode;
        this.playerIndex = msg.playerIndex;
        this.isHost = true;
        this.setStatus(ConnectionStatus.IN_ROOM);
        if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
          this.game.uiManager.showCollectNotification(`Co-Op Room Created: ${msg.roomCode} (Waiting for partner)`);
        }
        break;

      case 'ROOM_JOINED':
        this.roomCode = msg.roomCode;
        this.playerIndex = msg.playerIndex;
        this.isHost = false;
        this.peerName = msg.hostName || 'Player 1';
        this.setStatus(ConnectionStatus.IN_ROOM);
        this.spawnRemotePlayer(this.peerName);

        // Sync stage if needed
        if (typeof msg.stageIndex === 'number' && this.game.levelManager) {
          if (this.game.levelManager.currentLevelIndex !== msg.stageIndex) {
            this.game.levelManager.loadLevel(msg.stageIndex, true);
          }
        }

        // Sync collected crystals & dead enemies (late-join consistency)
        if (Array.isArray(msg.defeatedEnemyIds) && this.game.enemyManager) {
          msg.defeatedEnemyIds.forEach(id => {
            const e = this.game.enemyManager.getEnemyById(id);
            if (e && e.isAlive()) {
              e.takeDamage(9999);
            }
          });
        }
        if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
          this.game.uiManager.showCollectNotification(`Joined Co-Op Room ${msg.roomCode} with ${this.peerName}`);
        }
        break;

      case 'PEER_JOINED':
        this.peerId = msg.peerId;
        this.peerName = msg.peerName;
        this.spawnRemotePlayer(this.peerName);
        this.onPeerJoinCallbacks.forEach(cb => cb(msg));
        if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
          this.game.uiManager.showCollectNotification(`⚔️ ${msg.peerName} joined the co-op quest!`);
        }
        break;

      case 'PEER_LEFT':
        if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
          this.game.uiManager.showCollectNotification(`⚠️ ${msg.reason || 'Partner departed the co-op session.'}`);
        }
        this.cleanUpRemotePlayer();
        this.onPeerLeaveCallbacks.forEach(cb => cb(msg));
        break;

      case 'REMOTE_PLAYER_UPDATE':
        if (!this.remotePlayer && this.game.scene) {
          this.spawnRemotePlayer(this.peerName || 'Player 2');
        }
        if (this.remotePlayer) {
          this.remotePlayer.setTargetTransform(msg.x, msg.y, msg.z, msg.rotY, msg.anim, {
            health: msg.health,
            maxHealth: msg.maxHealth,
            isAttacking: msg.isAttacking,
            isHeavyAttacking: msg.isHeavyAttacking,
            isRolling: msg.isRolling
          });
          if (msg.isAttacking || msg.isHeavyAttacking) {
            this.remotePlayer.triggerAttackAnimation(msg.isHeavyAttacking);
          }
        }
        break;

      case 'AUTHORITATIVE_COMBAT_RESULT':
        this.handleAuthoritativeCombatResult(msg);
        break;

      case 'AUTHORITATIVE_PICKUP_RESULT':
        this.handleAuthoritativePickupResult(msg);
        break;

      case 'STAGE_TRANSITION':
        if (typeof msg.stageIndex === 'number' && this.game.levelManager) {
          this.game.levelManager.loadLevel(msg.stageIndex, true);
          if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
            this.game.uiManager.showCollectNotification(`Ascending together to Realm Stage ${msg.stageIndex + 1}!`);
          }
        }
        break;

      case 'SERVER_ERROR':
        console.warn(`[NetworkManager] Server error [${msg.code}]:`, msg.message);
        if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
          this.game.uiManager.showCollectNotification(`⚠️ Co-Op Error: ${msg.message}`);
        }
        break;
    }
  }

  handleAuthoritativeCombatResult(msg) {
    if (!Array.isArray(msg.hits)) return;

    for (const hit of msg.hits) {
      if (!this.game.enemyManager) continue;
      const enemy = this.game.enemyManager.getEnemyById(hit.enemyId);
      if (enemy && enemy.isAlive()) {
        const wasAlive = enemy.isAlive();
        enemy.health = hit.newHealth;

        // Visual feedback
        if (this.game.vfxManager) {
          this.game.vfxManager.spawnImpactSparks(enemy.position, hit.isHeavy ? 35 : 20, 0x38bdf8);
          this.game.vfxManager.flashEnemyHit(enemy);
          this.game.vfxManager.spawnDamageNumber(enemy.position, `-${hit.damage}`, hit.isHeavy);
        }

        if (wasAlive && hit.wasKilled) {
          enemy.takeDamage(9999); // ensure death state triggers
          if (this.game.combatSystem) {
            this.game.combatSystem.handleEnemyDefeat(enemy, false);
          }
        }
      }
    }
  }

  handleAuthoritativePickupResult(msg) {
    const isMe = msg.pickerIndex === this.playerIndex;
    if (this.game.collectibleManager) {
      const col = this.game.collectibleManager.getCollectibleById(msg.collectibleId);
      if (col && !col.isCollected) {
        col.collect();
      }
    }
    if (this.game.questSystem) {
      this.game.questSystem.onCrystalCollected();
    }
    if (this.game.uiManager && typeof this.game.uiManager.showCollectNotification === 'function') {
      const who = isMe ? 'You' : (this.peerName || 'Partner');
      this.game.uiManager.showCollectNotification(`💎 ${who} found a Shadow Crystal! (${msg.totalCollected || 0} gathered)`);
    }
  }

  spawnRemotePlayer(name = 'Player 2') {
    if (this.remotePlayer) return;
    if (!this.game.scene) return;

    this.remotePlayer = new RemotePlayer(this.game.scene, this.peerId || 'peer', name);
  }

  cleanUpRemotePlayer() {
    if (this.remotePlayer) {
      this.remotePlayer.destroy();
      this.remotePlayer = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING', clientTime: Date.now() });
      }
    }, 2500);
  }

  stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  startSyncLoop() {
    this.stopSyncLoop();
    this.syncInterval = setInterval(() => {
      this.sendLocalPlayerUpdate();
    }, this.syncRateMs);
  }

  stopSyncLoop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  sendLocalPlayerUpdate() {
    if (!this.isInRoom() || !this.game.player) return;

    const p = this.game.player;
    const pos = p.getPosition();
    const rot = p.mesh.rotation.y;

    // Detect active movement animation
    const isAlive = typeof p.isAlive === 'function' ? p.isAlive() : p.health > 0;
    let anim = 'Idle';
    if (!isAlive) anim = 'Dead';
    else if (p.isRolling) anim = 'Roll';
    else if (p.isSprinting || (p.isRunMode && p.isMoving)) anim = 'Run';
    else if (p.isMoving) anim = 'Walk';

    this.send({
      type: 'PLAYER_UPDATE',
      x: Math.round(pos.x * 100) / 100,
      y: Math.round(pos.y * 100) / 100,
      z: Math.round(pos.z * 100) / 100,
      rotY: Math.round(rot * 1000) / 1000,
      anim,
      isAttacking: Boolean(p.isAttacking),
      isHeavyAttacking: Boolean(p.isHeavyAttacking),
      isRolling: Boolean(p.isRolling),
      isCrouching: Boolean(p.isCrouching),
      isRiding: Boolean(p.isRiding),
      health: p.health,
      maxHealth: p.maxHealth
    });
  }

  sendAttackIntent(isHeavy = false) {
    if (!this.isInRoom() || !this.game.player) return;
    const p = this.game.player;
    const pos = p.getPosition();
    const fwd = p.getForwardVector();

    this.send({
      type: 'ATTACK_INTENT',
      attackType: isHeavy ? 'heavy' : 'light',
      x: pos.x,
      z: pos.z,
      forwardX: fwd.x,
      forwardZ: fwd.z,
      baseDamage: p.damage
    });
  }

  sendPickupIntent(collectibleId) {
    if (!this.isInRoom()) return;
    this.send({
      type: 'PICKUP_INTENT',
      collectibleId
    });
  }

  sendPortalEnterIntent() {
    if (!this.isInRoom()) return;
    this.send({
      type: 'PORTAL_ENTER_INTENT'
    });
  }

  isInRoom() {
    return this.status === ConnectionStatus.IN_ROOM && Boolean(this.roomCode);
  }

  update(deltaTime) {
    if (this.remotePlayer) {
      this.remotePlayer.update(deltaTime);
    }
  }

  updateHUDStatus() {
    const badge = document.getElementById('coop-status-badge');
    if (!badge) return;

    if (!this.isInRoom()) {
      badge.classList.add('hidden');
      return;
    }

    badge.classList.remove('hidden');
    const roomText = document.getElementById('coop-room-code-text');
    const pingText = document.getElementById('coop-ping-text');
    const partnerText = document.getElementById('coop-partner-text');

    if (roomText) roomText.textContent = this.roomCode || '---';
    if (pingText) pingText.textContent = `${this.latency}ms`;
    if (partnerText) {
      partnerText.textContent = this.peerName
        ? `⚔️ ${this.peerName}`
        : '⏳ Waiting for Player 2...';
    }
  }
}
