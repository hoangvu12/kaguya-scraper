export type Episode = {
  name: string;
  sourceId: string;
  sourceEpisodeId: string;
  sourceMediaId: string;
  slug: string;
  sourceConnectionId: string;
};

export type Chapter = {
  name: string;
  sourceId: string;
  sourceChapterId: string;
  sourceMediaId: string;
  slug: string;
  sourceConnectionId: string;
};

export interface SourceEpisode {
  name: string;
  sourceEpisodeId: string;
  sourceMediaId: string;
}
export interface SourceAnime {
  titles: string[];
  episodes: SourceEpisode[];
  sourceId: string;
  sourceMediaId: string;
  anilistId?: number;
}
export interface SourceChapter {
  name: string;
  sourceChapterId: string;
  sourceMediaId: string;
}
export interface SourceManga {
  titles: string[];
  chapters: SourceChapter[];
  sourceId: string;
  sourceMediaId: string;
  anilistId?: number;
}

export interface SourceMediaConnection {
  id: string;
  mediaId: number;
  sourceMediaId: string;
  sourceId: string;
}

export interface Source {
  id: string;
  name: string;
  isCustomSource: boolean;
}

export interface Anime {
  anilistId: number;
  episodes: Episode[];
  sourceAnimeConnection: SourceMediaConnection;
}

export interface Manga {
  anilistId: number;
  chapters: Chapter[];
  sourceMangaConnection: SourceMediaConnection;
}

export type MediaUnit = Episode | Chapter | SourceEpisode | SourceChapter;
