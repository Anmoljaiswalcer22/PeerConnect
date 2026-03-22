import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { signSocketToken } from '../src/utils/jwt.js';
import { useTestDatabase } from './helpers/db.js';
import { createUser } from './helpers/users.js';

useTestDatabase();
const app = createApp();

const valid = { fullName: 'Asha Verma', email: 'Asha@Example.com', password: 'secret123' };

describe('POST /api/auth/signup', () => {
  it('creates the user, hashes the password and sets an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/signup').send(valid);

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ fullName: 'Asha Verma', email: 'asha@example.com' });
    expect(res.body.data.user.password).toBeUndefined();

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^pc_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    expect(stored.password).not.toBe('secret123');
    expect(stored.password).toMatch(/^\$2[aby]\$/); // bcrypt hash
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/signup').send(valid);
    const res = await request(app).post('/api/auth/signup').send({ ...valid, email: 'asha@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates every field and reports details', async () => {
    const res = await request(app).post('/api/auth/signup').send({ fullName: 'A', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['fullName', 'email', 'password']));
  });

  it('rejects unexpected fields (no mass assignment)', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...valid, isAdmin: true });
    expect(res.status).toBe(400);
  });

  it('rejects NoSQL operator injection', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: '' }, password: { $ne: '' } });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password (email is case-insensitive)', async () => {
    await request(app).post('/api/auth/signup').send(valid);
    const res = await request(app).post('/api/auth/login').send({ email: 'ASHA@example.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/^pc_token=/);
  });

  it('returns the same generic 401 for a wrong password and an unknown email', async () => {
    await request(app).post('/api/auth/signup').send(valid);
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: valid.email, password: 'wrong999' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'x' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });
});

describe('session', () => {
  it('GET /check returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/auth/check');
    expect(res.status).toBe(401);
  });

  it('GET /check restores the session from the cookie', async () => {
    const { agent, user } = await createUser(app);
    const res = await agent.get('/api/auth/check');
    expect(res.status).toBe(200);
    expect(res.body.data.user._id).toBe(user._id);
  });

  it('rejects a tampered or wrong-type token', async () => {
    const { user } = await createUser(app);
    const socketToken = signSocketToken(user._id); // valid signature, wrong type
    const res = await request(app).get('/api/auth/check').set('Cookie', `pc_token=${socketToken}`);
    expect(res.status).toBe(401);

    const garbage = await request(app).get('/api/auth/check').set('Cookie', 'pc_token=not-a-jwt');
    expect(garbage.status).toBe(401);
  });

  it('POST /logout clears the cookie', async () => {
    const { agent } = await createUser(app);
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/pc_token=;/);
    expect((await agent.get('/api/auth/check')).status).toBe(401);
  });

  it('GET /socket-token requires a session and returns a token', async () => {
    expect((await request(app).get('/api/auth/socket-token')).status).toBe(401);
    const { agent } = await createUser(app);
    const res = await agent.get('/api/auth/socket-token');
    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe('string');
  });
});

describe('PUT /api/auth/update-profile', () => {
  it('updates the name', async () => {
    const { agent } = await createUser(app);
    const res = await agent.put('/api/auth/update-profile').send({ fullName: '  New Name  ' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.fullName).toBe('New Name');
  });

  it('rejects an empty update', async () => {
    const { agent } = await createUser(app);
    expect((await agent.put('/api/auth/update-profile').send({})).status).toBe(400);
  });

  it('reports 503 for pictures when Cloudinary is not configured', async () => {
    const { agent } = await createUser(app);
    const res = await agent
      .put('/api/auth/update-profile')
      .send({ profilePic: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('UPLOADS_DISABLED');
  });

  it('requires authentication', async () => {
    expect((await request(app).put('/api/auth/update-profile').send({ fullName: 'X Y' })).status).toBe(401);
  });
});
