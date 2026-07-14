import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { UnauthorizedError } from 'express-jwt';
import routes from './app/routes/routes';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';
import HttpException from './app/models/http-exception.model';
import { register, Counter, Histogram } from 'prom-client';

const app = express();

// Metrics
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// Middleware to count requests per endpoint
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    const duration = (Date.now() - start) / 1000;
    requestCounter.inc({ method: req.method, route, status: res.statusCode });
    requestDuration.observe({ method: req.method, route, status: res.statusCode }, duration);
  });
  next();
});

/**
 * App Configuration
 */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'openapi.json'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serves images
app.use(express.static(__dirname + '/assets'));

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ status: 'API is running on /api' });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req: express.Request, res: express.Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
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

/**
 * Server activation
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.info(`server up on port ${PORT}`);
});