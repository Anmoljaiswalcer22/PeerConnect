/**
 * Socket.IO event names. Identical copy of backend/src/socket/events.js.
 * Keep the two files in sync.
 */
export const EVENTS = Object.freeze({
  GET_ONLINE_USERS: 'getOnlineUsers',
  NEW_MESSAGE: 'newMessage',
  TYPING: 'typing',
  STOP_TYPING: 'stopTyping',
  MESSAGE_DELIVERED: 'messageDelivered',
  MESSAGE_READ: 'messageRead',
  MESSAGE_STATUS: 'messageStatus',
  CONVERSATION_READ: 'conversationRead',
  USER_JOINED: 'userJoined',
  USER_UPDATED: 'userUpdated',
});
