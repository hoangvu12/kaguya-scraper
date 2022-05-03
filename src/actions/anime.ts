import { createAction } from '../core/Action';
import {
  AiringSchedule,
  Anime,
  Character,
  CharacterConnection,
  Episode,
  Recommendation,
  Relation,
  SourceMediaConnection,
  Studio,
  StudioConnection,
  VoiceActor,
  VoiceActorConnection,
} from '../types/data';

export const animeAction = createAction<Anime>({
  table: 'anime',
  keys: [
    'id',
    'idMal',
    'title',
    'coverImage',
    'startDate',
    'trending',
    'popularity',
    'favourites',
    'bannerImage',
    'season',
    'seasonYear',
    'format',
    'status',
    'totalEpisodes',
    'tags',
    'description',
    'isAdult',
    'genres',
    'averageScore',
    'countryOfOrigin',
    'synonyms',
    'duration',
    'trailer',
  ],
  uniqueKey: 'id',
});

export const animeRecommendationsAction = createAction<Anime, Recommendation>({
  keys: ['originalId', 'recommendationId'],
  table: 'anime_recommendations',
  transform: (data) => data.flatMap((anime) => anime.recommendations),
  uniqueKey: ['originalId', 'recommendationId'],
});

export const animeRelationsAction = createAction<Anime, Relation>({
  keys: ['originalId', 'relationId', 'relationType'],
  table: 'anime_relations',
  transform: (data) => data.flatMap((anime) => anime.relations),
  uniqueKey: ['originalId', 'relationId'],
});

export const animeCharactersAction = createAction<Anime, Character>({
  keys: [
    'age',
    'dateOfBirth',
    'favourites',
    'gender',
    'id',
    'image',
    'name',
    'bloodType',
  ],
  table: 'characters',
  transform: (data) => data.flatMap((anime) => anime.characters),
  uniqueKey: 'id',
});

export const animeCharacterConnectionsAction = createAction<
  Anime,
  CharacterConnection
>({
  keys: ['characterId', 'id', 'name', 'role', 'mediaId'],
  table: 'anime_characters',
  transform: (data) => data.flatMap((anime) => anime.characterConnections),
  uniqueKey: 'id',
});

export const animeEpisodesAction = createAction<Anime, Episode>({
  keys: [
    'sourceConnectionId',
    'name',
    'sourceEpisodeId',
    'sourceId',
    'sourceMediaId',
    'slug',
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

export const animeAiringSchedulesAction = createAction<Anime, AiringSchedule>({
  keys: ['airingAt', 'episode', 'id', 'mediaId'],
  table: 'airing_schedules',
  transform: (data) => data.flatMap((anime) => anime.airingSchedules),
  uniqueKey: 'id',
});

export const animeVoiceActorsAction = createAction<Anime, VoiceActor>({
  keys: [
    'favourites',
    'id',
    'age',
    'bloodType',
    'dateOfBirth',
    'dateOfDeath',
    'gender',
    'homeTown',
    'image',
    'language',
    'name',
    'yearsActive',
  ],
  table: 'voice_actors',
  transform: (data) => data.flatMap((anime) => anime.voiceActors),
  uniqueKey: 'id',
});
export const animeVoiceActorConnectionsAction = createAction<
  Anime,
  VoiceActorConnection
>({
  keys: ['characterId', 'voiceActorId'],
  table: 'voice_actor_connections',
  transform: (data) => data.flatMap((anime) => anime.voiceActorConnections),
  upsertOptions: { ignoreDuplicates: true },
});

export const animeStudiosAction = createAction<Anime, Studio>({
  keys: ['favourites', 'id', 'name', 'isAnimationStudio'],
  table: 'studios',
  transform: (data) => data.flatMap((anime) => anime.studios),
  uniqueKey: 'id',
});

export const animeStudioConnectionsAction = createAction<
  Anime,
  StudioConnection
>({
  keys: ['isMain', 'mediaId', 'studioId'],
  table: 'studio_connections',
  transform: (data) => data.flatMap((anime) => anime.studioConnections),
  upsertOptions: { ignoreDuplicates: true },
});

export const animeAnilistActions = [
  animeAction,
  animeAiringSchedulesAction,
  animeCharactersAction,
  animeCharacterConnectionsAction,
  animeRecommendationsAction,
  animeRelationsAction,
  animeStudiosAction,
  animeStudioConnectionsAction,
  animeVoiceActorsAction,
  animeVoiceActorConnectionsAction,
];

export const animeActions = [
  ...animeAnilistActions,
  animeSourceConnectionAction,
  animeEpisodesAction,
];
