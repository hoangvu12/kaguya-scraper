import BaseError from './baseError';
import StatusCode from './httpStatusCodes';

export default class Api400Error extends BaseError {
  constructor(name: string, description = 'Bad request') {
    super(name, StatusCode.BAD_REQUEST, true, description);
  }
}
