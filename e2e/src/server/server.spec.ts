import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

describe('Tags', () => {
  it('GET /tags returns tags list', async () => {
    const res = await api.get('/tags');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('tags');
    expect(Array.isArray(res.data.tags)).toBe(true);
  });
});

describe('Users', () => {
  const timestamp = Date.now();
  const user = { email: `test${timestamp}@test.com`, username: `user${timestamp}`, password: 'password123' };
  let token: string;

  it('POST /users registers a new user', async () => {
    const res = await api.post('/users', { user });
    expect(res.status).toBe(201);
    expect(res.data.user).toHaveProperty('token');
    token = res.data.user.token;
  });

  it('POST /users/login authenticates user', async () => {
    const res = await api.post('/users/login', { user: { email: user.email, password: user.password } });
    expect(res.status).toBe(200);
    expect(res.data.user).toHaveProperty('token');
    token = res.data.user.token;
  });

  it('GET /user returns current user', async () => {
    const res = await api.get('/user', { headers: { Authorization: `Token ${token}` } });
    expect(res.status).toBe(200);
    expect(res.data.user.email).toBe(user.email);
  });
});

describe('Articles', () => {
  it('GET /articles returns articles list', async () => {
    const res = await api.get('/articles');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('articles');
    expect(Array.isArray(res.data.articles)).toBe(true);
  });
});

describe('Profiles', () => {
  it('GET /profiles/:username returns 404 for unknown user', async () => {
    try {
      await api.get('/profiles/nonexistentuser999');
      fail('Should have thrown');
    } catch (err: any) {
      expect(err.response.status).toBe(404);
    }
  });
});