import fetchCron from './cron/fetch';
import { Client } from './lib/Discord';
import { logError } from './errors/errorHandler';

Client.on('ready', (bot) => {
  console.log(`Bot ${bot.user.tag} is ready!`);

  fetchCron();
});

process.on('uncaughtException', (error) => {
  logError(error);
});
