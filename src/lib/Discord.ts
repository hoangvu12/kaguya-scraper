import { Client as DiscordClient, Intents } from 'discord.js';
import 'dotenv/config';

export const Client = new DiscordClient({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

Client.login(process.env.DISCORD_TOKEN);

export const getChannel = (id: string) => {
  const guild = Client.guilds.cache.first();

  return guild.channels.cache.get(id);
};
