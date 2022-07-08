import { NextFunction, Request, Response } from 'express';
import Api400Error from '../errors/api400Error';
import Api404Error from '../errors/api404Error';
import Api500Error from '../errors/api500Error';
import { getMangaClassScraper, getRemoteScraper } from '../scrapers';
import { handleProxy } from '../utils';

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

    const hasScraper = await getRemoteScraper(source_id as string);

    if (!hasScraper) throw new Api400Error('Unknown source id');

    let scraper = getMangaClassScraper(source_id as string);

    // If there is no scraper in local but there is a scraper in database, That mean the request trying to get sources from custom scraper
    if (!scraper) {
      scraper = getMangaClassScraper('custom');
    }

    if (!scraper) {
      throw new Api404Error('Source ID not found');
    }

    const images = await scraper.getImages({
      source_id: source_id.toString(),
      source_media_id: source_media_id.toString(),
      chapter_id: chapter_id.toString(),
      request: req,
    });

    const imagesWithProxy = handleProxy(images);

    if (!imagesWithProxy) {
      throw new Api500Error('No images found');
    }

    res.status(200).json({
      success: true,
      images: imagesWithProxy,
    });
  } catch (err) {
    next(err);
  }
};

export default imageSourceController;
