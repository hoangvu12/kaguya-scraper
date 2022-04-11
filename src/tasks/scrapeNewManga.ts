import uniq from 'lodash/uniq';
import uniqWith from 'lodash/uniqWith';
import { createAction, insertData } from '../core/Action';
import supabase from '../lib/supabase';
import logger from '../logger';
import scrapers, { getMangaScraper, MangaScraperId } from '../scrapers';
import { MediaType } from '../types/anilist';
import {
  Chapter,
  Manga,
  SourceManga,
  SourceMediaConnection,
} from '../types/data';
import { getRetriesInfo } from '../utils/anilist';
import { mergeMangaInfo } from '../utils/data';
import { handleLog } from '../utils/discord';
import { mangaActions } from '../actions/manga';
import { handlePushNotification } from '../utils/notification';

interface SourceMediaConnectionWithMedia extends SourceMediaConnection {
  media: Manga;
  chapters: Chapter[];
}

const handleExistManga = async (chapters: Chapter[]) => {
  const insertAction = createAction<Chapter>({
    keys: [
      'sourceConnectionId',
      'name',
      'sourceChapterId',
      'sourceId',
      'sourceMediaId',
      'slug',
    ],
    table: 'chapters',
    uniqueKey: 'slug',
  });

  await insertData(chapters, [insertAction]);

  return true;
};

const handleNonExistManga = async (manga: SourceManga[]) => {
  const newManga = await Promise.all(
    manga.map(async (manga) => {
      if (!manga?.titles?.length) return;

      const anilist = await getRetriesInfo(manga.titles, MediaType.Manga);

      if (!anilist) return;

      const info = mergeMangaInfo(manga, anilist);

      return info;
    }),
  );

  const validNewManga = newManga.filter((a) => a);

  if (!validNewManga.length) return [];

  await insertData(validNewManga, mangaActions);

  return validNewManga;
};

export const scrapeNewManga = async (scraperId: MangaScraperId) => {
  try {
    const scraper = getMangaScraper(scraperId);

    const sourceManga = await scraper.scrapeMangaPages(3);

    const sourceMediaIds = uniq(sourceManga.map((data) => data.sourceMediaId));

    const { data: connections, error } = await supabase
      .from<SourceMediaConnectionWithMedia>('kaguya_manga_source')
      .select('*, media:mediaId(*), chapters:kaguya_chapters(*)')
      .in('sourceMediaId', sourceMediaIds)
      .eq('sourceId', scraperId);

    if (error) {
      throw error;
    }

    const existSourceMediaIds = connections.map(
      (connection) => connection.sourceMediaId,
    );

    const nonExistManga = sourceManga.filter(
      (manga) => !existSourceMediaIds.includes(manga.sourceMediaId),
    );

    const existChapters = connections.flatMap(
      (connection) => connection.chapters,
    );

    const sourceChapters = uniqWith(
      sourceManga
        .filter((manga) =>
          existChapters.some(
            (chapter) => chapter.sourceMediaId === manga.sourceMediaId,
          ),
        )
        .flatMap((manga) => manga.chapters),
      (a, b) => a.name === b.name && a.sourceMediaId === b.sourceMediaId,
    );

    const existManga = connections.flatMap((connection) => connection.media);

    const newChapters: Chapter[] = sourceChapters
      .filter(
        (sourceChapter) =>
          !existChapters.some(
            (chapter) =>
              chapter.sourceChapterId === sourceChapter.sourceChapterId,
          ),
      )
      .map((chapter) => {
        return {
          ...chapter,
          sourceConnectionId: `${chapter.sourceMediaId}-${scraperId}`,
          slug: `${scraperId}-${chapter.sourceChapterId}`,
          sourceId: scraperId,
        };
      });

    const mangaWithNewChapters = uniqWith(
      newChapters
        .map((chapter) => {
          const connection = connections.find(
            (connection) => connection.id === chapter.sourceConnectionId,
          );

          const chapters = connection.chapters;
          const manga = existManga.find(
            (manga) => manga.id === connection.mediaId,
          );

          if (!connection) return;

          return { ...manga, chapters };
        })
        .filter((a) => a),
      (a, b) => a.id === b.id,
    );

    const result = {
      new: [],
      updated: [],
    };

    if (newChapters.length) {
      const isSuccess = await handleExistManga(newChapters);

      if (isSuccess) {
        result.updated = mangaWithNewChapters;

        await handlePushNotification(mangaWithNewChapters, MediaType.Manga);
      }
    }

    if (nonExistManga.length) {
      const insertedManga = await handleNonExistManga(nonExistManga);

      result.new = insertedManga;
    }

    handleLog(MediaType.Manga, result, scraper);
  } catch (err) {
    logger.error(err.message);
  }
};

const scrapeAllNewManga = async () => {
  try {
    for (const scraperId in scrapers.manga) {
      await scrapeNewManga(scraperId as MangaScraperId);
    }
  } catch (err) {
    logger.error(err.message);
  }
};

export default scrapeAllNewManga;
