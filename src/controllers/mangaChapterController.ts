// import { User } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import supabase from '../lib/supabase';
import { mergeMangaConnection, mergeMangaChapter } from '../utils/data';

type Body = {
  sourceId: string;
  chapterName: string;
  chapterId: string;
};

const mangaChapterController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // @ts-ignore
    const user = req.user as User;
    const { sourceId, chapterName, chapterId } = req.body as Body;
    const { mediaId } = req.params;

    const sourceMediaId = `${sourceId}-${mediaId}`;

    const connection = mergeMangaConnection({
      mediaId: Number(mediaId),
      sourceId,
      sourceMediaId,
    });

    const chapterConnection = mergeMangaChapter({
      name: chapterName,
      sourceId,
      sourceMediaId,
      sourceChapterId: chapterId,
    });

    const { error: connectionError } = await supabase
      .from('kaguya_manga_source')
      .upsert(connection, { returning: 'minimal' });

    if (connectionError) {
      throw new Api500Error(connectionError.message);
    }

    const { data: insertedChapter, error: chapterError } = await supabase
      .from('kaguya_chapters')
      .upsert({ ...chapterConnection, userId: user.id, published: false })
      .single();

    if (chapterError) {
      throw new Api500Error(chapterError.message);
    }

    res.status(200).json({
      success: true,
      chapter: insertedChapter,
    });
  } catch (err) {
    next(err);
  }
};

export default mangaChapterController;
