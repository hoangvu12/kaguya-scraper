import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import {
  DiscordAttachment,
  uploadFile as discordUpload,
} from '../utils/discord';
import chunk from 'lodash/chunk';

const fileUploadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { file } = req.files;
    const { ctx } = req.body;

    const chunkedFiles = chunk(Array.isArray(file) ? file : [file], 10);

    const chunkUploadedFiles = await Promise.all<DiscordAttachment[]>(
      chunkedFiles.map((files) => discordUpload(files)),
    );

    const uploadedFiles = chunkUploadedFiles.flat();

    if (!uploadedFiles?.length) throw new Api500Error('Files uploaded failed');

    let modifiedFiles: DiscordAttachment[] = uploadedFiles;

    if (ctx) {
      const parsedCtx = JSON.parse(ctx);

      if (Array.isArray(parsedCtx)) {
        modifiedFiles = uploadedFiles.map((file, index) => ({
          ...file,
          ctx: parsedCtx[index],
        }));
      } else {
        modifiedFiles = uploadedFiles.map((file) => ({
          ...file,
          ctx: parsedCtx,
        }));
      }
    }

    res.status(200).json({
      success: true,
      files: modifiedFiles,
    });
  } catch (err) {
    next(err);
  }
};

export default fileUploadController;
