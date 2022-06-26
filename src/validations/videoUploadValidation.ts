import { UploadedFile } from 'express-fileupload';
import { body } from 'express-validator';

const supportedVideoExtensions = [
  'ogm',
  'wmv',
  'mpg',
  'webm',
  'ogv',
  'mov',
  'asx',
  'mpeg',
  'mp4',
  'm4v',
  'avi',
];

export const videoUploadValidation = [
  body('filename')
    .optional()
    .isString()
    .withMessage('File name must be a string')
    .custom((_, { req }) => {
      const file: UploadedFile = req.files?.file;

      if (!file) {
        throw new Error('Video file must be provided');
      }

      if (req.files?.video) {
        if (!supportedVideoExtensions.some((ext) => file.name.endsWith(ext))) {
          throw new Error(
            `Video file not supported, only supports ${supportedVideoExtensions.join(
              ', ',
            )}`,
          );
        }
      }

      return true;
    }),
];
