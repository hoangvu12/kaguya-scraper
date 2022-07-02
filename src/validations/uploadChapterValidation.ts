import { body } from 'express-validator';

export const uploadChapterValidation = [
  body('sourceId')
    .exists()
    .withMessage('Source Id must be provided')
    .isString()
    .withMessage('Source Id must be a string')
    .trim()
    .escape(),
  body('chapterName')
    .isString()
    .withMessage('Chapter name must be a string')
    .trim()
    .escape(),
  body('chapterId')
    .isString()
    .withMessage('Chapter id must be a string')
    .trim()
    .escape(),
];
