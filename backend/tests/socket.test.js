import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { io as connectClient } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { initSocket } from '../src/socket/index.js';
import { EVENTS } from '../src/socket/events.js';
import { MemoryPresenceStore } from '../src/socket/presence/memoryPresence.js';
import { signAuthToken } from '../src/utils/jwt.js';
import { useTestDatabase } from './helpers/db.js';
import { createUser } from './helpers/users.js';

useTestDatabase();

const app = createApp();
const presence = new MemoryPresenceStore();
let httpServer;
let io;
let url;
const clients = [];

beforeAll(async () => {
  httpServer = http.createServer(app);
  io = initSocket(httpServer, { presence });
  await new Promise((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${httpServer.address().port}`;
});

afterEach(() => {
  while (clients.length) clients.pop().disconnect();
});

afterAll(async () => {
  await new Promise((resolve) => io.close(resolve));
});

/* helpers ------------------------------------------------------------------ */

const waitFor = (socket, event, predicate = () => true, ms = 4000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), ms);
    const handler = (payload) => {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function eventually(check, ms = 3000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await check()) return;
    await sleep(25);
  }
  throw new Error('Condition not met in time');
}

function open(token) {
  const socket = connectClient(url, { auth: { token }, transports: ['websocket'], forceNew: true, reconnection: false });
  clients.push(socket);
  return socket;
}

/** Connect as a user (token from the real REST endpoint) and wait until fully set up. */
async function connectAs(agent) {
  const { body } = await agent.get('/api/auth/socket-token');
  const socket = open(body.data.token);
  await waitFor(socket, EVENTS.GET_ONLINE_USERS); // first event after server-side setup
  return socket;
}

/* tests -------------------------------------------------------------------- */

describe('handshake authentication', () => {
  it('rejects a connection without a token', async () => {
    const socket = open(undefined);
    const err = await waitFor(socket, 'connect_error');
    expect(err.message).toBe('UNAUTHORIZED');
  });

  it('rejects a session (auth) token used as a socket token', async () => {
    const { user } = await createUser(app);
    const socket = open(signAuthToken(user._id));
    const err = await waitFor(socket, 'connect_error');
    expect(err.message).toBe('UNAUTHORIZED');
  });
});

describe('presence', () => {
  it('keeps a user online while any tab is open', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const bobSocket = await connectAs(bob.agent);

    const sawAliceOnline = waitFor(bobSocket, EVENTS.GET_ONLINE_USERS, (ids) => ids.includes(alice.user._id));
    const aliceTab1 = await connectAs(alice.agent);
    await sawAliceOnline;
    const aliceTab2 = await connectAs(alice.agent);
    expect(await presence.socketCount(alice.user._id)).toBe(2);

    aliceTab1.disconnect();
    await eventually(async () => (await presence.socketCount(alice.user._id)) === 1);
    expect(await presence.isOnline(alice.user._id)).toBe(true);

    const sawAliceOffline = waitFor(bobSocket, EVENTS.GET_ONLINE_USERS, (ids) => !ids.includes(alice.user._id));
    aliceTab2.disconnect();
    await sawAliceOffline;
    expect(await presence.isOnline(alice.user._id)).toBe(false);
  });
});

describe('real-time messaging', () => {
  it('pushes a REST-sent message to the receiver and the sender’s other tabs, then reports delivery and read', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const aliceOtherTab = await connectAs(alice.agent);
    const bobSocket = await connectAs(bob.agent);

    const bobGets = waitFor(bobSocket, EVENTS.NEW_MESSAGE);
    const aliceTabGets = waitFor(aliceOtherTab, EVENTS.NEW_MESSAGE);

    const res = await alice.agent
      .post(`/api/messages/send/${bob.user._id}`)
      .send({ text: 'realtime!', clientMessageId: randomUUID() });
    expect(res.status).toBe(201);

    const received = await bobGets;
    expect(received).toMatchObject({ text: 'realtime!', senderId: alice.user._id });
    expect((await aliceTabGets)._id).toBe(received._id);

    const delivered = waitFor(aliceOtherTab, EVENTS.MESSAGE_STATUS, (p) => p.status === 'delivered');
    const ack = await bobSocket.emitWithAck(EVENTS.MESSAGE_DELIVERED, { messageIds: [received._id] });
    expect(ack).toEqual({ ok: true, count: 1 });
    expect((await delivered).ids).toEqual([received._id]);

    const read = waitFor(aliceOtherTab, EVENTS.MESSAGE_STATUS, (p) => p.status === 'read');
    const readAck = await bobSocket.emitWithAck(EVENTS.MESSAGE_READ, { peerId: alice.user._id });
    expect(readAck.ok).toBe(true);
    expect((await read).ids).toEqual([received._id]);
  });

  it('marks messages sent while offline as delivered when the receiver connects', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const aliceSocket = await connectAs(alice.agent);

    await alice.agent.post(`/api/messages/send/${bob.user._id}`).send({ text: 'offline msg', clientMessageId: randomUUID() });

    const delivered = waitFor(aliceSocket, EVENTS.MESSAGE_STATUS, (p) => p.status === 'delivered');
    await connectAs(bob.agent);
    expect((await delivered).ids).toHaveLength(1);
  });

  it('rejects malformed receipt payloads', async () => {
    const bob = await createUser(app);
    const socket = await connectAs(bob.agent);
    expect(await socket.emitWithAck(EVENTS.MESSAGE_DELIVERED, { messageIds: 'nope' })).toEqual({
      ok: false,
      error: 'INVALID_PAYLOAD',
    });
    expect(await socket.emitWithAck(EVENTS.MESSAGE_READ, { peerId: '$ne' })).toEqual({ ok: false, error: 'INVALID_PAYLOAD' });
  });
});

describe('typing indicators', () => {
  it('relays typing and stopTyping to the other user', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const aliceSocket = await connectAs(alice.agent);
    const bobSocket = await connectAs(bob.agent);

    const typing = waitFor(bobSocket, EVENTS.TYPING);
    aliceSocket.emit(EVENTS.TYPING, { to: bob.user._id });
    expect(await typing).toEqual({ from: alice.user._id });

    const stopped = waitFor(bobSocket, EVENTS.STOP_TYPING);
    aliceSocket.emit(EVENTS.STOP_TYPING, { to: bob.user._id });
    expect(await stopped).toEqual({ from: alice.user._id });
  });

  it('clears the indicator if the typist disconnects', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);
    const aliceSocket = await connectAs(alice.agent);
    const bobSocket = await connectAs(bob.agent);

    const typing = waitFor(bobSocket, EVENTS.TYPING);
    aliceSocket.emit(EVENTS.TYPING, { to: bob.user._id });
    await typing;

    const stopped = waitFor(bobSocket, EVENTS.STOP_TYPING);
    aliceSocket.disconnect();
    expect(await stopped).toEqual({ from: alice.user._id });
  });
});
