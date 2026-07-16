const AppError = require('../utils/appError');

// validate(schema) → middleware function
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,   // يرجع كل الأخطاء مش أول واحد
      stripUnknown: true, // يشيل أي keys مش موجودة في الـ Schema
    });

    if (error) {
      const message = error.details
        .map(d => d.message)
        .join(' | ');
      return next(new AppError(message, 400));
    }

    next();
  };
};