/**
 * Lets services emit socket events without importing the Socket.IO server
 * (avoids circular imports, and services stay testable without sockets).
 *
 * Every socket joins a room named after its user, so emitting to the room
 * reaches every tab and device that user has open.
 */
let ioRef = null;

export const setIo = (io) => {
  ioRef = io;
};

export const userRoom = (userId) => `user:${userId}`;

export function emitToUser(userId, event, payload) {
  ioRef?.to(userRoom(String(userId))).emit(event, payload);
}

export function emitToAll(event, payload) {
  ioRef?.emit(event, payload);
}
