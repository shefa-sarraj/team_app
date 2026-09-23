const ApiError = require('../utils/ApiError');

function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return next(new ApiError(400, firstIssue.message));
    }

    req[target] = result.data;
    next();
  };
}

module.exports = validate;
