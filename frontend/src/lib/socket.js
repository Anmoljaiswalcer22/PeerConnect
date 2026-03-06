import { io } from 'socket.io-client';
import { fetchSocketToken } from '../services/auth.api';

// Empty in development (Vite proxies /socket.io); the Render URL on Vercel.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.trim() || undefined;

/**
 * Creates (but doesn't connect) the Socket.IO client. Before every connection
 * attempt, including automatic reconnects, it fetches a fresh 2-minute socket
 * token over the cookie-authenticated REST API and sends it in the handshake.
 */
export function createSocket() {
  return io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: false,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    auth: (cb) => {
      fetchSocketToken()
        .then((token) => cb({ token }))
        .catch(() => cb({}));
    },
  });
}
