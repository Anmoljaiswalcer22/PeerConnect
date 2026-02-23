import mongoose from 'mongoose';
import { Message, toPublicMessage } from '../models/Message.js';
import { PUBLIC_USER_FIELDS, User, toPublicUser } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { conversationKey } from '../utils/conversation.js';
import { FILE_MIME_TYPES, IMAGE_MIME_TYPES, MAX_ATTACHMENT_BYTES, inspectDataUri } from '../utils/dataUri.js';
import { deleteAsset, uploadDataUri } from '../config/cloudinary.js';
import { emitToUser } from '../socket/emitter.js';
import { EVENTS } from '../socket/events.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

async function findPeer(peerId) {
  const peer = await User.findById(peerId).select(PUBLIC_USER_FIELDS).lean();
  if (!peer) throw ApiError.notFound('User not found');
  return peer;
}

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every other user, with the last message exchanged and how many of their
 * messages are unread. Conversations with recent activity come first.
 */
export async function getContacts(me) {
  const meId = toObjectId(me);

  const [users, summaries] = await Promise.all([
    User.find({ _id: { $ne: meId } })
      .select(PUBLIC_USER_FIELDS)
      .sort({ fullName: 1 })
      .limit(500)
      .lean(),
    Message.aggregate([
      { $match: { $or: [{ senderId: meId }, { receiverId: meId }] } },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$senderId', meId] }, '$receiverId', '$senderId'] },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverId', meId] }, { $ne: ['$status', 'read'] }] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const byPeer = new Map(summaries.map((s) => [String(s._id), s]));

  const contacts = users.map((user) => {
    const summary = byPeer.get(String(user._id));
    return {
      ...toPublicUser(user),
      lastMessage: summary ? toPublicMessage(summary.lastMessage) : null,
      unreadCount: summary?.unreadCount ?? 0,
    };
  });

  const lastActivity = (c) => (c.lastMessage ? new Date(c.lastMessage.createdAt).getTime() : 0);
  contacts.sort((a, b) => lastActivity(b) - lastActivity(a) || a.fullName.localeCompare(b.fullName));
  return contacts;
}

/* -------------------------------------------------------------------------- */
/* History                                                                    */
/* -------------------------------------------------------------------------- */

async function findAnchor(key, id) {
  const anchor = await Message.findOne({ _id: id, conversationKey: key }).select('createdAt').lean();
  if (!anchor) throw ApiError.badRequest('Unknown pagination cursor');
  return anchor;
}

/**
 * Cursor pagination on (createdAt, _id), returned oldest → newest.
 *  - no cursor: the latest `limit` messages
 *  - before:    `limit` older messages (infinite scroll upward)
 *  - after:     messages newer than a known one (catch-up after reconnecting)
 */
export async function getConversation(me, peerId, { before, after, limit }) {
  const peer = await findPeer(peerId);
  const key = conversationKey(me, peerId);

  if (after) {
    const anchor = await findAnchor(key, after);
    const messages = await Message.find({
      conversationKey: key,
      $or: [{ createdAt: { $gt: anchor.createdAt } }, { createdAt: anchor.createdAt, _id: { $gt: anchor._id } }],
    })
      .sort({ createdAt: 1, _id: 1 })
      .limit(100);
    return { peer: toPublicUser(peer), messages, hasMore: false };
  }

  const filter = { conversationKey: key };
  if (before) {
    const anchor = await findAnchor(key, before);
    filter.$or = [{ createdAt: { $lt: anchor.createdAt } }, { createdAt: anchor.createdAt, _id: { $lt: anchor._id } }];
  }

  const page = await Message.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1);

  const hasMore = page.length > limit;
  return { peer: toPublicUser(peer), messages: page.slice(0, limit).reverse(), hasMore };
}

/* -------------------------------------------------------------------------- */
/* Sending                                                                    */
/* -------------------------------------------------------------------------- */

