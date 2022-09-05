import { createAction } from '../core/Action';
import { Anime, Episode, SourceMediaConnection } from '../types/data';

export const animeEpisodesAction = createAction<Anime, Episode>({
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
  transform: (data) => data.flatMap((anime) => anime.episodes),
  uniqueKey: 'slug',
});

export const animeSourceConnectionAction = createAction<
  Anime,
  SourceMediaConnection
>({
  keys: ['mediaId', 'sourceMediaId', 'sourceId', 'id'],
  table: 'anime_source',
  transform: (data) => data.map((anime) => anime.sourceAnimeConnection),
  uniqueKey: 'id',
});

export const animeActions = [animeSourceConnectionAction, animeEpisodesAction];
