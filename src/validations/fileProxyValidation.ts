import { param } from 'express-validator';

export const fileProxyValidation = [
  param('id1').exists().withMessage('ID1 is required'),
  param('id2').exists().withMessage('ID2 is required'),
  param('filename').exists().withMessage('File name is required'),
];