async function uploadAttachment({ dataUri, name }) {
  const { mimeType, bytes } = inspectDataUri(dataUri, {
    allowed: [...IMAGE_MIME_TYPES, ...FILE_MIME_TYPES],
    maxBytes: MAX_ATTACHMENT_BYTES,
  });
  const isImage = mimeType.startsWith('image/');
  const uploaded = await uploadDataUri(dataUri, {
    folder: 'attachments',
    resourceType: isImage ? 'image' : 'raw',
    filename: isImage ? undefined : name,
  });
  return {
    type: isImage ? 'image' : 'file',
    attachment: {
      url: uploaded.url,
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
      name,
      size: bytes,
      mimeType,
      width: uploaded.width,
      height: uploaded.height,
    },
  };
}

/**
 * 1. validate the receiver   2. return the existing message if this is a retry
 * 3. upload any attachment    4. save to MongoDB
 * 5. only then emit to the receiver's and sender's rooms (all their tabs)
 */
export async function sendMessage(me, receiverId, { text, clientMessageId, attachment }) {
  if (String(me) === String(receiverId)) throw ApiError.badRequest('You cannot send a message to yourself');
  await findPeer(receiverId);

  const existing = await Message.findOne({ senderId: me, clientMessageId });
  if (existing) return { message: existing, created: false };

  const media = attachment ? await uploadAttachment(attachment) : { type: 'text' };

  let message;
  try {
    message = await Message.create({
      senderId: me,
      receiverId,
      conversationKey: conversationKey(me, receiverId),
      text,
      clientMessageId,
      ...media,
    });
  } catch (err) {
    if (err?.code === 11000) {
      // Two identical retries raced; the other one won.
      if (media.attachment) await deleteAsset(media.attachment.publicId, media.attachment.resourceType);
      const winner = await Message.findOne({ senderId: me, clientMessageId });
      return { message: winner, created: false };
    }
    throw err;
  }

  const payload = message.toJSON();
  emitToUser(receiverId, EVENTS.NEW_MESSAGE, payload);
  emitToUser(me, EVENTS.NEW_MESSAGE, payload); // sync the sender's other tabs
  return { message, created: true };
}

/* -------------------------------------------------------------------------- */
/* Receipts                                                                   */
/* -------------------------------------------------------------------------- */

function notifySenders(messages, status, at) {
  const bySender = new Map();
  for (const m of messages) {
    const sender = String(m.senderId);
    if (!bySender.has(sender)) bySender.set(sender, []);
    bySender.get(sender).push(String(m._id));
  }
  for (const [senderId, ids] of bySender) {
    emitToUser(senderId, EVENTS.MESSAGE_STATUS, { ids, status, at });
  }
}

/**
 * Mark messages addressed to `me` as delivered. With no ids, marks everything
 * still pending (called when the user connects after being offline).
 * @returns number of messages updated
 */
export async function markDelivered(me, messageIds) {
  const filter = { receiverId: me, status: 'sent' };
  if (messageIds) filter._id = { $in: messageIds };

  const pending = await Message.find(filter).select('_id senderId').lean();
  if (pending.length === 0) return 0;

  const at = new Date();
  await Message.updateMany(
    { _id: { $in: pending.map((m) => m._id) }, status: 'sent' },
    { $set: { status: 'delivered', deliveredAt: at } },
  );
  notifySenders(pending, 'delivered', at);
  return pending.length;
}

/** Mark everything `peerId` sent to `me` as read. */
export async function markRead(me, peerId) {
  const unread = await Message.find({ senderId: peerId, receiverId: me, status: { $ne: 'read' } })
    .select('_id senderId status')
    .lean();
  if (unread.length === 0) return 0;

  const at = new Date();
  const ids = unread.map((m) => m._id);
  await Message.updateMany({ _id: { $in: ids }, deliveredAt: null }, { $set: { deliveredAt: at } });
  await Message.updateMany({ _id: { $in: ids } }, { $set: { status: 'read', readAt: at } });

  notifySenders(unread, 'read', at);
  emitToUser(me, EVENTS.CONVERSATION_READ, { peerId: String(peerId) }); // clear badges in other tabs
  return unread.length;
}
