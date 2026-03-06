import { create } from 'zustand';
import toast from 'react-hot-toast';
import * as messageApi from '../services/message.api';
import { getErrorMessage } from '../lib/axios';
import { EVENTS } from '../constants/socketEvents';
import { createClientId } from '../utils/files';

const STATUS_RANK = { failed: -1, sending: 0, sent: 1, delivered: 2, read: 3 };
const TYPING_TIMEOUT_MS = 5000;

const byTime = (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || (a._id > b._id ? 1 : -1);

/** Insert or replace a message (matched by _id or clientMessageId), keeping order. */
function upsert(messages, incoming) {
  const index = messages.findIndex(
    (m) => m._id === incoming._id || (incoming.clientMessageId && m.clientMessageId === incoming.clientMessageId),
  );
  if (index === -1) return [...messages, incoming].sort(byTime);

  const current = messages[index];
  // Never downgrade a status (e.g. a late "sent" echo after "read").
  const status = STATUS_RANK[current.status] > STATUS_RANK[incoming.status] ? current.status : incoming.status;
  // Keep the local image preview until the uploaded image is in the list.
  const next = [...messages];
  next[index] = { ...current, ...incoming, status, localPreview: current.localPreview };
  return next;
}

const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';

/* Per-socket state that doesn't belong in React state */
let socket = null;
let myId = null;
const typingTimers = new Map();

const SOCKET_EVENTS = [
  EVENTS.NEW_MESSAGE,
  EVENTS.MESSAGE_STATUS,
  EVENTS.TYPING,
  EVENTS.STOP_TYPING,
  EVENTS.CONVERSATION_READ,
  EVENTS.USER_JOINED,
  EVENTS.USER_UPDATED,
];

const initialState = {
  contacts: [],
  isContactsLoading: false,
  contactsError: null,

  selectedUserId: null,
  peer: null,
  messages: [],
  hasMore: false,
  isMessagesLoading: false,
  isLoadingOlder: false,
  messagesError: null,

  typing: {}, // userId → true
};

export const useChatStore = create((set, get) => ({
  ...initialState,

  /* ---------------------------------------------------------------- */
  /* Contacts                                                          */
  /* ---------------------------------------------------------------- */

  async fetchContacts({ silent = false } = {}) {
    if (!silent) set({ isContactsLoading: true, contactsError: null });
    try {
      const contacts = await messageApi.fetchContacts();
      set({ contacts, contactsError: null });
    } catch (error) {
      if (!silent) set({ contactsError: getErrorMessage(error) });
    } finally {
      if (!silent) set({ isContactsLoading: false });
    }
  },

  updateContact(userId, updater) {
    set((s) => ({ contacts: s.contacts.map((c) => (c._id === userId ? { ...c, ...updater(c) } : c)) }));
  },

  /** Move a contact to the top and set its last message. */
  bumpContact(userId, message, { incrementUnread = false } = {}) {
    set((s) => {
      const contact = s.contacts.find((c) => c._id === userId);
      if (!contact) return {};
      const updated = {
        ...contact,
        lastMessage: message,
        unreadCount: incrementUnread ? (contact.unreadCount ?? 0) + 1 : contact.unreadCount,
      };
      return { contacts: [updated, ...s.contacts.filter((c) => c._id !== userId)] };
    });
  },

  markUsersOffline(userIds) {
    if (!userIds.length) return;
    const now = new Date().toISOString();
    set((s) => ({
      contacts: s.contacts.map((c) => (userIds.includes(c._id) ? { ...c, lastSeen: now } : c)),
      peer: s.peer && userIds.includes(s.peer._id) ? { ...s.peer, lastSeen: now } : s.peer,
    }));
  },

  /* ---------------------------------------------------------------- */
  /* Conversation                                                      */
  /* ---------------------------------------------------------------- */

  async selectUser(userId) {
    if (get().selectedUserId === userId) return;
    const contact = get().contacts.find((c) => c._id === userId) ?? null;
    set({
      selectedUserId: userId,
      peer: contact,
      messages: [],
      hasMore: false,
      messagesError: null,
      isMessagesLoading: Boolean(userId),
    });
    if (!userId) return;

    try {
      const { peer, messages, hasMore } = await messageApi.fetchConversation(userId);
      if (get().selectedUserId !== userId) return; // user switched chats meanwhile
      set({ peer, hasMore, messages: messages.reduce(upsert, get().messages) });
      get().markConversationRead(userId);
    } catch (error) {
      if (get().selectedUserId !== userId) return;
      set({ messagesError: error?.response?.status === 404 ? 'not-found' : getErrorMessage(error) });
    } finally {
      if (get().selectedUserId === userId) set({ isMessagesLoading: false });
    }
  },

  async loadOlder() {
    const { selectedUserId, messages, hasMore, isLoadingOlder } = get();
    const oldest = messages.find((m) => !m._id.startsWith('temp-'));
    if (!selectedUserId || !hasMore || isLoadingOlder || !oldest) return;

    set({ isLoadingOlder: true });
    try {
      const page = await messageApi.fetchConversation(selectedUserId, { before: oldest._id });
      if (get().selectedUserId !== selectedUserId) return;
      set((s) => ({ messages: page.messages.reduce(upsert, s.messages), hasMore: page.hasMore }));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load older messages'));
    } finally {
      set({ isLoadingOlder: false });
    }
  },

  /** Catch up after a reconnect: anything we missed while the socket was down. */
  async resync() {
    get().fetchContacts({ silent: true });
    const { selectedUserId, messages } = get();
    if (!selectedUserId) return;
    const lastSaved = [...messages].reverse().find((m) => !m._id.startsWith('temp-'));
    try {
      const page = await messageApi.fetchConversation(selectedUserId, lastSaved ? { after: lastSaved._id } : {});
      if (get().selectedUserId !== selectedUserId) return;
      set((s) => ({ messages: page.messages.reduce(upsert, s.messages) }));
      get().markConversationRead(selectedUserId);
    } catch {
      /* the next reconnect or chat switch will try again */
    }
  },

  /* ---------------------------------------------------------------- */
  /* Sending                                                           */
  /* ---------------------------------------------------------------- */

  /**
   * Optimistic send: the bubble appears instantly ("sending"), then is replaced
   * by the saved message. The clientMessageId makes retries safe.
   * attachment: { dataUrl, name, size, mimeType, width, height } | undefined
   */
  async sendMessage({ text = '', attachment } = {}) {
    const receiverId = get().selectedUserId;
    if (!receiverId || !myId) return;

    const clientMessageId = createClientId();
    const isImage = attachment?.mimeType?.startsWith('image/');
    const optimistic = {
      _id: `temp-${clientMessageId}`,
      clientMessageId,
      senderId: myId,
      receiverId,
      text: text.trim(),
      type: attachment ? (isImage ? 'image' : 'file') : 'text',
      attachment: attachment
        ? { name: attachment.name, size: attachment.size, mimeType: attachment.mimeType, width: attachment.width, height: attachment.height }
        : undefined,
      localPreview: isImage ? attachment.dataUrl : undefined,
      pendingUpload: attachment ? { dataUri: attachment.dataUrl, name: attachment.name } : undefined,
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    set((s) => ({ messages: upsert(s.messages, optimistic) }));
    get().bumpContact(receiverId, optimistic);
    await get().deliver(optimistic);
  },

  async retryMessage(clientMessageId) {
    const message = get().messages.find((m) => m.clientMessageId === clientMessageId);
    if (!message || message.status !== 'failed') return;
    set((s) => ({ messages: upsert(s.messages, { ...message, status: 'sending' }) }));
    await get().deliver(message);
  },

  discardMessage(clientMessageId) {
    set((s) => ({ messages: s.messages.filter((m) => m.clientMessageId !== clientMessageId) }));
  },

  async deliver(message) {
    const { receiverId, clientMessageId, text, pendingUpload } = message;
    try {
      const saved = await messageApi.sendMessage(receiverId, {
        text,
        clientMessageId,
        ...(pendingUpload && { attachment: pendingUpload }),
      });
      set((s) => ({ messages: upsert(s.messages, { ...saved, pendingUpload: undefined }) }));
      get().bumpContact(receiverId, saved);
    } catch (error) {
      set((s) => ({ messages: upsert(s.messages, { ...message, status: 'failed' }) }));
      toast.error(getErrorMessage(error, 'Message not sent'));
    }
  },

  /* ---------------------------------------------------------------- */
  /* Receipts & typing (outgoing)                                      */
  /* ---------------------------------------------------------------- */

  markConversationRead(peerId) {
    if (!peerId || !isVisible()) return;
    const contact = get().contacts.find((c) => c._id === peerId);
    const hasUnread =
      (contact?.unreadCount ?? 0) > 0 || get().messages.some((m) => m.senderId === peerId && m.status !== 'read');
    if (!hasUnread) return;

    get().updateContact(peerId, () => ({ unreadCount: 0 }));
    socket?.emit(EVENTS.MESSAGE_READ, { peerId });
  },

  emitTyping(to) {
    socket?.emit(EVENTS.TYPING, { to });
  },

  emitStopTyping(to) {
    socket?.emit(EVENTS.STOP_TYPING, { to });
  },

  /* ---------------------------------------------------------------- */
  /* Incoming socket events                                            */
  /* ---------------------------------------------------------------- */

  handleNewMessage(message) {
    const fromMe = message.senderId === myId;
    const peerId = fromMe ? message.receiverId : message.senderId;
    const { selectedUserId, contacts } = get();
    const isOpen = selectedUserId === peerId;

    if (!fromMe) {
      socket?.emit(EVENTS.MESSAGE_DELIVERED, { messageIds: [message._id] });
      get().clearTyping(peerId);
    }

    if (isOpen) set((s) => ({ messages: upsert(s.messages, message) }));

    if (!contacts.some((c) => c._id === peerId)) {
      get().fetchContacts({ silent: true });
    } else {
      get().bumpContact(peerId, message, { incrementUnread: !fromMe && !(isOpen && isVisible()) });
    }

    if (!fromMe && isOpen) get().markConversationRead(peerId);
  },

  handleMessageStatus({ ids, status }) {
    const idSet = new Set(ids);
    const upgrade = (m) => (idSet.has(m._id) && STATUS_RANK[status] > STATUS_RANK[m.status] ? { ...m, status } : m);
    set((s) => ({
      messages: s.messages.map(upgrade),
      contacts: s.contacts.map((c) => (c.lastMessage ? { ...c, lastMessage: upgrade(c.lastMessage) } : c)),
    }));
  },

  handleTyping({ from }) {
    clearTimeout(typingTimers.get(from));
    typingTimers.set(
      from,
      setTimeout(() => get().clearTyping(from), TYPING_TIMEOUT_MS),
    );
    if (!get().typing[from]) set((s) => ({ typing: { ...s.typing, [from]: true } }));
  },

  clearTyping(userId) {
    clearTimeout(typingTimers.get(userId));
    typingTimers.delete(userId);
    if (!get().typing[userId]) return;
    set((s) => {
      const typing = { ...s.typing };
      delete typing[userId];
      return { typing };
    });
  },

  handleUserJoined(user) {
    if (user._id === myId || get().contacts.some((c) => c._id === user._id)) return;
    set((s) => ({ contacts: [...s.contacts, { ...user, lastMessage: null, unreadCount: 0 }] }));
  },

  handleUserUpdated(user) {
    get().updateContact(user._id, () => ({ fullName: user.fullName, profilePic: user.profilePic }));
    set((s) => (s.peer?._id === user._id ? { peer: { ...s.peer, ...user } } : {}));
  },

  /* ---------------------------------------------------------------- */
  /* Socket wiring                                                     */
  /* ---------------------------------------------------------------- */

  /**
   * Registers each handler exactly once per socket (off → on), so switching
   * chats never stacks duplicate listeners. Handlers read the current chat via
   * get(), so they never need re-subscribing.
   */
  attachSocket(nextSocket, userId) {
    get().detachSocket();
    socket = nextSocket;
    myId = userId;
    const handlers = {
      [EVENTS.NEW_MESSAGE]: (m) => get().handleNewMessage(m),
      [EVENTS.MESSAGE_STATUS]: (p) => get().handleMessageStatus(p),
      [EVENTS.TYPING]: (p) => get().handleTyping(p),
      [EVENTS.STOP_TYPING]: (p) => get().clearTyping(p.from),
      [EVENTS.CONVERSATION_READ]: ({ peerId }) => get().updateContact(peerId, () => ({ unreadCount: 0 })),
      [EVENTS.USER_JOINED]: (u) => get().handleUserJoined(u),
      [EVENTS.USER_UPDATED]: (u) => get().handleUserUpdated(u),
    };
    for (const [event, handler] of Object.entries(handlers)) {
      socket.off(event);
      socket.on(event, handler);
    }
  },

  detachSocket() {
    if (socket) for (const event of SOCKET_EVENTS) socket.off(event);
    socket = null;
  },

  reset() {
    get().detachSocket();
    myId = null;
    for (const timer of typingTimers.values()) clearTimeout(timer);
    typingTimers.clear();
    set(initialState);
  },
}));
