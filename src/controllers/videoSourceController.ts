import { NextFunction, Request, Response } from 'express';
import Api400Error from '../errors/api400Error';
import Api404Error from '../errors/api404Error';
import Api500Error from '../errors/api500Error';
import { AnimeScraperId, getAnimeClassScraper } from '../scrapers';

const videoSourceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
};

export default videoSourceController;
