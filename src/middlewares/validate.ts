import { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import Api400Error from '../errors/api400Error';

const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _: Response, next: NextFunction) => {
    try {
      for (const validation of validations) {
        if (!validation) continue;

        const result = await validation.run(req);

        if (!result.isEmpty()) break;
      }

      const errors = validationResult(req);

      if (errors.isEmpty()) {
        return next();
      }

      const arrayErrors = errors.array();

      throw new Api400Error(arrayErrors.map((err) => err.msg).join(', '));
    } catch (err) {
      next(err);
    }
  };
};

export default validate;
