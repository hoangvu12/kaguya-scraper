import apicache from 'apicache';
import 'dotenv/config';
import express from 'express';
import Api400Error from './errors/api400Error';
import Api404Error from './errors/api404Error';
import Api500Error from './errors/api500Error';
import scrapers, {
  AnimeScraperId,
  getAnimeClassScraper,
  MangaScraperId,
} from './scrapers';

const cache = apicache.middleware;

const successCache = (duration: string) =>
  cache(duration, (_req, res) => res.statusCode === 200);

const router = express.Router();

router.get('/', (_, res) => {
  res.send('Working yo');
});

router.get('/images', successCache('1 day'), async (req, res, next) => {
  const { source_id, source_media_id, chapter_id } = req.query;

  try {
    if (!source_id) {
      throw new Api400Error('Missing required query parameters');
    }

    const animeScrapers = scrapers.manga;

    const scraper = animeScrapers[source_id as MangaScraperId];

    if (!scraper) {
      throw new Api404Error('Source ID not found');
    }

    const images = await scraper.getImages({
      source_id: source_id.toString(),
      source_media_id: source_media_id.toString(),
      chapter_id: chapter_id.toString(),
    });

    if (!images) {
      throw new Api500Error('No images found');
    }

    res.status(200).json({
      success: true,
      images,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/source', successCache('30 minutes'), async (req, res, next) => {
  const { source_id, source_media_id, episode_id } = req.query;

  try {
    if (!source_id) {
      throw new Api400Error('Missing required query parameters');
    }

    const scraper = getAnimeClassScraper(source_id as AnimeScraperId);

    if (!scraper) {
      throw new Api404Error('Source ID not found');
    }

    const { sources, subtitles } = await scraper.getSources({
      source_id: source_id.toString(),
      source_media_id: source_media_id.toString(),
      episode_id: episode_id.toString(),
    });

    if (!sources) {
      throw new Api500Error('No sources found');
    }

    res.status(200).json({
      success: true,
      sources,
      subtitles,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/proxy/sources', (_, res) => {
  const allScrapers = { ...scrapers.anime, ...scrapers.manga };

  const proxySources = Object.entries(allScrapers).map(([key, value]) => ({
    headers: value.proxy.headers,
    id: key,
  }));

  res.json({
    success: true,
    sources: proxySources,
  });
});

export default router;
