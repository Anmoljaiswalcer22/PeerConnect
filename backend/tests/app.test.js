import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { maskUri } from '../src/config/db.js';

const app = createApp();

describe('GET /api/health', () => {
  it('returns 200 with service info and database state', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      service: 'peerconnect-api',
      environment: 'test',
      database: 'disconnected', // no DB in unit tests
      status: 'degraded',
    });
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
  });

  it('sets security headers and hides x-powered-by', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  it('allows the configured frontend origin with credentials', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not allow unknown origins', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Error handling', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route GET /api/does-not-exist does not exist' },
    });
  });

  it('returns 400 for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('maskUri', () => {
  it('hides the password in connection strings', () => {
    expect(maskUri('mongodb+srv://alice:s3cret@cluster0.abc.mongodb.net/?x=1')).toBe(
      'mongodb+srv://alice:****@cluster0.abc.mongodb.net/?x=1',
    );
  });
});
