import { NextFunction, Request, Response } from 'express';
import { decode } from 'he';
import Api500Error from '../errors/api500Error';
import { getVideoHosting } from '../hostings';

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

    const hosting = getVideoHosting(hostingId);

    const url = decode(decodeURIComponent(file));

    const remoteId = await hosting.uploadRemoteFile(url, filename);

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
