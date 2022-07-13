// import { User } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import supabase from '../lib/supabase';
import { mergeAnimeConnection, mergeAnimeEpisode } from '../utils/data';

type Body = {
  sourceId: string;
  episodeName: string;
  episodeId: string;
};

const animeEpisodeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // @ts-ignore
    const user = req.user as User;
    const { sourceId, episodeName, episodeId } = req.body as Body;
    const { mediaId } = req.params;

    const sourceMediaId = `${sourceId}-${mediaId}`;

    const connection = mergeAnimeConnection({
      mediaId: Number(mediaId),
      sourceId,
      sourceMediaId,
    });

    const episodeConnection = mergeAnimeEpisode({
      name: episodeName,
      sourceId,
      sourceMediaId,
      sourceEpisodeId: episodeId,
    });

    const { error: connectionError } = await supabase
      .from('kaguya_anime_source')
      .upsert(connection, { returning: 'minimal' });

    if (connectionError) {
      throw new Api500Error(connectionError.message);
    }

    const { data: insertedEpisode, error: episodeError } = await supabase
      .from('kaguya_episodes')
      .upsert({ ...episodeConnection, userId: user.id, published: false })
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
