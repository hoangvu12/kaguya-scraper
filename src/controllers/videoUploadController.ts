import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { uploadFile as streamlareUpload } from '../utils/streamlare';

const videoUploadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { video } = req.files;
    const { fileName } = req.body;

    const willUploadVideo = Array.isArray(video) ? video[0] : video;

    if (fileName) {
      willUploadVideo.name = fileName;
    }

    const uploadedVideo = await streamlareUpload(willUploadVideo);

    if (!uploadedVideo?.hashid) throw new Api500Error('Video uploaded failed');

    res.status(200).json({
      success: true,
      video: uploadedVideo,
    });
  } catch (err) {
    next(err);
  }
};

export default videoUploadController;
