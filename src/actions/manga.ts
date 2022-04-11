import { createAction } from '../core/Action';
import {
  Chapter,
  Character,
  CharacterConnection,
  Manga,
  Recommendation,
  Relation,
  SourceMediaConnection,
} from '../types/data';

export const mangaAction = createAction<Manga, Manga>({
  table: 'manga',
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
    'format',
    'status',
    'tags',
    'description',
    'vietnameseTitle',
    'isAdult',
    'genres',
    'averageScore',
    'countryOfOrigin',
    'synonyms',
    'totalChapters',
  ],
  uniqueKey: 'id',
});

export const mangaSourceConnection = createAction<Manga, SourceMediaConnection>(
  {
    keys: ['mediaId', 'sourceMediaId', 'sourceId', 'id'],
    table: 'manga_source',
    transform: (data) => data.map((manga) => manga.sourceMangaConnection),
    uniqueKey: 'id',
  },
);

export const mangaRecommendationsAction = createAction<Manga, Recommendation>({
  keys: ['originalId', 'recommendationId'],
  table: 'manga_recommendations',
  transform: (data) => data.flatMap((manga) => manga.recommendations),
  uniqueKey: ['originalId', 'recommendationId'],
});

export const mangaRelationsAction = createAction<Manga, Relation>({
  keys: ['originalId', 'relationId', 'relationType'],
  table: 'manga_relations',
  transform: (data) => data.flatMap((manga) => manga.relations),
  uniqueKey: ['originalId', 'relationId'],
});

export const mangaCharactersAction = createAction<Manga, Character>({
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
  transform: (data) => data.flatMap((manga) => manga.characters),
  uniqueKey: 'id',
});

export const mangaCharacterConnectionsAction = createAction<
  Manga,
  CharacterConnection
>({
  keys: ['characterId', 'id', 'name', 'role', 'mediaId'],
  table: 'manga_characters',
  transform: (data) => data.flatMap((manga) => manga.characterConnections),
  uniqueKey: 'id',
});

export const mangaChaptersAction = createAction<Manga, Chapter>({
  keys: [
    'sourceConnectionId',
    'name',
    'sourceChapterId',
    'sourceId',
    'sourceMediaId',
    'slug',
  ],
  table: 'chapters',
  transform: (data) => data.flatMap((manga) => manga.chapters),
  uniqueKey: 'slug',
});

export const mangaAnilistActions = [
  mangaAction,
  mangaRecommendationsAction,
  mangaRelationsAction,
  mangaCharactersAction,
  mangaCharacterConnectionsAction,
];

export const mangaActions = [
  ...mangaAnilistActions,
  mangaSourceConnection,
  mangaChaptersAction,
];
