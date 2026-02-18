import { create } from 'zustand';
import toast from 'react-hot-toast';
import * as authApi from '../services/auth.api';
import { getErrorMessage, setUnauthorizedHandler } from '../lib/axios';
import { createSocket } from '../lib/socket';
import { EVENTS } from '../constants/socketEvents';
import { useChatStore } from './chatStore';
import { firstName } from '../utils/format';

let reconnectTimer = null;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,

  socket: null,
  // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  socketStatus: 'disconnected',
  onlineUserIds: [],

  /* ---------------------------------------------------------------- */
  /* Session                                                           */
  /* ---------------------------------------------------------------- */

  /** Restore the session from the httpOnly cookie on page load. */
  async checkAuth() {
    try {
      const user = await authApi.checkAuth();
      set({ authUser: user });
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  /** @returns {Promise<{ ok: boolean, error?: unknown }>} */
  async signup(data) {
    set({ isSigningUp: true });
    try {
      const user = await authApi.signup(data);
      set({ authUser: user });
      toast.success(`Welcome to PeerConnect, ${firstName(user.fullName)}!`);
      get().connectSocket();
      return { ok: true };
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create your account'));
      return { ok: false, error };
    } finally {
      set({ isSigningUp: false });
    }
  },

  async login(data) {
    set({ isLoggingIn: true });
    try {
      const user = await authApi.login(data);
      set({ authUser: user });
      toast.success(`Welcome back, ${firstName(user.fullName)}`);
      get().connectSocket();
      return { ok: true };
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not log you in'));
      return { ok: false, error };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } catch {
      /* clear local state anyway */
    }
    get().endSession();
    toast.success('Logged out');
  },

  /** Called when any API call returns 401 (expired/invalid session). */
  handleSessionExpired() {
    if (!get().authUser) return;
    get().endSession();
    toast.error('Your session has expired. Please log in again.');
  },

  endSession() {
    get().disconnectSocket();
    useChatStore.getState().reset();
    set({ authUser: null });
  },

  async updateProfile(data) {
    set({ isUpdatingProfile: true });
    try {
      const user = await authApi.updateProfile(data);
      set({ authUser: user });
      toast.success('Profile updated');
      return { ok: true };
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update your profile'));
      return { ok: false, error };
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  /* ---------------------------------------------------------------- */
  /* Socket lifecycle (tied to the session)                            */
  /* ---------------------------------------------------------------- */

  connectSocket() {
    const { authUser, socket: existing } = get();
    if (!authUser || existing) return;

    const socket = createSocket();
    let hasConnected = false;

    socket.on('connect', () => {
      set({ socketStatus: 'connected' });
      // After a reconnect, fetch anything missed while offline.
      if (hasConnected) useChatStore.getState().resync();
      hasConnected = true;
    });

    socket.on('disconnect', (reason) => {
      if (get().socket !== socket) return;
      set({ socketStatus: 'reconnecting' });
      // The server closed the connection deliberately; Socket.IO won't retry on its own.
      if (reason === 'io server disconnect') socket.connect();
    });

    socket.on('connect_error', () => {
      if (get().socket !== socket) return;
      set({ socketStatus: hasConnected ? 'reconnecting' : 'connecting' });
      // `active` is false when the server rejected the handshake (e.g. token
      // problem). Re-check the session, then try again with a fresh token.
      if (!socket.active) {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(async () => {
          if (get().socket !== socket) return;
          try {
            await authApi.checkAuth();
            socket.connect();
          } catch (error) {
            if (error?.response?.status === 401) get().handleSessionExpired();
            else socket.connect();
          }
        }, 3000);
      }
    });

    socket.on(EVENTS.GET_ONLINE_USERS, (ids) => {
      const previous = get().onlineUserIds;
      const wentOffline = previous.filter((id) => !ids.includes(id));
      set({ onlineUserIds: ids });
      useChatStore.getState().markUsersOffline(wentOffline);
    });

    useChatStore.getState().attachSocket(socket, authUser._id);
    set({ socket, socketStatus: 'connecting' });
    socket.connect();
  },

  disconnectSocket() {
    clearTimeout(reconnectTimer);
    const { socket } = get();
    if (!socket) return;
    useChatStore.getState().detachSocket();
    socket.removeAllListeners();
    socket.disconnect();
    set({ socket: null, socketStatus: 'disconnected', onlineUserIds: [] });
  },
}));

setUnauthorizedHandler(() => useAuthStore.getState().handleSessionExpired());

/** Selector: is this user online right now? */
export const useIsOnline = (userId) => useAuthStore((s) => Boolean(userId) && s.onlineUserIds.includes(userId));
