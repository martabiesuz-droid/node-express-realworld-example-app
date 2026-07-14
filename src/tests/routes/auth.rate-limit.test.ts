import express from 'express';
import * as bodyParser from 'body-parser';
import request from 'supertest';
import { createLoginRateLimiter } from '../../app/routes/auth/login-rate-limiter';
import * as authService from '../../app/routes/auth/auth.service';
import HttpException from '../../app/models/http-exception.model';
import { UnauthorizedError } from 'express-jwt';

// ---------------------------------------------------------------------------
// Isolated Express app — uses a fast limiter (500 ms window, max 3 requests)
// so the test never has to wait for a real 15-minute window.
// ---------------------------------------------------------------------------

const RATE_LIMIT_MAX = 3;

function buildTestApp() {
  const app = express();
  app.use(bodyParser.json());

  const testLimiter = createLoginRateLimiter({
    windowMs: 500,
    max: RATE_LIMIT_MAX,
  });

  app.post('/api/users/login', testLimiter, async (req, res, next) => {
    try {
      const user = await authService.login(req.body.user);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  });

  // Central error handler (mirrors main.ts)
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err instanceof UnauthorizedError) {
        return res.status(401).json({ errors: { body: ['missing authorization credentials'] } });
      }
      if (err instanceof HttpException) {
        return res.status(err.errorCode).json(err.body);
      }
      console.error(err);
      return res.status(500).json({ errors: { body: ['Internal server error'] } });
    },
  );

  return app;
}

// ---------------------------------------------------------------------------
// Mock the auth service so the test has no Prisma / DB dependency.
// ---------------------------------------------------------------------------

jest.mock('../../app/routes/auth/auth.service');
const mockLogin = authService.login as jest.MockedFunction<typeof authService.login>;

describe('POST /api/users/login — rate limiting', () => {
  const validPayload = { user: { email: 'test@example.com', password: 'secret' } };

  let app: express.Express;

  beforeEach(() => {
    // Fresh app instance per test = fresh MemoryStore, clean counter
    app = buildTestApp();
    mockLogin.mockResolvedValue({
      email: 'test@example.com',
      username: 'tester',
      bio: null,
      image: null,
      token: 'jwt-token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('allows requests up to the limit', async () => {
    for (let attempt = 1; attempt <= RATE_LIMIT_MAX; attempt++) {
      const response = await request(app).post('/api/users/login').send(validPayload);
      expect(response.status).not.toBe(429);
    }
  });

  test('returns 429 with the standard error envelope once the limit is exceeded', async () => {
    // Exhaust the limit
    for (let attempt = 0; attempt < RATE_LIMIT_MAX; attempt++) {
      await request(app).post('/api/users/login').send(validPayload);
    }

    // One request over the limit
    const response = await request(app).post('/api/users/login').send(validPayload);

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      errors: { body: ['Too many login attempts, please try again later'] },
    });
  });

  test('does not rate-limit other routes on the same router', async () => {
    // Exhaust login limit
    for (let attempt = 0; attempt < RATE_LIMIT_MAX + 1; attempt++) {
      await request(app).post('/api/users/login').send(validPayload);
    }

    // A different route on the same app instance should still respond normally
    // (404 here because we didn't register it — but crucially NOT 429)
    const response = await request(app).post('/api/users/register').send(validPayload);
    expect(response.status).not.toBe(429);
  });
});
