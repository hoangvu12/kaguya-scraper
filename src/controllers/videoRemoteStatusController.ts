import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import { getHosting } from '../hostings';

const videoRemoteStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { remoteId, hostingId } = req.params;

    const hosting = getHosting(hostingId);

    const remote = await hosting.getRemoteStatus(remoteId);

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
