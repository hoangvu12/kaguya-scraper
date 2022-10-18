import AnimeScraper from '../core/AnimeScraper';
import MangaScraper from '../core/MangaScraper';
import logger from '../logger';
import scrapers, { AnimeScraperId, MangaScraperId } from '../scrapers';
import { scrapeNewAnime } from '../tasks/scrapeNewAnime';
import { scrapeNewManga } from '../tasks/scrapeNewManga';
import { MediaType } from '../types/anilist';

type Scraper<T> = T extends MediaType.Anime ? AnimeScraper : MangaScraper;

const handleFetch = async <T extends MediaType>(
  type: T,
  scraper: Scraper<T>,
) => {
  if (type === MediaType.Anime) {
    await scrapeNewAnime(scraper.id as AnimeScraperId);
  } else {
    await scrapeNewManga(scraper.id as MangaScraperId);
  }
};

const handleRegisterMonitor = <T extends MediaType>(
  type: T,
  scraper: Scraper<T>,
) => {
  scraper.monitor.onMonitorChange = () =>
    handleFetch(type, scraper).catch(logger.error);

  scraper.monitor.run();
};

export const handleFetchData = async <T extends MediaType>(type: T) => {
  const animeScrapers = scrapers.anime;
  const mangaScrapers = scrapers.manga;

  let chosenScrapers;

  if (type === MediaType.Anime) {
    chosenScrapers = animeScrapers;
  } else {
    chosenScrapers = mangaScrapers;
  }

  for (const scraperId in chosenScrapers) {
    const scraper = chosenScrapers[scraperId];

    await handleFetch(type, scraper as Scraper<T>);
  }
};

export default async () => {
  const animeScrapers = scrapers.anime;
  const mangaScrapers = scrapers.manga;

  for (const scraperId in animeScrapers) {
    const scraper = animeScrapers[scraperId];

    handleRegisterMonitor(MediaType.Anime, scraper);
  }

  for (const scraperId in mangaScrapers) {
    const scraper = mangaScrapers[scraperId];

    handleRegisterMonitor(MediaType.Manga, scraper);
  }
};
