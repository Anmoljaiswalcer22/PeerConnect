import { Server } from 'socket.io';
import { isAllowedOrigin } from '../config/cors.js';
import { User } from '../models/User.js';
import { markDelivered } from '../services/message.service.js';
import { logger } from '../utils/logger.js';
import { verifyToken } from '../utils/jwt.js';
import { setIo, userRoom } from './emitter.js';
import { EVENTS } from './events.js';
import { registerReceiptHandlers } from './handlers/receipts.js';
import { registerTypingHandlers } from './handlers/typing.js';
import { MemoryPresenceStore } from './presence/memoryPresence.js';

const unauthorized = () => {
  const err = new Error('UNAUTHORIZED');
  err.data = { code: 'UNAUTHORIZED' };
  return err;
};

/**
 * Handshake authentication. The client never says who it is: it presents a
 * short-lived socket token (from GET /api/auth/socket-token) and the server
 * derives the user id from the verified signature.
 */
async function authenticate(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) return next(unauthorized());

    const { sub } = verifyToken(token, 'socket');
    if (!(await User.exists({ _id: sub }))) return next(unauthorized());

    socket.data.userId = sub;
    return next();
  } catch {
    return next(unauthorized());
  }
}

/**
 * Attach Socket.IO to the HTTP server.
 * @param presence a presence store. Pass a Redis-backed one when scaling out.
 */
export function initSocket(httpServer, { presence = new MemoryPresenceStore() } = {}) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      credentials: true,
    },
    maxHttpBufferSize: 64 * 1024, // socket events are small; files go through REST
  });

  setIo(io);
  io.use(authenticate);

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;

    // Register handlers synchronously so no early client event is missed.
    registerTypingHandlers(io, socket);
    registerReceiptHandlers(socket);

    socket.on('disconnect', async () => {
      try {
        const wentOffline = await presence.remove(userId, socket.id);
        if (wentOffline) {
          await User.updateOne({ _id: userId }, { $set: { lastSeen: new Date() } });
          io.emit(EVENTS.GET_ONLINE_USERS, await presence.onlineUserIds());
        }
      } catch (err) {
        logger.error({ err, userId }, 'Socket disconnect handling failed');
      }
    });

    try {
      socket.join(userRoom(userId));
      const wentOnline = await presence.add(userId, socket.id);

      // The socket may have dropped while we were awaiting; undo so presence stays accurate.
      if (socket.disconnected) {
        if (await presence.remove(userId, socket.id)) {
          io.emit(EVENTS.GET_ONLINE_USERS, await presence.onlineUserIds());
        }
        return;
      }

      const online = await presence.onlineUserIds();

      // A new user coming online changes everyone's list; an extra tab only needs its own copy.
      if (wentOnline) io.emit(EVENTS.GET_ONLINE_USERS, online);
      else socket.emit(EVENTS.GET_ONLINE_USERS, online);

      // Messages sent while this user was offline are now delivered.
      await markDelivered(userId);
      logger.debug({ userId, socketId: socket.id }, 'Socket connected');
    } catch (err) {
      logger.error({ err, userId }, 'Socket connection setup failed');
    }
  });

  return io;
}
