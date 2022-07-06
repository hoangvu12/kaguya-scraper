import { param } from 'express-validator';

export const videoRemoteStatusValidation = [
  param('remoteId').exists().withMessage("'remoteId' is required"),
  param('hostingId').exists().withMessage('Hosting id must be provided'),
];
