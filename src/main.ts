import cors from 'cors';
import express from 'express';
import fileUpload from 'express-fileupload';
import { Worker } from 'worker_threads';

import { logError, returnError } from './errors/errorHandler';
import routes from './routes';
import { handlePath } from './utils';

const app = express();

const PORT = process.env.PORT || 3001;

const worker = new Worker(handlePath('./crawl-worker'));
const animeNotificationWorker = new Worker(
  handlePath('./anime-notification-worker'),
);
const notificationWorker = new Worker(handlePath('./notification-worker'));

worker.on('message', console.log);
worker.on('error', logError);
animeNotificationWorker.on('message', console.log);
animeNotificationWorker.on('error', logError);
notificationWorker.on('message', console.log);
notificationWorker.on('error', logError);

app.use(
  fileUpload({
    limits: {
      // 1 GB
      fileSize: 1024 * 1024 * 1024,
    },
    abortOnLimit: true,
  }),
);
app.use(cors());
app.use(express.urlencoded({ extended: true }));

process.on('uncaughtException', (error) => {
  logError(error);
});

app.enable('trust proxy');

app.use(express.json({ limit: '50mb' }));
app.use(`/${process.env.BASE_ROUTE}`, routes);
app.use(returnError);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
