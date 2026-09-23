const { failure } = require('../utils/ApiResponse');

function notFound(req, res) {
  res.status(404).json(failure('Route not found'));
}

module.exports = notFound;
