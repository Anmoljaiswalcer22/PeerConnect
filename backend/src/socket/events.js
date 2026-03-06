/**
 * Every Socket.IO event name lives here. The frontend has an identical copy in
 * frontend/src/constants/socketEvents.js. Keep the two files in sync.
 *
 * Direction legend:  C→S client to server,  S→C server to client
 */
export const EVENTS = Object.freeze({
  GET_ONLINE_USERS: 'getOnlineUsers', // S→C  string[] of online user ids
  NEW_MESSAGE: 'newMessage', //           S→C  message (to receiver's and sender's rooms)
  TYPING: 'typing', //                    C→S {to}   S→C {from}
  STOP_TYPING: 'stopTyping', //           C→S {to}   S→C {from}
  MESSAGE_DELIVERED: 'messageDelivered', // C→S {messageIds} + ack
  MESSAGE_READ: 'messageRead', //         C→S {peerId} + ack
  MESSAGE_STATUS: 'messageStatus', //     S→C {ids, status, at} to the original sender
  CONVERSATION_READ: 'conversationRead', // S→C {peerId} to the reader's other tabs
  USER_JOINED: 'userJoined', //           S→C public user (new sign-up)
  USER_UPDATED: 'userUpdated', //         S→C public user (profile change)
});
