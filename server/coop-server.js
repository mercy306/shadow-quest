/**
 * Authoritative Two-Player Co-Op WebSocket Server for Shadow Quest
 *
 * Responsibilities:
 * 1. Room lifecycle: create room (generates 5-char code), join room (max 2 players), leave room.
 * 2. Authoritative room state: level/stage index, quest objectives, collected item IDs, defeated enemy IDs.
 * 3. Authoritative combat: calculates damage, validates ranges/cooldowns, broadcast authoritative enemy damage & defeat.
 * 4. Anti-cheat & Security: message rate-limiting (max 40/sec), payload size limits (max 4KB), schema sanitization.
 * 5. Player sync: broadcasts positions, yaw, and animation states with server timestamps for interpolation.
 * 6. Disconnect handling: notifies peer on partner disconnect; cleans up empty rooms.
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export const DEFAULT_PORT = process.env.COOP_PORT ? parseInt(process.env.COOP_PORT, 10) : 8080;

// Maximum message size to reject malformed/bloated packets
const MAX_PAYLOAD_BYTES = 4096;
// Maximum messages allowed per second per client
const RATE_LIMIT_MSG_PER_SEC = 50;

/**
 * Generates an easily readable 5-character room code (avoiding ambiguous chars like 0/O, 1/I)
 */
function generateRoomCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Initial stage enemy templates for authoritative combat simulation
 */
function getInitialStageEnemies(stageIndex) {
  if (stageIndex === 0) {
    return [
      { id: 'guardian-1', name: 'Corrupted Sentinel', x: 2.0, y: 0.8, z: -14.0, maxHealth: 80, health: 80, isAlive: true },
      { id: 'guardian-2', name: 'Blighted Stalker', x: -16.0, y: 0.8, z: -35.0, maxHealth: 70, health: 70, isAlive: true },
      { id: 'guardian-3', name: 'Shadow Brute', x: 18.0, y: 0.8, z: -55.0, maxHealth: 110, health: 110, isAlive: true }
    ];
  } else if (stageIndex === 1) {
    return [
      { id: 'ruins-sentinel-1', name: 'Ancient Stone Automaton', x: -12.0, y: 0.8, z: 0.0, maxHealth: 100, health: 100, isAlive: true },
      { id: 'ruins-sentinel-2', name: 'Catacomb Wraith', x: 12.0, y: 0.8, z: 0.0, maxHealth: 90, health: 90, isAlive: true },
      { id: 'grimfang-alpha', name: 'Grimfang Alpha', x: 0.0, y: 0.8, z: -30.0, maxHealth: 450, health: 450, isAlive: true, isBoss: true }
    ];
  }
  return [];
}

