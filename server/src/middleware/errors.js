import mongoose from 'mongoose';
import { ZodError } from 'zod';

export function AppError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export function notFound(req, res, next) {
  next(AppError(`Route not found: ${req.method} ${req.path}`, 404));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err instanceof ZodError) {
    status = 400;
    message = err.issues?.[0]?.message || 'Invalid input';
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)[0]?.message || 'Invalid data';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `That ${field} is already registered`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id format';
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: message });
}
