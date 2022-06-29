import { body } from 'express-validator';

export const uploadEpisodeValidation = [
  body('sourceId')
    .exists()
    .withMessage('Source Id must be provided')
    .isString()
    .withMessage('Source Id must be a string')
    .trim()
    .escape(),
  body('episodeName')
    .isString()
    .withMessage('Episode name must be a string')
    .trim()
    .escape(),
  body('episodeId')
    .isString()
    .withMessage('Episode id must be a string')
    .trim()
    .escape(),
];
