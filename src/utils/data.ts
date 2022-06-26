import { Anime, Manga, SourceAnime, SourceManga } from '../types/data';

export type ConnectionArgs = {
  sourceId: string;
  sourceMediaId: string;
  mediaId: number;
};

export type ChapterArgs = {
  name: string;
  sourceMediaId: string;
  sourceId: string;
  sourceChapterId: string;
};

export type EpisodeArgs = {
  name: string;
  sourceMediaId: string;
  sourceId: string;
  sourceEpisodeId: string;
};

export const mergeMangaConnection = ({
  mediaId,
  sourceId,
  sourceMediaId,
}: ConnectionArgs) => ({
  id: `${sourceMediaId}-${sourceId}`,
  mediaId,
  sourceMediaId,
  sourceId,
});

export const mergeAnimeConnection = ({
  mediaId,
  sourceId,
  sourceMediaId,
}: ConnectionArgs) => ({
  id: `${sourceMediaId}-${sourceId}`,
  mediaId,
  sourceMediaId,
  sourceId,
});

export const mergeMangaChapter = ({
  name,
  sourceMediaId,
  sourceId,
  sourceChapterId,
}: ChapterArgs) => ({
  name: name,
  sourceConnectionId: `${sourceMediaId}-${sourceId}`,
  sourceMediaId,
  sourceChapterId,
  sourceId,
  slug: `${sourceId}-${sourceChapterId}`,
});

export const mergeAnimeEpisode = ({
  name,
  sourceMediaId,
  sourceId,
  sourceEpisodeId,
}: EpisodeArgs) => ({
  name: name,
  sourceConnectionId: `${sourceMediaId}-${sourceId}`,
  sourceMediaId,
  sourceEpisodeId,
  sourceId,
  slug: `${sourceId}-${sourceEpisodeId}`,
});

export const mergeMangaInfo = (
  source: SourceManga,
  anilistId: number,
): Manga => {
  return {
    anilistId,
    sourceMangaConnection: mergeMangaConnection({
      mediaId: anilistId,
      sourceId: source.sourceId,
      sourceMediaId: source.sourceMediaId,
    }),
    chapters: source.chapters.map((chapter) =>
      mergeMangaChapter({
        name: chapter.name,
        sourceMediaId: source.sourceMediaId,
        sourceId: source.sourceId,
        sourceChapterId: chapter.sourceChapterId,
      }),
    ),
  };
};

export const mergeAnimeInfo = (
  source: SourceAnime,
  anilistId: number,
): Anime => {
  return {
    anilistId,
    sourceAnimeConnection: mergeAnimeConnection({
      mediaId: anilistId,
      sourceId: source.sourceId,
      sourceMediaId: source.sourceMediaId,
    }),
    episodes: source.episodes.map((episode) =>
      mergeAnimeEpisode({
        name: episode.name,
        sourceMediaId: source.sourceMediaId,
        sourceId: source.sourceId,
        sourceEpisodeId: episode.sourceEpisodeId,
      }),
    ),
  };
};
