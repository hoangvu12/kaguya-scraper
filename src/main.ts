import cors from 'cors';
import express from 'express';
import fileUpload from 'express-fileupload';
import fetchCron from './cron/fetch';
import { logError, returnError } from './errors/errorHandler';
import { Client } from './lib/Discord';
import routes from './routes';
import { handleAnimeNotification } from './utils/notification';

const app = express();

const PORT = process.env.PORT || 3001;

app.use(fileUpload());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

Client.on('ready', (bot) => {
  console.log(`Bot ${bot.user.tag} is ready!`);

  fetchCron();
});

handleAnimeNotification();

process.on('uncaughtException', (error) => {
  logError(error);
  logError(new Error('uncaughtException'));
});

app.enable('trust proxy');

app.use(express.json({ limit: '50mb' }));
app.use(`/${process.env.BASE_ROUTE}`, routes);
app.use(returnError);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
