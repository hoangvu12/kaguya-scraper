import axios from 'axios';
import { TextChannel } from 'discord.js';
import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import { getlatestMediaUnit } from '.';
import AnimeScraper from '../core/AnimeScraper';
import MangaScraper from '../core/MangaScraper';
import { getChannel } from '../lib/Discord';
import { MediaType } from '../types/anilist';
import { Anime, Manga } from '../types/data';

type ResultData<T> = T extends MediaType.Anime ? Anime[] : Manga[];
type Scraper<T> = T extends MediaType.Anime ? AnimeScraper : MangaScraper;
type Result<T> = {
  new: ResultData<T>;
  updated: ResultData<T>;
};

export type DiscordAttachment = {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxy_url: string;
  content_type: string;
  ctx: Record<string, any>;
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
    return;
  }

  let message = '';

  const handleAddMessage = (data: ResultData<T>, headerSuffix = 'mới') => {
    const totalRecords = data.length;

    let message = '';

    message += `\n\n${labelType} ${headerSuffix} (${scraper.name}):`;

    data.slice(0, MAX_RECORDS).forEach((source) => {
      const title = source?.title?.userPreferred;

      if (!title) return;

      const latestUnit = getlatestMediaUnit(
        isAnime ? source.episodes : source.chapters,
      );

      if (!latestUnit?.name) return;

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

export const uploadByUrl = async (url: string | string[]) => {
  const files = await urlsToFiles(Array.isArray(url) ? url : [url]);

  return uploadFile(files);
};

export const uploadFile = async <T extends Pick<UploadedFile, 'data' | 'name'>>(
  file: T | T[],
) => {
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!discordWebhookUrl)
    throw new Error(
      'Please specify your discord webhook in .env file by "DISCORD_WEBHOOK_URL" key',
    );

  const formData = new FormData();

  if (Array.isArray(file)) {
    file.forEach((file, index) => {
      formData.append(`files[${index}]`, file.data, file.name);
    });
  } else {
    formData.append('file', file.data, file.name);
  }

  const { data } = await axios.post(discordWebhookUrl, formData, {
    headers: { ...formData.getHeaders() },
  });

  if (!data?.attachments?.length) throw new Error('No attachments found');

  const attachments = (data.attachments as DiscordAttachment[]).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (attachment) => ({
      ...attachment,
      url: attachment.url.replace(
        'https://cdn.discordapp.com/attachments/',
        '',
      ),
      proxy_url: attachment.proxy_url.replace(
        'https://media.discordapp.net/attachments/',
        '',
      ),
    }),
  );

  return attachments;
};

export const urlToFile = async (url: string) => {
  const filename = url
    .substring(url.lastIndexOf('/') + 1)
    .replace(/((\?|#).*)?$/, '');

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'utf-8');

  return {
    name: filename,
    data: buffer,
  };
};

export const urlsToFiles = async (url: string[]) => {
  const promises = url.map((url) => urlToFile(url));

  return Promise.all(promises);
};
