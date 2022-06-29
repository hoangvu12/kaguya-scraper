import axios from 'axios';
import { NextFunction, Request, Response } from 'express';

const fileProxyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id1, id2, filename } = req.params;

  try {
    const response = await axios.get(
      `https://cdn.discordapp.com/attachments/${id1}/${id2}/${filename}`,
      { responseType: 'stream', validateStatus: () => true, maxRedirects: 0 },
    );

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');

    for (const header in response.headers) {
      if (header.toLowerCase() === 'location') continue;

      res.setHeader(header, response.headers[header]);
    }

    response.data.pipe(res);
  } catch (err) {
    next(err);
  }
};

export default fileProxyController;
