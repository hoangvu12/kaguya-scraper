import BaseError from './baseError';
import StatusCode from './httpStatusCodes';

export default class Api404Error extends BaseError {
  constructor(name: string, description = 'Not found') {
    super(name, StatusCode.NOT_FOUND, true, description);
  }
}
