import { EVENTS } from '../events.js';
import { userRoom } from '../emitter.js';
import { isObjectId } from '../../utils/conversation.js';

const RELAY_THROTTLE_MS = 1000;

/**
 * Relays typing / stopTyping to the other user's room. Nothing is stored.
 * The server throttles relays per recipient and sends stopTyping for every
 * open indicator if the socket disconnects mid-typing.
 */
export function registerTypingHandlers(io, socket) {
  const userId = socket.data.userId;
  const lastRelay = new Map(); // recipient → timestamp

  socket.on(EVENTS.TYPING, (payload) => {
    const to = payload?.to;
    if (!isObjectId(to) || to === userId) return;

    const now = Date.now();
    if (now - (lastRelay.get(to) ?? 0) < RELAY_THROTTLE_MS) return;
    lastRelay.set(to, now);

    io.to(userRoom(to)).emit(EVENTS.TYPING, { from: userId });
  });

  socket.on(EVENTS.STOP_TYPING, (payload) => {
    const to = payload?.to;
    if (!isObjectId(to) || !lastRelay.delete(to)) return;
    io.to(userRoom(to)).emit(EVENTS.STOP_TYPING, { from: userId });
  });

  socket.on('disconnect', () => {
    for (const to of lastRelay.keys()) {
      io.to(userRoom(to)).emit(EVENTS.STOP_TYPING, { from: userId });
    }
    lastRelay.clear();
  });
}
