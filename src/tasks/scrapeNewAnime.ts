import uniqWith from 'lodash/uniqWith';
import { createAction, insertData } from '../core/Action';
import supabase from '../lib/supabase';
import logger from '../logger';
import scrapers, { AnimeScraperId, getAnimeScraper } from '../scrapers';
import { MediaType } from '../types/anilist';
import {
  Anime,
  Episode,
  SourceAnime,
  SourceMediaConnection,
} from '../types/data';
import { getRetriesInfo } from '../utils/anilist';
import { animeActions } from '../actions/anime';
import { mergeAnimeInfo } from '../utils/data';
import { handleLog } from '../utils/discord';
import { handlePushNotification } from '../utils/notification';

interface SourceMediaConnectionWithMedia extends SourceMediaConnection {
  media: Anime;
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

      const anilist = await getRetriesInfo(anime.titles, MediaType.Anime);

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

    const sourceAnime = await scraper.scrapeAnimePages(3);

    const sourceMediaIds = sourceAnime.map((data) => data.sourceMediaId);

    const { data: connections, error } = await supabase
      .from<SourceMediaConnectionWithMedia>('kaguya_anime_source')
      .select('*, media:mediaId(*), episodes:kaguya_episodes(*)')
      .in('sourceMediaId', sourceMediaIds)
      .eq('sourceId', scraperId);

    if (error) {
      throw error;
    }

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
      (a, b) => a.name === b.name && a.sourceMediaId === b.sourceMediaId,
    );

    const existAnime = connections.flatMap((connection) => connection.media);

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
          const anime = existAnime.find(
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

        await handlePushNotification(animeWithNewEpisodes, MediaType.Anime);
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