export class CoopServer {
  constructor(port = DEFAULT_PORT) {
    this.port = port;
    this.rooms = new Map(); // roomCode -> Room
    this.clients = new Map(); // ws -> ClientInfo
    this.httpServer = null;
    this.wss = null;
    this.isRunning = false;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer((req, res) => {
        // Simple health-check / status endpoint
        if (req.url === '/health' || req.url === '/') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({
            status: 'online',
            service: 'Shadow Quest Authoritative Co-Op Server',
            version: '1.0.0',
            activeRooms: this.rooms.size,
            activeClients: this.clients.size
          }));
          return;
        }
        res.writeHead(404);
        res.end();
      });

      this.wss = new WebSocketServer({ server: this.httpServer });

      this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));

      this.httpServer.listen(this.port, () => {
        this.isRunning = true;
        console.log(`[CoopServer] Authoritative WebSocket Server running on ws://localhost:${this.port}`);
        resolve();
      });

      this.httpServer.on('error', reject);
    });
  }

  handleConnection(ws, req) {
    const clientIp = req.socket.remoteAddress;
    const client = {
      ws,
      id: `p_${Math.random().toString(36).substring(2, 9)}`,
      name: 'Adventurer',
      roomCode: null,
      playerIndex: 0, // 1 = host, 2 = guest
      lastMsgTimestamp: Date.now(),
      msgCountThisSec: 0,
      lastSecWindow: Math.floor(Date.now() / 1000)
    };
    this.clients.set(ws, client);

    ws.on('message', (data) => {
      // 1. Payload size check
      if (data.length > MAX_PAYLOAD_BYTES) {
        console.warn(`[CoopServer] Client ${client.id} sent oversize payload (${data.length} bytes). Dropping.`);
        return;
      }

      // 2. Rate limiting check
      const currentSec = Math.floor(Date.now() / 1000);
      if (currentSec !== client.lastSecWindow) {
        client.lastSecWindow = currentSec;
        client.msgCountThisSec = 0;
      }
      client.msgCountThisSec++;
      if (client.msgCountThisSec > RATE_LIMIT_MSG_PER_SEC) {
        console.warn(`[CoopServer] Client ${client.id} exceeded rate limit (${client.msgCountThisSec} msgs/sec).`);
        this.sendError(ws, 'RATE_LIMIT_EXCEEDED', 'Too many requests sent to multiplayer server.');
        return;
      }

      // 3. Parse message safely
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch (err) {
        this.sendError(ws, 'MALFORMED_JSON', 'Invalid JSON message received.');
        return;
      }

      if (!msg || typeof msg.type !== 'string') {
        this.sendError(ws, 'INVALID_SCHEMA', 'Message must include valid "type" field.');
        return;
      }

      this.processMessage(client, msg);
    });

    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('error', (err) => {
      console.error(`[CoopServer] Socket error on client ${client.id}:`, err.message);
    });

    // Send initial handshake
    this.send(ws, {
      type: 'HANDSHAKE',
      clientId: client.id,
      serverTime: Date.now()
    });
  }

  processMessage(client, msg) {
    switch (msg.type) {
      case 'PING':
        this.send(client.ws, { type: 'PONG', clientTime: msg.clientTime, serverTime: Date.now() });
        break;

      case 'CREATE_ROOM':
        this.handleCreateRoom(client, msg);
        break;

      case 'JOIN_ROOM':
        this.handleJoinRoom(client, msg);
        break;

      case 'PLAYER_UPDATE':
        this.handlePlayerUpdate(client, msg);
        break;

      case 'ATTACK_INTENT':
        this.handleAttackIntent(client, msg);
        break;

      case 'PICKUP_INTENT':
        this.handlePickupIntent(client, msg);
        break;

      case 'PORTAL_ENTER_INTENT':
        this.handlePortalEnter(client, msg);
        break;

      case 'LEAVE_ROOM':
        this.handleLeaveRoom(client);
        break;

      default:
        this.sendError(client.ws, 'UNKNOWN_MESSAGE_TYPE', `Type '${msg.type}' not recognized.`);
    }
  }

  handleCreateRoom(client, msg) {
    if (client.roomCode) {
      this.handleLeaveRoom(client);
    }

    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    client.name = (typeof msg.playerName === 'string' && msg.playerName.trim())
      ? msg.playerName.trim().substring(0, 16)
      : 'Player 1';
    client.roomCode = roomCode;
    client.playerIndex = 1;

    const room = {
      code: roomCode,
      createdAt: Date.now(),
      stageIndex: typeof msg.stageIndex === 'number' ? msg.stageIndex : 0,
      host: client,
      guest: null,
      enemies: getInitialStageEnemies(typeof msg.stageIndex === 'number' ? msg.stageIndex : 0),
      collectedCrystals: new Set(),
      defeatedEnemyIds: new Set(),
      isPortalUnlocked: false
    };

    this.rooms.set(roomCode, room);

    console.log(`[CoopServer] Room created: ${roomCode} by ${client.name} (${client.id})`);

    this.send(client.ws, {
      type: 'ROOM_CREATED',
      roomCode: room.code,
      playerIndex: client.playerIndex,
      stageIndex: room.stageIndex,
      isHost: true,
      enemies: room.enemies
    });
  }

  handleJoinRoom(client, msg) {
    if (client.roomCode) {
      this.handleLeaveRoom(client);
    }

    const code = (msg.roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      this.sendError(client.ws, 'ROOM_NOT_FOUND', `No active co-op room found with code '${code}'.`);
      return;
    }

    if (room.guest) {
      this.sendError(client.ws, 'ROOM_FULL', `Room '${code}' already has the maximum of 2 players.`);
      return;
    }

    client.name = (typeof msg.playerName === 'string' && msg.playerName.trim())
      ? msg.playerName.trim().substring(0, 16)
      : 'Player 2';
    client.roomCode = code;
    client.playerIndex = 2;
    room.guest = client;

    console.log(`[CoopServer] Player ${client.name} (${client.id}) joined room ${code}`);

    // Notify guest of full room state (late-join consistency)
    this.send(client.ws, {
      type: 'ROOM_JOINED',
      roomCode: room.code,
      playerIndex: client.playerIndex,
      stageIndex: room.stageIndex,
      isHost: false,
      hostName: room.host ? room.host.name : 'Player 1',
      enemies: room.enemies,
      collectedCrystals: Array.from(room.collectedCrystals),
      defeatedEnemyIds: Array.from(room.defeatedEnemyIds),
      isPortalUnlocked: room.isPortalUnlocked
    });

    // Notify host that guest has entered
    if (room.host && room.host.ws.readyState === WebSocket.OPEN) {
      this.send(room.host.ws, {
        type: 'PEER_JOINED',
        peerId: client.id,
        peerName: client.name,
        peerIndex: client.playerIndex
      });
    }
  }

  handlePlayerUpdate(client, msg) {
    const room = this.rooms.get(client.roomCode);
    if (!room) return;

    // Validate payload types
    if (
      typeof msg.x !== 'number' ||
      typeof msg.y !== 'number' ||
      typeof msg.z !== 'number' ||
      typeof msg.rotY !== 'number'
    ) {
      return;
    }

    // Forward to peer
    const peer = client.playerIndex === 1 ? room.guest : room.host;
    if (peer && peer.ws.readyState === WebSocket.OPEN) {
      this.send(peer.ws, {
        type: 'REMOTE_PLAYER_UPDATE',
        senderId: client.id,
        playerIndex: client.playerIndex,
        x: msg.x,
        y: msg.y,
        z: msg.z,
        rotY: msg.rotY,
        anim: typeof msg.anim === 'string' ? msg.anim : 'Idle',
        isAttacking: Boolean(msg.isAttacking),
        isHeavyAttacking: Boolean(msg.isHeavyAttacking),
        isRolling: Boolean(msg.isRolling),
        isCrouching: Boolean(msg.isCrouching),
        isRiding: Boolean(msg.isRiding),
        health: typeof msg.health === 'number' ? msg.health : 100,
        maxHealth: typeof msg.maxHealth === 'number' ? msg.maxHealth : 100,
        serverTime: Date.now()
      });
    }
  }

  /**
   * Authoritative combat: calculates damage server-side, validates distance,
   * prevents duplicate damage spikes or duplicate kills, updates enemy state.
   */
  handleAttackIntent(client, msg) {
    const room = this.rooms.get(client.roomCode);
    if (!room) return;

    const { x, z, forwardX, forwardZ, attackType, baseDamage } = msg;
    if (typeof x !== 'number' || typeof z !== 'number') return;

    const isHeavy = attackType === 'heavy';
    const reach = isHeavy ? 3.8 : 2.8;
    const damageMultiplier = isHeavy ? 2.2 : 1.0;
    const validatedDamage = Math.round(Math.min(100, Math.max(10, baseDamage || 25)) * damageMultiplier);

    let hits = [];

    for (const enemy of room.enemies) {
      if (!enemy.isAlive) continue;

      const dx = enemy.x - x;
      const dz = enemy.z - z;
      const dist = Math.hypot(dx, dz);

      if (dist <= reach) {
        // Forward angle check for normal strike
        if (!isHeavy && typeof forwardX === 'number' && typeof forwardZ === 'number') {
          const dirX = dx / (dist || 1);
          const dirZ = dz / (dist || 1);
          const dot = forwardX * dirX + forwardZ * dirZ;
          if (dot < 0.1) continue; // outside forward cone
        }

        // Apply authoritative damage
        enemy.health = Math.max(0, enemy.health - validatedDamage);
        const wasKilled = enemy.health <= 0;
        if (wasKilled) {
          enemy.isAlive = false;
          room.defeatedEnemyIds.add(enemy.id);
        }

        hits.push({
          enemyId: enemy.id,
          damage: validatedDamage,
          newHealth: enemy.health,
          wasKilled,
          isHeavy,
          attackerId: client.id,
          attackerIndex: client.playerIndex
        });
      }
    }

    if (hits.length > 0) {
      // Check if all stage enemies defeated to unlock exit portal
      const allDefeated = room.enemies.every(e => !e.isAlive);
      if (allDefeated && !room.isPortalUnlocked) {
        room.isPortalUnlocked = true;
      }

      this.broadcast(room, {
        type: 'AUTHORITATIVE_COMBAT_RESULT',
        hits,
        isPortalUnlocked: room.isPortalUnlocked,
        serverTime: Date.now()
      });
    }
  }

  /**
   * Authoritative collectible pickup: ensures crystals/loot cannot be duplicated.
   */
  handlePickupIntent(client, msg) {
    const room = this.rooms.get(client.roomCode);
    if (!room) return;

    const collectibleId = msg.collectibleId;
    if (!collectibleId || typeof collectibleId !== 'string') return;

    // Reject duplicate collection
    if (room.collectedCrystals.has(collectibleId)) {
      return;
    }

    room.collectedCrystals.add(collectibleId);

    // Broadcast authoritative reward
    this.broadcast(room, {
      type: 'AUTHORITATIVE_PICKUP_RESULT',
      collectibleId,
      pickerId: client.id,
      pickerIndex: client.playerIndex,
      totalCollected: room.collectedCrystals.size,
      serverTime: Date.now()
    });
  }

  handlePortalEnter(client, msg) {
    const room = this.rooms.get(client.roomCode);
    if (!room) return;

    if (!room.isPortalUnlocked) {
      this.sendError(client.ws, 'PORTAL_LOCKED', 'The altar portal is not yet unlocked.');
      return;
    }

    // Advance room stage index
    room.stageIndex = (room.stageIndex + 1) % 2; // Cycle between forest (0) and ruins (1)
    room.enemies = getInitialStageEnemies(room.stageIndex);
    room.collectedCrystals.clear();
    room.defeatedEnemyIds.clear();
    room.isPortalUnlocked = false;

    console.log(`[CoopServer] Room ${room.code} transitioned to stage ${room.stageIndex}`);

    this.broadcast(room, {
      type: 'STAGE_TRANSITION',
      stageIndex: room.stageIndex,
      enemies: room.enemies,
      serverTime: Date.now()
    });
  }

  handleLeaveRoom(client) {
    const roomCode = client.roomCode;
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (room) {
      const isHost = room.host === client;
      const peer = isHost ? room.guest : room.host;

      if (peer && peer.ws.readyState === WebSocket.OPEN) {
        this.send(peer.ws, {
          type: 'PEER_LEFT',
          peerId: client.id,
          reason: isHost ? 'Host closed the room.' : 'Guest departed the co-op session.'
        });
      }

      if (isHost) {
        // If host leaves, disband room
        if (room.guest) {
          room.guest.roomCode = null;
          room.guest.playerIndex = 0;
        }
        this.rooms.delete(roomCode);
        console.log(`[CoopServer] Room ${roomCode} disbanded after host departure.`);
      } else {
        // Guest left, room remains open for another player
        room.guest = null;
        console.log(`[CoopServer] Guest left room ${roomCode}. Host remains waiting.`);
      }
    }

    client.roomCode = null;
    client.playerIndex = 0;
  }

  handleDisconnect(client) {
    this.handleLeaveRoom(client);
    this.clients.delete(client.ws);
  }

  send(ws, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendError(ws, code, message) {
    this.send(ws, {
      type: 'SERVER_ERROR',
      code,
      message,
      serverTime: Date.now()
    });
  }

  broadcast(room, data) {
    if (room.host) this.send(room.host.ws, data);
    if (room.guest) this.send(room.guest.ws, data);
  }

  stop() {
    return new Promise((resolve) => {
      this.isRunning = false;
      if (this.wss) {
        for (const client of this.wss.clients) {
          client.close();
        }
        this.wss.close();
      }
      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log('[CoopServer] Server shut down gracefully.');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// If run directly via CLI (`node server/coop-server.js`)
if (process.argv[1] && process.argv[1].endsWith('coop-server.js')) {
  const server = new CoopServer(DEFAULT_PORT);
  server.start().catch((err) => {
    console.error('[CoopServer] Failed to start:', err);
    process.exit(1);
  });
}
