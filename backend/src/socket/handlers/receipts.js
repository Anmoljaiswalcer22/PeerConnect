import { EVENTS } from '../events.js';
import { markDelivered, markRead } from '../../services/message.service.js';
import { isObjectId } from '../../utils/conversation.js';
import { logger } from '../../utils/logger.js';

/**
 * Delivery and read receipts. Both use Socket.IO acknowledgements so the
 * client knows the server processed them:
 *   socket.emit('messageDelivered', { messageIds }, (res) => res.ok)
 */
export function registerReceiptHandlers(socket) {
  const userId = socket.data.userId;

  const withAck = (handler) => async (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    try {
      reply(await handler(payload ?? {}));
    } catch (err) {
      logger.error({ err, userId }, 'Socket receipt handler failed');
      reply({ ok: false, error: 'SERVER_ERROR' });
    }
  };

  socket.on(
    EVENTS.MESSAGE_DELIVERED,
    withAck(async ({ messageIds }) => {
      const valid = Array.isArray(messageIds) && messageIds.length > 0 && messageIds.length <= 200 && messageIds.every(isObjectId);
      if (!valid) return { ok: false, error: 'INVALID_PAYLOAD' };
      return { ok: true, count: await markDelivered(userId, messageIds) };
    }),
  );

  socket.on(
    EVENTS.MESSAGE_READ,
    withAck(async ({ peerId }) => {
      if (!isObjectId(peerId) || peerId === userId) return { ok: false, error: 'INVALID_PAYLOAD' };
      return { ok: true, count: await markRead(userId, peerId) };
    }),
  );
}
