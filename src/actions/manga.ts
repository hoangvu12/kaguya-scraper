import { createAction } from '../core/Action';
import { Chapter, Manga, SourceMediaConnection } from '../types/data';

export const mangaSourceConnection = createAction<Manga, SourceMediaConnection>(
  {
    keys: ['mediaId', 'sourceMediaId', 'sourceId', 'id'],
    table: 'manga_source',
    transform: (data) => data.map((manga) => manga.sourceMangaConnection),
    uniqueKey: 'id',
  },
);

export const mangaChaptersAction = createAction<Manga, Chapter>({
  keys: [
    'sourceConnectionId',
    'name',
    'sourceChapterId',
    'sourceId',
    'sourceMediaId',
    'slug',
    'section',
  ],
  table: 'chapters',
  transform: (data) => data.flatMap((manga) => manga.chapters),
  uniqueKey: 'slug',
});

export const mangaActions = [mangaSourceConnection, mangaChaptersAction];
