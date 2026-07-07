/**
 * Operational error carrying an HTTP status code. Anything thrown that is an
 * instance of ApiError is treated as a known, client-facing error by the
 * global error handler; anything else is treated as an unexpected 500.
 */
export default class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
