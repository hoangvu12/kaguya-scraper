import {
  CharacterRole,
  FuzzyDate,
  MediaFormat,
  MediaRelation,
  MediaStatus,
  MediaTitle as ALMediaTitle,
} from './anilist';

export interface MediaTitle extends Partial<ALMediaTitle> {
  [key: string]: string;
}

export type MediaDescription = Record<string, string>;

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

export type VoiceActorImage = {
  large: string;
  medium: string;
};

export type VoiceActorName = {
  first: string;
  middle: string;
  last: string;
  full: string;
  native: string;
  alternative: string[];
  userPreferred: string;
};

export type VoiceActorConnection = {
  voiceActorId: number;
  characterId: number;
};

export type VoiceActor = {
  id: number;
  name: VoiceActorName;
  language: string;
  image: VoiceActorImage;
  primaryOccupations: string[];
  gender: string;
  dateOfBirth: FuzzyDate;
  dateOfDeath: FuzzyDate;
  age: number;
  yearsActive: number[];
  homeTown: string;
  bloodType: string;
  favourites: number;
};

export type AiringSchedule = {
  id: number;
  airingAt: number;
  episode: number;
  mediaId: number;
};

export type Recommendation = {
  originalId: number;
  recommendationId: number;
};

export type Relation = {
  originalId: number;
  relationId: number;
  relationType: MediaRelation;
};

export type CharacterImage = {
  large: string;
  medium: string;
};

export type CharacterName = {
  first: string;
  middle: string;
  last: string;
  full: string;
  native: string;
  alternative: string[];
  alternativeSpoiler: string[];
  userPreferred: string;
};

export type CharacterConnection = {
  characterId: number;
  id: number;
  role: CharacterRole;
  name: string;
  mediaId: number;
};

export type Character = {
  id: number;
  name: CharacterName;
  image: CharacterImage;
  gender: string;
  dateOfBirth: FuzzyDate;
  age: string;
  bloodType: string;
  favourites: number;
};

export type StudioConnection = {
  studioId: number;
  isMain: boolean;
  id: number;
  mediaId: number;
};

export type Studio = {
  id: number;
  name: string;
  isAnimationStudio: boolean;
  favourites: number;
};

export type CoverImage = {
  extraLarge: string;
  large: string;
  medium: string;
  color: string;
};

export interface Media {
  id: number;
  idMal: number;
  title: MediaTitle;
  coverImage: CoverImage;
  startDate: FuzzyDate;
  trending: number;
  popularity: number;
  favourites: number;
  bannerImage: string;
  format: MediaFormat;
  status: MediaStatus;
  characterConnections: CharacterConnection[];
  characters: Character[];
  relations: Relation[];
  recommendations: Recommendation[];
  tags: string[];
  genres: string[];
  countryOfOrigin: string;
  isAdult: boolean;
  synonyms: string[];
  averageScore: number;
  description: MediaDescription;
}

export interface AnilistAnime extends Media {
  season: string;
  seasonYear: number;
  totalEpisodes: number;
  studios: Studio[];
  studioConnections: StudioConnection[];
  voiceActorConnections: VoiceActorConnection[];
  voiceActors: VoiceActor[];
  airingSchedules: AiringSchedule[];
  duration: number;
  trailer: string;
}

export interface SourceEpisode {
  name: string;
  sourceEpisodeId: string;
  sourceMediaId: string;
}
export interface SourceAnime {
  titles: string[];
  description?: MediaDescription;
  episodes: SourceEpisode[];
  sourceId: string;
  sourceMediaId: string;
  title?: MediaTitle;
  anilistId?: number;
}
export interface SourceChapter {
  name: string;
  sourceChapterId: string;
  sourceMediaId: string;
}
export interface SourceManga {
  titles: string[];
  description?: MediaDescription;
  chapters: SourceChapter[];
  sourceId: string;
  sourceMediaId: string;
  title?: MediaTitle;
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
}
export interface Anime extends AnilistAnime {
  episodes: Episode[];
  sourceAnimeConnection: SourceMediaConnection;
}

export interface AnilistManga extends Media {
  totalChapters: number;
}

export interface Manga extends AnilistManga {
  chapters: Chapter[];
  sourceMangaConnection: SourceMediaConnection;
}

export type MediaUnit = Episode | Chapter | SourceEpisode | SourceChapter;
