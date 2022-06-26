import { body } from 'express-validator';

export const videoRemoteUploadValidation = [
  body('file')
    .exists()
    .withMessage('Video file must be provided')
    .isString()
    .withMessage('Video file must be a string')
    .trim()
    .escape(),
  body('fileName')
    .optional()
    .isString()
    .withMessage('Video file name must be a string')
    .trim()
    .escape(),
];
