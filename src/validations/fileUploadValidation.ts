import { UploadedFile } from 'express-fileupload';
import { body } from 'express-validator';

export const fileUploadValidation = [
  body('filename')
    .optional()
    .isString()
    .withMessage('File name must be a string')
    .custom((_, { req }) => {
      const files: UploadedFile | UploadedFile[] = req.files?.file;

      const MAX_FILE_SIZE = 80 * 1024 * 1024; // 8MB

      if (!files) {
        throw new Error('No file found');
      }

      if (Array.isArray(files)) {
        if (!files?.length) {
          throw new Error('No file found');
        }

        if (files.every((file) => file.size > MAX_FILE_SIZE)) {
          throw new Error('File size is too large');
        }
      } else if (!Array.isArray(files)) {
        if (files.size > MAX_FILE_SIZE) {
          throw new Error('File size must be less than 8MB');
        }
      }

      return true;
    }),
  body('ctx')
    .optional()
    .isString()
    .withMessage('Context must be a json string')
    .custom((value) => {
      try {
        JSON.parse(value);
      } catch (err) {
        throw new Error('Context must be a json string');
      }

      return true;
    }),
];
