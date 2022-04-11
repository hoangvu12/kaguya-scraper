export default class BaseError extends Error {
  name: string;
  statusCode: number;
  isOperational: boolean;
  description: string;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean,
    description: string,
  ) {
    super(message);

    this.description = description;
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
