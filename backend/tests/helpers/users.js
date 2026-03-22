import request from 'supertest';

let counter = 0;

/** Sign up a fresh user; returns a cookie-carrying supertest agent and the user. */
export async function createUser(app, overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const body = {
    fullName: `Test User ${counter}`,
    email: `user${counter}-${Date.now()}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await agent.post('/api/auth/signup').send(body);
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.data.user, password: body.password };
}
