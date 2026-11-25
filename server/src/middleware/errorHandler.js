export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred'
      : err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.path}:`, err);

  res.status(statusCode).json({
    error: message,
  });
}
