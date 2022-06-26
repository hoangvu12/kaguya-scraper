// import { User } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import supabase from '../lib/supabase';
import { mergeAnimeConnection, mergeAnimeEpisode } from '../utils/data';

type Body = {
  sourceId: string;
  episode: {
    name: string;
    id: string;
  };
};

const animeEpisodeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sourceId, episode } = req.body as Body;
    const { mediaId } = req.params;

    const sourceMediaId = `${sourceId}-${mediaId}`;

    const connection = mergeAnimeConnection({
      mediaId: Number(mediaId),
      sourceId,
      sourceMediaId,
    });

    const episodeConnection = mergeAnimeEpisode({
      name: episode.name,
      sourceId,
      sourceMediaId,
      sourceEpisodeId: episode.id,
    });

    const { error: connectionError } = await supabase
      .from('kaguya_anime_source')
      .upsert(connection, { returning: 'minimal' });

    if (connectionError) {
      throw new Api500Error(connectionError.message);
    }

    const { data: insertedEpisode, error: episodeError } = await supabase
      .from('kaguya_episodes')
      .upsert(episodeConnection)
      .single();

    if (episodeError) {
      throw new Api500Error(episodeError.message);
    }

    res.status(200).json({
      success: true,
      episode: insertedEpisode,
    });
  } catch (err) {
    next(err);
  }
};

export default animeEpisodeController;
