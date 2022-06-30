import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { uploadFile as streamtapeUpload } from '../utils/streamtape';

const videoUploadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { file } = req.files;
    const { fileName } = req.body;

    const willUploadVideo = Array.isArray(file) ? file[0] : file;

    if (fileName) {
      willUploadVideo.name = fileName;
    }

    const uploadedVideo = await streamtapeUpload(willUploadVideo);

    if (!uploadedVideo?.id) throw new Api500Error('Video uploaded failed');

    res.status(200).json({
      success: true,
      video: uploadedVideo,
    });
  } catch (err) {
    next(err);
  }
};

export default videoUploadController;
