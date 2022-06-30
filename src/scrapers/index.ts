import { handlePath } from '../utils';

import fs from 'fs';
import AnimeScraper from '../core/AnimeScraper';
import MangaScraper from '../core/MangaScraper';
import supabase from '../lib/supabase';

const readScrapers = (path: string) => {
  const scraperFiles = fs
    .readdirSync(handlePath(path))
    .filter((file) => file.endsWith('.js'))
    .map((file) => file.replace('.js', ''));

  const scrapers = {};

  for (const file of scraperFiles) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: Scraper } = require(handlePath(`${path}/${file}`));

    scrapers[file] = new Scraper();
  }

  return scrapers;
};

const readClassScrapers = (path: string) => {
  const scraperFiles = fs
    .readdirSync(handlePath(path))
    .filter((file) => file.endsWith('.js'))
    .map((file) => file.replace('.js', ''));

  const scrapers = {};

  for (const file of scraperFiles) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: Scraper } = require(handlePath(`${path}/${file}`));

    scrapers[file] = Scraper;
  }

  return scrapers;
};

export type AnimeScraperId = string;
export type MangaScraperId = string;

const animeScrapers: Record<AnimeScraperId, AnimeScraper> =
  readScrapers('./scrapers/anime');
const mangaScrapers: Record<MangaScraperId, MangaScraper> =
  readScrapers('./scrapers/manga');
const animeClassScrapers: Record<AnimeScraperId, typeof AnimeScraper> =
  readClassScrapers('./scrapers/anime');
const mangaClassScrapers: Record<MangaScraperId, typeof MangaScraper> =
  readClassScrapers('./scrapers/manga');

export const getRemoteScraper = async (id: string) => {
  const { data, error } = await supabase
    .from('kaguya_sources')
    .select('id')
    .eq('id', id)
    .single();

  if (!data || error) throw new Error(`Unknown scraper id: ${id}`);

  return data;
};

export const getAnimeScraper = (id: AnimeScraperId) => {
  if (!(id in animeScrapers)) {
    throw new Error(`Unknown scraper id: ${id}`);
  }

  return animeScrapers[id];
};

export const getMangaScraper = (id: MangaScraperId) => {
  if (!(id in mangaScrapers)) {
    throw new Error(`Unknown scraper id: ${id}`);
  }

  return mangaScrapers[id];
};

export const getAnimeClassScraper = (id: AnimeScraperId) => {
  if (!(id in animeClassScrapers)) {
    return null;
  }

  // @ts-ignore
  return new animeClassScrapers[id]();
};

export const getMangaClassScraper = (id: MangaScraperId) => {
  if (!(id in mangaClassScrapers)) {
    return null;
  }

  // @ts-ignore
  return new mangaClassScrapers[id]();
};

export const getScraper = (id: AnimeScraperId | MangaScraperId) => {
  if (id in animeScrapers) {
    return getAnimeScraper(id);
  }

  if (id in mangaScrapers) {
    return getMangaScraper(id);
  }

  throw new Error(`Unknown scraper id: ${id}`);
};

export default {
  anime: animeScrapers,
  manga: mangaScrapers,
  animeClass: animeClassScrapers,
  mangaClass: mangaClassScrapers,
};
