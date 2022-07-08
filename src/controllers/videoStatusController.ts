import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { getVideoHosting } from '../hostings';

const videoStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fileId, hostingId } = req.params;

    const hosting = getVideoHosting(hostingId);

    const videoFile = await hosting.getFileStatus(fileId);

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
