import { param } from 'express-validator';

export const videoStatusValidation = [
  param('fileId').exists().withMessage("'fileId' is required"),
];
