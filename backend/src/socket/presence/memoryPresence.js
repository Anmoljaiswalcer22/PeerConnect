/**
 * In-memory presence: userId → Set of socket ids.
 *
 * A user is online while at least one socket (tab/device) is connected, so
 * closing one of two tabs does not mark them offline.
 *
 * The methods are async on purpose: a RedisPresenceStore with the same
 * interface can replace this one when running several server instances.
 * This store only works with a single Node process.
 */
export class MemoryPresenceStore {
  #sockets = new Map();

  /** @returns {Promise<boolean>} true if this was the user's first socket (went online) */
  async add(userId, socketId) {
    let sockets = this.#sockets.get(userId);
    const wentOnline = !sockets;
    if (!sockets) {
      sockets = new Set();
      this.#sockets.set(userId, sockets);
    }
    sockets.add(socketId);
    return wentOnline;
  }

  /** @returns {Promise<boolean>} true if this was the user's last socket (went offline) */
  async remove(userId, socketId) {
    const sockets = this.#sockets.get(userId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.#sockets.delete(userId);
      return true;
    }
    return false;
  }

  async isOnline(userId) {
    return this.#sockets.has(userId);
  }

  async socketCount(userId) {
    return this.#sockets.get(userId)?.size ?? 0;
  }

  async onlineUserIds() {
    return [...this.#sockets.keys()];
  }
}
