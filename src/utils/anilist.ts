import { AnilistAnime, AnilistManga, Anime, Manga } from '../types/data';

import axios from 'axios';
import axiosRetry from 'axios-retry';
import { Media, MediaType } from '../types/anilist';
import axiosRateLimit from 'axios-rate-limit';
import { findBestMatch, sleep } from '.';

const query = `
query ($id: Int, $search: String, $type: MediaType) {
  Media(
    id: $id
    search: $search
    type: $type
    sort: SEARCH_MATCH
    status_not: NOT_YET_RELEASED
  ) {
    trailer {
      id
      site
    }
    id
    idMal
    title {
      romaji
      english
      native
      userPreferred
    }
    coverImage {
      extraLarge
      large
      medium
      color
    }
    startDate {
      year
      month
      day
    }
    trending
    popularity
    favourites
    bannerImage
    season
    seasonYear
    format
    status(version: 2)
    chapters
    episodes
    duration
    genres
    isAdult
    countryOfOrigin
    averageScore
    synonyms
    studios {
      edges {
        id
        isMain
        node {
          id
          name
          isAnimationStudio
          favourites
        }
      }
    }
    characters(sort: ROLE) {
      edges {
        id
        name
        role
        voiceActors {
          id
          name {
            first
            middle
            last
            full
            native
            userPreferred
          }
          primaryOccupations
          language: languageV2
          image {
            large
            medium
          }
          gender
          dateOfBirth {
            year
            month
            day
          }
          dateOfDeath {
            year
            month
            day
          }
          age
          yearsActive
          homeTown
          bloodType
          favourites
        }
        node {
          id
          name {
            first
            middle
            last
            full
            native
            userPreferred
          }
          image {
            large
            medium
          }
          gender
          dateOfBirth {
            year
            month
            day
          }
          age
          favourites
          bloodType
        }
      }
    }
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          type
        }
      }
    }
    recommendations(sort: RATING_DESC) {
      nodes {
        mediaRecommendation {
          id
          type
        }
      }
    }
    airingSchedule(notYetAired: true) {
      nodes {
        airingAt
        episode
        mediaId
        id
      }
    }
    tags {
      name
    }
  }
}
`;

axiosRetry(axios, { retries: 3 });

const client = axiosRateLimit(axios, {
  maxRequests: 50,
  perMilliseconds: 60000,
});

client.interceptors.request.use(async (config) => {
  await sleep(250);

  return config;
});

const composeMangaData = (media: Media): AnilistManga => {
  if (!media) return null;

  const relations = media.relations?.edges || [];
  const recommendations = media.recommendations?.nodes || [];
  const characterConnections = media.characters?.edges || [];
  const tags = media.tags || [];

  const isManga = (type) => type === 'MANGA';

  return {
    averageScore: media.averageScore,
    totalChapters: media.chapters,
    countryOfOrigin: media.countryOfOrigin,
    isAdult: media.isAdult,
    synonyms: media.synonyms,
    genres: media.genres,
    bannerImage: media.bannerImage,
    favourites: media.favourites,
    format: media.format,
    id: media.id,
    idMal: media.idMal,
    popularity: media.popularity,
    status: media.status,
    trending: media.trending,
    title: media.title,
    coverImage: media.coverImage,
    startDate: media.startDate,
    characters: characterConnections.map((connection) => connection.node),
    characterConnections: characterConnections.map((connection) => ({
      id: connection.id,
      role: connection.role,
      name: connection.name,
      characterId: connection.node?.id,
      mediaId: media.id,
    })),

    relations: relations
      .filter((relation) => isManga(relation?.node?.type))
      .map((relation) => ({
        relationId: relation?.node?.id,
        originalId: media.id,
        relationType: relation?.relationType,
      })),

    recommendations: recommendations
      .filter((recommendation) =>
        isManga(recommendation?.mediaRecommendation?.type),
      )
      .map((recommendation) => ({
        recommendationId: recommendation?.mediaRecommendation?.id,
        originalId: media.id,
      })),
    tags: tags.map((tag) => tag.name),
  };
};

