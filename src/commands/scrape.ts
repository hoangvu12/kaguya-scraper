import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { handleFetchData } from '../cron/fetch';
import { MediaType } from '../types/anilist';
import { Command } from '../types/discord';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('scrape')
    .setDescription('Scrape new anime and manga')
    .setDefaultPermission(false)
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('anime/manga')
        .setRequired(true)
        .addChoice('Anime', MediaType.Anime)
        .addChoice('Manga', MediaType.Manga),
    ),
  async execute(interaction: CommandInteraction) {
    const type = interaction.options.getString('type');

    handleFetchData(type as MediaType);

    interaction.reply('Start fetching data');
  },
  permissions: [
    {
      id: '907444686870958150',
      type: 'ROLE',
      permission: true,
    },
  ],
};

export default command;
