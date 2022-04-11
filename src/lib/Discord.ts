import { Client as DiscordClient, Collection, Intents } from 'discord.js';
import 'dotenv/config';
import fs from 'fs';
import logger from '../logger';
import { Command } from '../types/discord';
import { handlePath } from '../utils';

export const Client = new DiscordClient({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const commandsPath = handlePath('./commands');

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

Client.commands = new Collection();

for (const file of commandFiles) {
  const {
    default: command,
  }: // eslint-disable-next-line @typescript-eslint/no-var-requires
  { default: Command } = require(handlePath(`./commands/${file}`));

  console.log('Adding command', command.data.name);

  Client.commands.set(command.data.name, command);
}

Client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  const command = Client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

Client.login(process.env.DISCORD_TOKEN);

export const getChannel = (id: string) => {
  const guild = Client.guilds.cache.first();

  return guild.channels.cache.get(id);
};
