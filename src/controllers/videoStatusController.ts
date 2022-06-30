import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { getFile } from '../utils/streamtape';

const videoStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fileId } = req.params;

    const videoFile = await getFile(fileId);

    if (!videoFile) throw new Api500Error('Video not found');

    res.status(200).json({
      success: true,
      video: videoFile,
    });
  } catch (err) {
    next(err);
  }
};

export default videoStatusController;
