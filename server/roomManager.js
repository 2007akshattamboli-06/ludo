import {
  COLOR_ORDER,
  createInitialTokens,
  evaluateMove,
  getNextActivePlayerColor,
  getValidMoves,
  hasPlayerWon,
} from './gameEngine.js';

const TURN_DURATION_MS = 100000;

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.socketToRoom = new Map();
    this.uidToRoom = new Map();
    this.queues = {
      2: [],
      4: [],
    };
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    } while (this.rooms.has(code));
    return code;
  }

  getSeatColors(maxPlayers) {
    return maxPlayers === 2 ? ['red', 'yellow'] : COLOR_ORDER.slice(0, maxPlayers);
  }

  serializeRoom(room) {
    return {
      code: room.code,
      isPrivate: room.isPrivate,
      maxPlayers: room.maxPlayers,
      status: room.status, // 'WAITING' | 'PLAYING' | 'FINISHED'
      hostUid: room.hostUid,
      players: room.players.map((p) => ({
        uid: p.uid,
        username: p.username,
        avatar: p.avatar,
        color: p.color,
        connected: p.connected,
      })),
      tokens: room.tokens,
      turnColor: room.turnColor,
      phase: room.phase,
      diceValue: room.diceValue,
      validTokenIds: room.validTokenIds,
      winner: room.winner,
      turnDeadline: room.turnDeadline,
    };
  }

  broadcastRoom(room) {
    this.io.to(room.code).emit('room_updated', this.serializeRoom(room));
  }

  createPrivateRoom(socket, user, maxPlayers = 4) {
    this.leaveCurrentRoom(socket);
    const count = [2, 3, 4].includes(maxPlayers) ? maxPlayers : 4;
    const code = this.generateRoomCode();
    const seatColors = this.getSeatColors(count);

    const room = {
      code,
      isPrivate: true,
      maxPlayers: count,
      seatColors,
      status: 'WAITING',
      hostUid: user.uid,
      players: [
        {
          socketId: socket.id,
          uid: user.uid,
          username: user.username,
          avatar: user.avatar || 'crown',
          color: seatColors[0],
          connected: true,
        },
      ],
      tokens: [],
      turnColor: seatColors[0],
      phase: 'ROLL',
      diceValue: 6,
      consecutiveSixes: 0,
      validTokenIds: [],
      winner: null,
      turnDeadline: null,
      turnTimer: null,
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(socket.id, code);
    this.uidToRoom.set(user.uid, code);
    socket.join(code);

    this.broadcastRoom(room);
    return room;
  }

  joinPrivateRoom(socket, user, rawCode) {
    const code = String(rawCode || '').trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      socket.emit('mp_error', { message: 'Room not found. Check the 6-character code.' });
      return;
    }

    // Reconnect if already part of this room
    const existing = room.players.find((p) => p.uid === user.uid);
    if (existing) {
      existing.socketId = socket.id;
      existing.connected = true;
      this.socketToRoom.set(socket.id, code);
      socket.join(code);
      this.broadcastRoom(room);
      return;
    }

    if (room.status !== 'WAITING') {
      socket.emit('mp_error', { message: 'This match has already started.' });
      return;
    }
    if (room.players.length >= room.maxPlayers) {
      socket.emit('mp_error', { message: 'This room is already full.' });
      return;
    }

    this.leaveCurrentRoom(socket);
    const takenColors = new Set(room.players.map((p) => p.color));
    const nextColor = room.seatColors.find((c) => !takenColors.has(c)) || 'blue';

    room.players.push({
      socketId: socket.id,
      uid: user.uid,
      username: user.username,
      avatar: user.avatar || 'crown',
      color: nextColor,
      connected: true,
    });

    this.socketToRoom.set(socket.id, code);
    this.uidToRoom.set(user.uid, code);
    socket.join(code);

    if (room.players.length === room.maxPlayers) {
      this.startMatch(room);
    } else {
      this.broadcastRoom(room);
    }
  }

  startPrivateMatch(socket, rawCode) {
    const code = String(rawCode || '').trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room || room.status !== 'WAITING') return;

    const requester = room.players.find((p) => p.socketId === socket.id);
    if (!requester || requester.uid !== room.hostUid) return;
    if (room.players.length < 2) {
      socket.emit('mp_error', { message: 'Need at least 2 players to start.' });
      return;
    }

    this.startMatch(room);
  }

  enqueueQuickMatch(socket, user, maxPlayers = 2) {
    const bucket = maxPlayers === 4 ? 4 : 2;
    this.leaveCurrentRoom(socket);
    this.removeFromQueues(socket.id, user.uid);

    this.queues[bucket].push({
      socket,
      user,
    });

    socket.emit('matchmaking_status', {
      searching: true,
      maxPlayers: bucket,
      queuedCount: this.queues[bucket].length,
    });

    if (this.queues[bucket].length >= bucket) {
      const matched = this.queues[bucket].splice(0, bucket);
      const code = this.generateRoomCode();
      const seatColors = this.getSeatColors(bucket);

      const players = matched.map((entry, idx) => ({
        socketId: entry.socket.id,
        uid: entry.user.uid,
        username: entry.user.username,
        avatar: entry.user.avatar || 'crown',
        color: seatColors[idx],
        connected: true,
      }));

      const room = {
        code,
        isPrivate: false,
        maxPlayers: bucket,
        seatColors,
        status: 'WAITING',
        hostUid: players[0].uid,
        players,
        tokens: [],
        turnColor: seatColors[0],
        phase: 'ROLL',
        diceValue: 6,
        consecutiveSixes: 0,
        validTokenIds: [],
        winner: null,
        turnDeadline: null,
        turnTimer: null,
      };

      this.rooms.set(code, room);
      matched.forEach((entry) => {
        this.socketToRoom.set(entry.socket.id, code);
        this.uidToRoom.set(entry.user.uid, code);
        entry.socket.join(code);
      });

      this.startMatch(room);
    }
  }

  cancelQuickMatch(socket) {
    this.removeFromQueues(socket.id);
    socket.emit('matchmaking_status', { searching: false });
  }

  removeFromQueues(socketId, uid = null) {
    [2, 4].forEach((b) => {
      this.queues[b] = this.queues[b].filter(
        (entry) => entry.socket.id !== socketId && (!uid || entry.user.uid !== uid)
      );
    });
  }

  startMatch(room) {
    const activeColors = room.players.map((p) => p.color);
    room.status = 'PLAYING';
    room.tokens = createInitialTokens(activeColors);
    room.turnColor = activeColors[0];
    room.phase = 'ROLL';
    room.diceValue = 6;
    room.consecutiveSixes = 0;
    room.validTokenIds = [];
    room.winner = null;

    this.scheduleTurnTimeout(room);
    this.broadcastRoom(room);
  }

  scheduleTurnTimeout(room) {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    if (room.status !== 'PLAYING') return;

    room.turnDeadline = Date.now() + TURN_DURATION_MS;
    room.turnTimer = setTimeout(() => {
      this.handleTurnTimeout(room.code);
    }, TURN_DURATION_MS);
  }

  handleTurnTimeout(code) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'PLAYING') return;

    const activePlayer = room.players.find((p) => p.color === room.turnColor);
    if (!activePlayer) return;

    if (room.phase === 'ROLL') {
      this.performRoll(room);
    } else if (room.phase === 'SELECT_TOKEN' && room.validTokenIds.length > 0) {
      this.performMove(room, room.validTokenIds[0]);
    }
  }

  handleRollDice(socket) {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'PLAYING' || room.phase !== 'ROLL') return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.color !== room.turnColor) return;

    this.performRoll(room);
  }

  performRoll(room) {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    room.phase = 'ANIMATING_ROLL';

    const rolled = Math.floor(Math.random() * 6) + 1;
    room.diceValue = rolled;

    const nextSixes = rolled === 6 ? room.consecutiveSixes + 1 : 0;
    room.consecutiveSixes = nextSixes;

    const validMoves = nextSixes >= 3 ? [] : getValidMoves(room.tokens, room.turnColor, rolled);
    room.validTokenIds = validMoves.map((t) => t.id);

    this.io.to(room.code).emit('dice_rolled', {
      color: room.turnColor,
      value: rolled,
      tripleSix: nextSixes >= 3,
      validTokenIds: room.validTokenIds,
    });

    setTimeout(() => {
      const latestRoom = this.rooms.get(room.code);
      if (!latestRoom || latestRoom.status !== 'PLAYING') return;

      if (nextSixes >= 3 || validMoves.length === 0) {
        this.advanceTurn(latestRoom, false);
      } else if (validMoves.length === 1) {
        this.performMove(latestRoom, validMoves[0].id);
      } else {
        latestRoom.phase = 'SELECT_TOKEN';
        this.scheduleTurnTimeout(latestRoom);
        this.broadcastRoom(latestRoom);
      }
    }, 520);
  }

  handleMoveToken(socket, tokenId) {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'PLAYING' || room.phase !== 'SELECT_TOKEN') return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.color !== room.turnColor) return;
    if (!room.validTokenIds.includes(tokenId)) return;

    this.performMove(room, tokenId);
  }

  performMove(room, tokenId) {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    const selectedToken = room.tokens.find((t) => t.id === tokenId);
    if (!selectedToken) return;

    room.phase = 'MOVING';
    room.validTokenIds = [];

    const evaluation = evaluateMove(selectedToken, room.diceValue, room.tokens);
    const capturedIds = evaluation.captures.map((c) => c.id);
    const capturedSet = new Set(capturedIds);

    room.tokens = room.tokens.map((t) => {
      if (t.id === selectedToken.id) return { ...t, steps: evaluation.toSteps };
      if (capturedSet.has(t.id)) return { ...t, steps: -1 };
      return t;
    });

    const won = hasPlayerWon(room.tokens, room.turnColor);
    const bonusTurn =
      !won && (room.diceValue === 6 || capturedIds.length > 0 || evaluation.reachesHome);

    if (won) {
      room.status = 'FINISHED';
      room.winner = room.turnColor;
      room.phase = 'GAME_OVER';
      room.turnDeadline = null;
    } else if (bonusTurn) {
      room.phase = 'ROLL';
      this.scheduleTurnTimeout(room);
    } else {
      const activeColors = room.players.map((p) => p.color);
      room.turnColor = getNextActivePlayerColor(room.turnColor, activeColors, room.tokens);
      room.consecutiveSixes = 0;
      room.phase = 'ROLL';
      this.scheduleTurnTimeout(room);
    }

    this.io.to(room.code).emit('token_moved', {
      tokenId: selectedToken.id,
      color: selectedToken.color,
      fromSteps: evaluation.fromSteps,
      toSteps: evaluation.toSteps,
      capturedIds,
      reachesHome: evaluation.reachesHome,
      room: this.serializeRoom(room),
    });
  }

  advanceTurn(room, grantBonusTurn) {
    if (!grantBonusTurn) {
      const activeColors = room.players.map((p) => p.color);
      room.turnColor = getNextActivePlayerColor(room.turnColor, activeColors, room.tokens);
      room.consecutiveSixes = 0;
    }
    room.validTokenIds = [];
    room.phase = 'ROLL';
    this.scheduleTurnTimeout(room);
    this.broadcastRoom(room);
  }

  handleReaction(socket, payload) {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    this.io.to(code).emit('player_reaction', {
      id: `${Date.now()}-${Math.random()}`,
      color: player.color,
      username: player.username,
      emoji: String(payload?.emoji || '').slice(0, 8),
      text: String(payload?.text || '').slice(0, 32),
    });
  }

  leaveCurrentRoom(socket) {
    this.removeFromQueues(socket.id);
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;

    this.socketToRoom.delete(socket.id);
    socket.leave(code);

    const room = this.rooms.get(code);
    if (!room) return;

    const leavingPlayer = room.players.find((p) => p.socketId === socket.id);
    if (leavingPlayer) {
      this.uidToRoom.delete(leavingPlayer.uid);
    }

    if (room.status === 'WAITING') {
      room.players = room.players.filter((p) => p.socketId !== socket.id);
      if (room.players.length === 0) {
        this.rooms.delete(code);
      } else {
        if (leavingPlayer && room.hostUid === leavingPlayer.uid) {
          room.hostUid = room.players[0].uid;
        }
        this.broadcastRoom(room);
      }
      return;
    }

    // Active game: mark disconnected and award win if only 1 player remains
    if (leavingPlayer) {
      leavingPlayer.connected = false;
    }
    const connectedPlayers = room.players.filter((p) => p.connected);
    if (connectedPlayers.length <= 1 && room.status === 'PLAYING') {
      if (room.turnTimer) clearTimeout(room.turnTimer);
      room.status = 'FINISHED';
      room.phase = 'GAME_OVER';
      room.winner = connectedPlayers[0]?.color || null;
      room.turnDeadline = null;
      this.broadcastRoom(room);
      setTimeout(() => this.rooms.delete(code), 30000);
    } else {
      if (leavingPlayer && room.turnColor === leavingPlayer.color) {
        this.advanceTurn(room, false);
      } else {
        this.broadcastRoom(room);
      }
    }
  }
}