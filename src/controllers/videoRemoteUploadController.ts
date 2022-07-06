import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { getHosting } from '../hostings';

type Body = {
  file: string;
  filename: string;
};

const videoRemoteUploadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { file, filename } = req.body as Body;
    const { hostingId } = req.params;

    const hosting = getHosting(hostingId);

    const remoteId = await hosting.uploadRemoteFile(file, filename);

    if (!remoteId) throw new Api500Error('Video uploaded failed');

    res.status(200).json({
      success: true,
      remoteId,
    });
  } catch (err) {
    next(err);
  }
};

export default videoRemoteUploadController;
