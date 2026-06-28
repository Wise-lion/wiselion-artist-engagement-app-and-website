import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { env } from './lib/env';
import { initSocket } from './socket';
import { startCronJobs } from './jobs/cron';

// Routes
import webhooks from './routes/webhooks';
import users from './routes/users';
import streams from './routes/streams';
import bingo from './routes/bingo';
import lotto from './routes/lotto';
import merch from './routes/merch';
import wallet from './routes/wallet';
import subscriptions from './routes/subscriptions';
import media from './routes/media';
import visibility from './routes/visibility';

const app = express();

// IMPORTANT: the Stripe webhook needs the RAW body for signature verification,
// so it is mounted BEFORE the JSON body parser.
app.use('/api/webhooks', webhooks);

app.use(cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, service: 'wiselionlikeking' }));

app.use('/api/users', users);
app.use('/api/streams', streams);
app.use('/api/bingo', bingo);
app.use('/api/lotto', lotto);
app.use('/api/merch', merch);
app.use('/api/wallet', wallet);
app.use('/api/subscriptions', subscriptions);
app.use('/api/media', media);
app.use('/api/visibility', visibility);

// Centralized error handler.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

const httpServer = createServer(app);
initSocket(httpServer);
startCronJobs();

httpServer.listen(env.port, () => {
  console.log(`🦁👑 Wiselionlikeking API on :${env.port}`);
});
