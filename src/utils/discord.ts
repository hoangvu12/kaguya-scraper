import { TextChannel } from 'discord.js';
import { getlatestMediaUnit, getTitle } from '.';
import AnimeScraper from '../core/AnimeScraper';
import MangaScraper from '../core/MangaScraper';
import { getChannel } from '../lib/Discord';
import logger from '../logger';
import { MediaType } from '../types/anilist';
import { Anime, Manga } from '../types/data';

type ResultData<T> = T extends MediaType.Anime ? Anime[] : Manga[];
type Scraper<T> = T extends MediaType.Anime ? AnimeScraper : MangaScraper;
type Result<T> = {
  new: ResultData<T>;
  updated: ResultData<T>;
};

const UPDATE_CHANNEL_ID = process.env.DISCORD_UPDATE_CHANNEL_ID;
const MAX_RECORDS = 10;

export const handleLog = <T extends MediaType>(
  type: T,
  result: Result<T>,
  scraper: Scraper<T>,
) => {
  const updateChannel = getChannel(UPDATE_CHANNEL_ID) as TextChannel;
  const isAnime = type === MediaType.Anime;
  const labelType = isAnime ? 'Anime' : 'Manga';

  if (!result.new?.length && !result.updated?.length) {
    logger.info(`No new ${labelType} from ${scraper.name} scraped`);

    return;
  }

  let message = '';

  const handleAddMessage = (data: ResultData<T>, headerSuffix = 'mới') => {
    const totalRecords = data.length;

    let message = '';

    message += `\n\n${labelType} ${headerSuffix} (${scraper.name}):`;

    data.slice(0, MAX_RECORDS).forEach((source) => {
      const title = getTitle(source);
      const latestUnit = getlatestMediaUnit(
        isAnime ? source.episodes : source.chapters,
      );

      message += `\n  - ${title} - ${latestUnit.name}`;
    });

    if (totalRecords > MAX_RECORDS) {
      message += `\n  ... và ${totalRecords - MAX_RECORDS} ${labelType} khác`;
    }

    return message;
  };

  if (result.new.length) {
    message += handleAddMessage(result.new, 'mới');
  }

  if (result.updated.length) {
    message += handleAddMessage(result.updated, 'cập nhật');
  }

  updateChannel.send(message);
};
