import uniqWith from 'lodash/uniqWith';
import { animeActions } from '../actions/anime';
import { createAction, insertData } from '../core/Action';
import supabase from '../lib/supabase';
import logger from '../logger';
import scrapers, { AnimeScraperId, getAnimeScraper } from '../scrapers';
import { MediaType } from '../types/anilist';
import { Episode, SourceAnime, SourceMediaConnection } from '../types/data';
import { getMediaList, getRetriesId } from '../utils/anilist';
import { mergeAnimeInfo } from '../utils/data';
import { handleLog } from '../utils/discord';

interface SourceMediaConnectionWithMedia extends SourceMediaConnection {
  episodes: Episode[];
}

const handleExistAnime = async (episodes: Episode[]) => {
  const episodeInsertAction = createAction<Episode>({
    keys: [
      'sourceConnectionId',
      'name',
      'sourceEpisodeId',
      'sourceId',
      'sourceMediaId',
      'slug',
      'section',
    ],
    table: 'episodes',
    uniqueKey: 'slug',
  });

  await insertData(episodes, [episodeInsertAction]);

  return true;
};

const handleNonExistAnime = async (anime: SourceAnime[]) => {
  const newAnime = await Promise.all(
    anime.map(async (anime) => {
      if (!anime?.titles?.length) return;

      const anilist = await getRetriesId(anime.titles, MediaType.Anime);

      if (!anilist) return;

      const info = mergeAnimeInfo(anime, anilist);

      return info;
    }),
  );

  const validNewAnime = newAnime.filter((a) => a);

  if (!validNewAnime.length) return [];

  await insertData(validNewAnime, animeActions);

  return validNewAnime;
};

export const scrapeNewAnime = async (scraperId: AnimeScraperId) => {
  try {
    const scraper = getAnimeScraper(scraperId);

    const sourceAnime = await scraper.scrapeAnimePages(scraper.scrapingPages);

    const sourceMediaIds = sourceAnime.map((data) => data.sourceMediaId);

    const { data: connections, error } = await supabase
      .from<SourceMediaConnectionWithMedia>('kaguya_anime_source')
      .select('*, episodes:kaguya_episodes(*)')
      .in('sourceMediaId', sourceMediaIds)
      .eq('sourceId', scraperId);

    if (error) {
      throw error;
    }

    const anilistIds = connections.flatMap((connection) => connection.mediaId);

    const anilistList = await getMediaList(anilistIds, MediaType.Anime);

    const existSourceMediaIds = connections.map(
      (connection) => connection.sourceMediaId,
    );

    const nonExistAnime = sourceAnime.filter(
      (anime) => !existSourceMediaIds.includes(anime.sourceMediaId),
    );

    const existEpisodes = connections.flatMap(
      (connection) => connection.episodes,
    );

    const sourceEpisodes = uniqWith(
      sourceAnime
        .filter((anime) =>
          existEpisodes.some(
            (episode) => episode.sourceMediaId === anime.sourceMediaId,
          ),
        )
        .flatMap((anime) => anime.episodes),
      (a, b) =>
        a.name === b.name &&
        a.sourceMediaId === b.sourceMediaId &&
        a.section === b.section,
    );

    const newEpisodes: Episode[] = sourceEpisodes
      .filter(
        (sourceEpisode) =>
          !existEpisodes.some(
            (episode) =>
              episode.sourceEpisodeId === sourceEpisode.sourceEpisodeId,
          ),
      )
      .map((episode) => {
        return {
          ...episode,
          sourceConnectionId: `${episode.sourceMediaId}-${scraperId}`,
          slug: `${scraperId}-${episode.sourceEpisodeId}`,
          sourceId: scraperId,
        };
      });

    const animeWithNewEpisodes = uniqWith(
      newEpisodes
        .map((episode) => {
          const connection = connections.find(
            (connection) => connection.id === episode.sourceConnectionId,
          );

          const episodes = connection.episodes;
          const anime = anilistList.find(
            (anime) => anime.id === connection.mediaId,
          );

          if (!connection) return;

          return { ...anime, episodes };
        })
        .filter((a) => a),
      (a, b) => a.id === b.id,
    );

    const result = {
      new: [],
      updated: [],
    };

    if (newEpisodes.length) {
      const isSuccess = await handleExistAnime(newEpisodes);

      if (isSuccess) {
        result.updated = animeWithNewEpisodes;
      }
    }

    if (nonExistAnime.length) {
      const insertedAnime = await handleNonExistAnime(nonExistAnime);

      result.new = insertedAnime;
    }

    handleLog(MediaType.Anime, result, scraper);
  } catch (err) {
    logger.error(err.message);
  }
};

const scrapeAllNewAnime = async () => {
  try {
    for (const scraperId of Object.keys(scrapers.anime)) {
      await scrapeNewAnime(scraperId as AnimeScraperId);
    }
  } catch (err) {
    logger.error(err.message);
  }
};

export default scrapeAllNewAnime;
