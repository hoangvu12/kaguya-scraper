import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
// import fetchCron from './cron/fetch';
import { logError, returnError } from './errors/errorHandler';
// import { Client } from './lib/Discord';
import routes from './routes';
import http from 'http';
import { Server } from 'socket.io';
import handleSocket from './socket';
import { handleAnimeNotification } from './utils/notification';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://kaguya.live',
      'https://www.kaguya.live',
    ],
  },
  path: `/${process.env.BASE_ROUTE}/socket.io`,
});

const PORT = process.env.PORT || 3001;

app.use(fileUpload());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Client.on('ready', (bot) => {
//   console.log(`Bot ${bot.user.tag} is ready!`);

//   fetchCron();
// });

handleAnimeNotification();
handleSocket(io);

process.on('uncaughtException', (error) => {
  logError(error);
  logError(new Error('uncaughtException'));
});

app.enable('trust proxy');

app.use(express.json({ limit: '50mb' }));
app.use(`/${process.env.BASE_ROUTE}`, routes);
app.use(returnError);

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
