import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { getVideoHosting } from '../hostings';

const videoUploadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { file } = req.files;
    const { fileName } = req.body;
    const { hostingId } = req.params;

    const hosting = getVideoHosting(hostingId);

    const willUploadVideo = Array.isArray(file) ? file[0] : file;

    if (fileName) {
      willUploadVideo.name = fileName;
    }

    const videoId = await hosting.uploadFile(willUploadVideo);

    if (!videoId) throw new Api500Error('Video uploaded failed');

    res.status(200).json({
      success: true,
      videoId,
    });
  } catch (err) {
    next(err);
  }
};

export default videoUploadController;
