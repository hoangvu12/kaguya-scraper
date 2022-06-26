// import { User } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { uploadByUrl as streamlareUpload } from '../utils/streamlare';

type Body = {
  file: string;
  fileName: string;
};

const videoRemoteUploadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { file, fileName } = req.body as Body;

    const uploadedVideo = await streamlareUpload(file, fileName);

    if (!uploadedVideo?.hashid) throw new Api500Error('Video uploaded failed');

    res.status(200).json({
      success: true,
      video: uploadedVideo,
    });
  } catch (err) {
    next(err);
  }
};

export default videoRemoteUploadController;
