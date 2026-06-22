import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { UnauthorizedError } from 'express-jwt';
import routes from './app/routes/routes';
import HttpException from './app/models/http-exception.model';

const app = express();

/**
 * App Configuration
 */

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

// Serves images
app.use(express.static(__dirname + '/assets'));

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ status: 'API is running on /api' });
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
