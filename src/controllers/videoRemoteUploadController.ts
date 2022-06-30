import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { uploadByUrl as streamtapeUpload } from '../utils/streamtape';

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

    const remote = await streamtapeUpload(file, filename);

    if (!remote.id) throw new Api500Error('Video uploaded failed');

    res.status(200).json({
      success: true,
      remote,
    });
  } catch (err) {
    next(err);
  }
};

export default videoRemoteUploadController;
