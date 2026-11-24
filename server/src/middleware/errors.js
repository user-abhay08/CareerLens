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
  } else if (err.code === '23505' || err.code === 11000) {
    status = 409;
    if (err.detail && err.detail.includes('email')) {
      message = 'An account with that email already exists';
    } else {
      message = 'A record with that unique value already exists';
    }
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large — max 5 MB' : (err.message || 'File upload failed');
  } else if (err.message === 'Only PDF or text files are supported') {
    status = 400;
    message = err.message;
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: message });
}
