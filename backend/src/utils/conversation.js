/**
 * Both directions of a one-to-one chat share one key: the two user ids sorted.
 * A single indexed field makes history queries one range scan instead of an
 * $or over two directions, and maps cleanly to a conversationId for group chats.
 */
export const conversationKey = (a, b) => [String(a), String(b)].sort().join('_');

export const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
