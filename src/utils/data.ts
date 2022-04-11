import {
  SourceManga,
  AnilistManga,
  Manga,
  SourceAnime,
  AnilistAnime,
  Anime,
} from '../types/data';

export const mergeMangaInfo = (
  source: SourceManga,
  anilist: AnilistManga,
): Manga => {
  return {
    ...anilist,
    sourceMangaConnection: {
      id: `${source.sourceMediaId}-${source.sourceId}`,
      mediaId: anilist.id,
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
    vietnameseTitle: source.vietnameseTitle,
    description: source.description,
  };
};

export const mergeAnimeInfo = (
  source: SourceAnime,
  anilist: AnilistAnime,
): Anime => {
  return {
    ...anilist,
    sourceAnimeConnection: {
      id: `${source.sourceMediaId}-${source.sourceId}`,
      mediaId: anilist.id,
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
    vietnameseTitle: source.vietnameseTitle,
    description: source.description,
  };
};
