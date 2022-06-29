import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { getRemoteStatus } from '../utils/streamlare';

const videoRemoteStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { remoteId } = req.params;

    const remote = await getRemoteStatus(remoteId);

    if (!remote) throw new Api500Error('Remote not found');

    res.status(200).json({
      success: true,
      remote,
    });
  } catch (err) {
    next(err);
  }
};

export default videoRemoteStatusController;
