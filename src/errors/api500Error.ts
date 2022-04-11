import BaseError from './baseError';
import StatusCode from './httpStatusCodes';

export default class Api500Error extends BaseError {
  constructor(name: string, description = 'Internal server error') {
    super(name, StatusCode.INTERNAL_SERVER_ERROR, true, description);
  }
}