const composeAnimeData = (media: Media): AnilistAnime => {
  if (!media) return null;

  const relations = media.relations?.edges || [];
  const recommendations = media.recommendations?.nodes || [];
  const characterConnections = media.characters?.edges || [];
  const studioConnections = media.studios?.edges || [];
  const airingSchedules = media.airingSchedule?.nodes || [];
  const tags = media.tags || [];

  const voiceActors = characterConnections
    .map((connection) => connection.voiceActors)
    .flat();

  const voiceActorConnections = characterConnections
    .map((connection) =>
      connection.voiceActors.map((voiceActor) => ({
        voiceActorId: voiceActor.id,
        characterId: connection.node?.id,
      })),
    )
    .flat(2);

  const isAnime = (type) => type === 'ANIME';

  const trailer =
    media?.trailer?.site === 'youtube' ? media?.trailer?.id : null;

  return {
    trailer,
    duration: media.duration,
    averageScore: media.averageScore,
    countryOfOrigin: media.countryOfOrigin,
    isAdult: media.isAdult,
    synonyms: media.synonyms,
    genres: media.genres,
    bannerImage: media.bannerImage,
    favourites: media.favourites,
    format: media.format,
    id: media.id,
    idMal: media.idMal,
    popularity: media.popularity,
    season: media.season,
    seasonYear: media.seasonYear,
    status: media.status,
    trending: media.trending,
    title: media.title,
    coverImage: media.coverImage,
    startDate: media.startDate,
    studios: studioConnections.map((connection) => connection.node),
    studioConnections: studioConnections.map((connection) => ({
      id: connection.id,
      studioId: connection.node?.id,
      isMain: connection.isMain,
      mediaId: media.id,
    })),
    characters: characterConnections.map((connection) => connection.node),
    characterConnections: characterConnections.map((connection) => ({
      id: connection.id,
      role: connection.role,
      name: connection.name,
      characterId: connection.node?.id,
      mediaId: media.id,
    })),
    voiceActors: voiceActors,
    voiceActorConnections: voiceActorConnections,
    relations: relations
      .filter((relation) => isAnime(relation?.node?.type))
      .map((relation) => ({
        relationId: relation?.node?.id,
        originalId: media.id,
        relationType: relation?.relationType,
      })),

    recommendations: recommendations
      .filter((recommendation) =>
        isAnime(recommendation?.mediaRecommendation?.type),
      )
      .map((recommendation) => ({
        recommendationId: recommendation?.mediaRecommendation?.id,
        originalId: media.id,
      })),
    airingSchedules,
    tags: tags.map((tag) => tag.name),
    totalEpisodes: media.episodes,
  };
};

export const getInfoById = async <T extends MediaType>(
  ani_id: number,
  type: T,
): Promise<T extends MediaType.Anime ? Anime : Manga> => {
  const body = {
    query,
    variables: {
      type,
      id: ani_id,
    },
  };

  try {
    const data = await fetch(body);

    console.log('Success', ani_id);

    // @ts-ignore
    return type === MediaType.Anime
      ? composeAnimeData(data)
      : composeMangaData(data);
  } catch (err) {
    console.log(err.message, ani_id);
  }
};

export const getInfo = async <T extends MediaType>(
  title: string,
  type: T,
): Promise<T extends MediaType.Anime ? Anime : Manga> => {
  const body = {
    query,
    variables: {
      type,
      sort: 'SEARCH_MATCH',
      search: title,
    },
  };

  try {
    const data = await fetch(body);

    if (!data) return null;

    const { bestMatch } = findBestMatch(title, [
      ...Object.values(data.title),
      ...data.synonyms,
    ]);

    if (bestMatch.rating < 0.8) {
      console.log('Success but not exact', title);

      return null;
    }

    console.log('Success', title);

    // @ts-ignore
    return type === MediaType.Anime
      ? composeAnimeData(data)
      : composeMangaData(data);
  } catch (err) {
    console.log(err, title);
  }
};

type Body = {
  query: string;
  variables: {
    type: MediaType;
  };
};

const fetch = async (body: Body) => {
  try {
    const { data } = await client.post('https://graphql.anilist.co/', body, {
      timeout: 20000,
    });

    return data?.data?.Media as Media;
  } catch (err) {
    throw new Error(err);
  }
};

export const getRetriesInfo = async <T extends MediaType>(
  titles: string[],
  type: T,
) => {
  for (const title of titles) {
    const data = await getInfo(title, type);

    if (data) return data;
  }

  return null;
};
