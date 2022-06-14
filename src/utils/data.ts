import { Anime, Manga, SourceAnime, SourceManga } from '../types/data';

export const mergeMangaInfo = (
  source: SourceManga,
  anilistId: number,
): Manga => {
  return {
    anilistId,
    sourceMangaConnection: {
      id: `${source.sourceMediaId}-${source.sourceId}`,
      mediaId: anilistId,
      sourceMediaId: source.sourceMediaId,
      sourceId: source.sourceId,
    },
    chapters: source.chapters.map((chapter) => ({
      name: chapter.name,
      sourceConnectionId: `${chapter.sourceMediaId}-${source.sourceId}`,
      sourceMediaId: chapter.sourceMediaId,
      sourceChapterId: chapter.sourceChapterId,
      sourceId: source.sourceId,
      slug: `${source.sourceId}-${chapter.sourceChapterId}`,
    })),
  };
};

export const mergeAnimeInfo = (
  source: SourceAnime,
  anilistId: number,
): Anime => {
  return {
    anilistId,
    sourceAnimeConnection: {
      id: `${source.sourceMediaId}-${source.sourceId}`,
      mediaId: anilistId,
      sourceMediaId: source.sourceMediaId,
      sourceId: source.sourceId,
    },
    episodes: source.episodes.map((episode) => ({
      name: episode.name,
      sourceConnectionId: `${episode.sourceMediaId}-${source.sourceId}`,
      sourceMediaId: episode.sourceMediaId,
      sourceEpisodeId: episode.sourceEpisodeId,
      sourceId: source.sourceId,
      slug: `${source.sourceId}-${episode.sourceEpisodeId}`,
    })),
  };
};
