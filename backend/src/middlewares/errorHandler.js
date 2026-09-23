const ApiError = require('../utils/ApiError');
const { failure } = require('../utils/ApiResponse');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof ApiError ? err.message : err.message || 'Internal server error';

  res.status(statusCode).json(failure(message));
}

module.exports = errorHandler;
