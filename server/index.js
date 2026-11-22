import http from 'http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { RoomManager } from './roomManager.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ludo-royale-multiplayer' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager(io);
const onlineUsers = new Map(); // uid -> { sockets: Set<string>, uid, username, avatar, inGame }

function getPresencePayload() {
  const users = {};
  for (const [uid, info] of onlineUsers.entries()) {
    if (info.sockets.size > 0) {
      users[uid] = {
        online: true,
        inGame: Boolean(info.inGame),
      };
    }
  }
  return { users };
}

function broadcastPresence() {
  io.emit('online_count', { count: io.engine.clientsCount });
  io.emit('presence_snapshot', getPresencePayload());
}

io.on('connection', (socket) => {
  broadcastPresence();

  socket.on('register_user', ({ user }) => {
    if (!user?.uid) return;
    socket.data.uid = user.uid;

    const existing = onlineUsers.get(user.uid);
    if (existing) {
      existing.sockets.add(socket.id);
      existing.username = user.username;
      existing.avatar = user.avatar || existing.avatar;
    } else {
      onlineUsers.set(user.uid, {
        sockets: new Set([socket.id]),
        uid: user.uid,
        username: user.username,
        avatar: user.avatar || 'crown',
        inGame: false,
      });
    }
    broadcastPresence();
  });

  socket.on('request_presence', () => {
    socket.emit('presence_snapshot', getPresencePayload());
  });

  socket.on('set_in_game', ({ inGame }) => {
    const uid = socket.data.uid;
    if (uid && onlineUsers.has(uid)) {
      onlineUsers.get(uid).inGame = Boolean(inGame);
      broadcastPresence();
    }
  });

  socket.on('invite_friend', ({ fromUser, toUid, roomCode }) => {
    if (!fromUser?.uid || !toUid || !roomCode) return;
    const target = onlineUsers.get(toUid);
    if (!target || target.sockets.size === 0) {
      socket.emit('mp_error', { message: 'Friend is currently offline.' });
      return;
    }
    for (const targetSocketId of target.sockets) {
      io.to(targetSocketId).emit('game_invite', {
        id: `${Date.now()}-${Math.random()}`,
        fromUid: fromUser.uid,
        fromUsername: fromUser.username,
        fromAvatar: fromUser.avatar || 'crown',
        roomCode,
        createdAt: Date.now(),
      });
    }
  });

  socket.on('find_match', ({ user, maxPlayers }) => {
    if (!user?.uid) return;
    roomManager.enqueueQuickMatch(socket, user, maxPlayers);
  });

  socket.on('cancel_matchmaking', () => {
    roomManager.cancelQuickMatch(socket);
  });

  socket.on('create_room', ({ user, maxPlayers }) => {
    if (!user?.uid) return;
    roomManager.createPrivateRoom(socket, user, maxPlayers);
  });

  socket.on('join_room', ({ user, code }) => {
    if (!user?.uid) return;
    roomManager.joinPrivateRoom(socket, user, code);
  });

  socket.on('start_private_room', ({ code }) => {
    roomManager.startPrivateMatch(socket, code);
  });

  socket.on('roll_dice', () => {
    roomManager.handleRollDice(socket);
  });

  socket.on('move_token', ({ tokenId }) => {
    roomManager.handleMoveToken(socket, tokenId);
  });

  socket.on('send_reaction', (payload) => {
    roomManager.handleReaction(socket, payload);
  });

  socket.on('leave_room', () => {
    roomManager.leaveCurrentRoom(socket);
  });

  socket.on('disconnect', () => {
    roomManager.leaveCurrentRoom(socket);
    const uid = socket.data.uid;
    if (uid && onlineUsers.has(uid)) {
      const entry = onlineUsers.get(uid);
      entry.sockets.delete(socket.id);
      if (entry.sockets.size === 0) {
        onlineUsers.delete(uid);
      }
    }
    broadcastPresence();
  });
});

server.listen(PORT, () => {
  console.log(`Ludo Royale Multiplayer Server running on http://localhost:${PORT}`);
});