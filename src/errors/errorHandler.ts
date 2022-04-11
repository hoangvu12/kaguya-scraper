/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from 'express';
import logger from '../logger';
import BaseError from './baseError';

export const logError = <T extends BaseError | Error>(err: T) => {
  console.log(err);

  logger.error(err);
};

export const returnError = <T extends BaseError | Error>(
  err: T,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logError(err);

  if (isOperationalError(err)) {
    const error = err as BaseError;

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      description: error.description,
    });

    return;
  }

  res.status(500).json({
    success: false,
    error: err.message,
    description: 'Something went wrong',
  });
};

export const isOperationalError = <T extends BaseError | Error>(error: T) => {
  if (error instanceof BaseError) {
    return error.isOperational;
  }

  return false;
};
