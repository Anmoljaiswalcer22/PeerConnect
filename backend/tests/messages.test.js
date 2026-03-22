import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Message } from '../src/models/Message.js';
import { markDelivered, markRead } from '../src/services/message.service.js';
import { useTestDatabase } from './helpers/db.js';
import { createUser } from './helpers/users.js';

useTestDatabase();
const app = createApp();

const send = (agent, to, text, clientMessageId = randomUUID()) =>
  agent.post(`/api/messages/send/${to}`).send({ text, clientMessageId });

describe('POST /api/messages/send/:id', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/messages/send/64b000000000000000000000')
      .send({ text: 'hi', clientMessageId: randomUUID() });
    expect(res.status).toBe(401);
  });

  it('saves the message and returns 201', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);

    const res = await send(alice.agent, bob.user._id, '  Hello Bob  ');
    expect(res.status).toBe(201);
    expect(res.body.data.message).toMatchObject({
      senderId: alice.user._id,
      receiverId: bob.user._id,
      text: 'Hello Bob',
      type: 'text',
      status: 'sent',
    });
    expect(res.body.data.message.conversationKey).toBeUndefined();
    expect(await Message.countDocuments()).toBe(1);
  });

  it('is idempotent: retrying with the same clientMessageId never duplicates', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const id = randomUUID();

    const first = await send(alice.agent, bob.user._id, 'once', id);
    const retry = await send(alice.agent, bob.user._id, 'once', id);

    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.data.message._id).toBe(first.body.data.message._id);
    expect(await Message.countDocuments()).toBe(1);
  });

  it.each([
    ['empty text', { text: '   ', clientMessageId: randomUUID() }],
    ['text too long', { text: 'x'.repeat(2001), clientMessageId: randomUUID() }],
    ['missing clientMessageId', { text: 'hi' }],
    ['invalid clientMessageId', { text: 'hi', clientMessageId: '123' }],
    ['unknown field', { text: 'hi', clientMessageId: randomUUID(), senderId: 'x' }],
  ])('rejects an invalid payload: %s', async (_name, body) => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const res = await alice.agent.post(`/api/messages/send/${bob.user._id}`).send(body);
    expect(res.status).toBe(400);
  });

  it('rejects an invalid receiver id, an unknown receiver, and yourself', async () => {
    const alice = await createUser(app);
    expect((await send(alice.agent, 'not-an-id', 'hi')).status).toBe(400);
    expect((await send(alice.agent, '64b000000000000000000000', 'hi')).status).toBe(404);
    expect((await send(alice.agent, alice.user._id, 'hi')).status).toBe(400);
  });

  it('rejects attachments when uploads are not configured', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const res = await alice.agent.post(`/api/messages/send/${bob.user._id}`).send({
      clientMessageId: randomUUID(),
      attachment: { dataUri: 'data:text/plain;base64,aGVsbG8=', name: 'hello.txt' },
    });
    expect(res.status).toBe(503);
  });
});

describe('GET /api/messages/:id', () => {
  it('returns both directions, oldest first, with the peer', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    await send(alice.agent, bob.user._id, 'one');
    await send(bob.agent, alice.user._id, 'two');
    await send(alice.agent, bob.user._id, 'three');

    const res = await alice.agent.get(`/api/messages/${bob.user._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.messages.map((m) => m.text)).toEqual(['one', 'two', 'three']);
    expect(res.body.data.peer._id).toBe(bob.user._id);
    expect(res.body.data.peer.email).toBeUndefined(); // other users' emails stay private
    expect(res.body.data.hasMore).toBe(false);
  });

  it('does not leak other conversations', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const carol = await createUser(app);
    await send(bob.agent, carol.user._id, 'private');

    const res = await alice.agent.get(`/api/messages/${bob.user._id}`);
    expect(res.body.data.messages).toHaveLength(0);
  });

  it('paginates with before / after cursors', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    for (let i = 1; i <= 5; i += 1) await send(alice.agent, bob.user._id, `m${i}`);

    const latest = await alice.agent.get(`/api/messages/${bob.user._id}?limit=2`);
    expect(latest.body.data.messages.map((m) => m.text)).toEqual(['m4', 'm5']);
    expect(latest.body.data.hasMore).toBe(true);

    const older = await alice.agent.get(`/api/messages/${bob.user._id}?limit=2&before=${latest.body.data.messages[0]._id}`);
    expect(older.body.data.messages.map((m) => m.text)).toEqual(['m2', 'm3']);

    const oldest = await alice.agent.get(`/api/messages/${bob.user._id}?limit=2&before=${older.body.data.messages[0]._id}`);
    expect(oldest.body.data.messages.map((m) => m.text)).toEqual(['m1']);
    expect(oldest.body.data.hasMore).toBe(false);

    const newer = await alice.agent.get(`/api/messages/${bob.user._id}?after=${older.body.data.messages[1]._id}`);
    expect(newer.body.data.messages.map((m) => m.text)).toEqual(['m4', 'm5']);
  });

  it('validates query parameters', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    expect((await alice.agent.get(`/api/messages/${bob.user._id}?limit=500`)).status).toBe(400);
    expect((await alice.agent.get(`/api/messages/${bob.user._id}?before=xyz`)).status).toBe(400);
  });
});

describe('GET /api/messages/users', () => {
  it('lists other users with last message and unread count, most recent first', async () => {
    const alice = await createUser(app, { fullName: 'Alice' });
    const bob = await createUser(app, { fullName: 'Bob' });
    const carol = await createUser(app, { fullName: 'Carol' });

    await send(bob.agent, alice.user._id, 'hey alice');
    await send(bob.agent, alice.user._id, 'you there?');

    const res = await alice.agent.get('/api/messages/users');
    expect(res.status).toBe(200);
    const users = res.body.data.users;

    expect(users.map((u) => u.fullName)).toEqual(['Bob', 'Carol']); // not Alice herself
    expect(users[0]).toMatchObject({ unreadCount: 2, lastMessage: { text: 'you there?' } });
    expect(users[1]).toMatchObject({ unreadCount: 0, lastMessage: null });
    expect(users[0].email).toBeUndefined();
    expect(carol).toBeTruthy();
  });
});

describe('receipts', () => {
  it('marks messages delivered and then read', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const { body } = await send(alice.agent, bob.user._id, 'status?');
    const id = body.data.message._id;

    expect(await markDelivered(bob.user._id, [id])).toBe(1);
    expect((await Message.findById(id)).status).toBe('delivered');

    // Only the receiver can mark a message delivered
    expect(await markDelivered(alice.user._id, [id])).toBe(0);

    expect(await markRead(bob.user._id, alice.user._id)).toBe(1);
    const read = await Message.findById(id);
    expect(read.status).toBe('read');
    expect(read.readAt).toBeInstanceOf(Date);

    const contacts = await bob.agent.get('/api/messages/users');
    expect(contacts.body.data.users[0].unreadCount).toBe(0);
  });
});
