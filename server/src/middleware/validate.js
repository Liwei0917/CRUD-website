import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Collects express-validator results and throws a 422 if any check failed.
 */
export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return next(new ApiError(422, 'Validation failed', details));
};
