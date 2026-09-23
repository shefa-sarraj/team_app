const ApiError = require('../utils/ApiError');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return next(new ApiError(400, firstIssue.message));
    }

    req.body = result.data;
    next();
  };
}

module.exports = validate;
