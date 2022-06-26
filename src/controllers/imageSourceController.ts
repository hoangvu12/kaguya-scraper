import { NextFunction, Request, Response } from 'express';
import Api400Error from '../errors/api400Error';
import Api404Error from '../errors/api404Error';
import Api500Error from '../errors/api500Error';
import scrapers, { MangaScraperId } from '../scrapers';

const imageSourceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
};

export default imageSourceController;
