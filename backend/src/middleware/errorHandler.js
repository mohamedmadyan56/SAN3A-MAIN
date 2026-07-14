const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };

    if (error.name === 'JsonWebTokenError') {
      error = { statusCode: 401, status: 'fail',
        message: 'Invalid token. Please log in again.', isOperational: true };
    }
    if (error.name === 'TokenExpiredError') {
      error = { statusCode: 401, status: 'fail',
        message: 'Your token has expired. Please log in again.', isOperational: true };
    }
    if (error.code === 'P2002') {
      error = { statusCode: 400, status: 'fail',
        message: 'Duplicate field value. Please use another value.', isOperational: true };
    }
    if (error.code === 'P2025') {
      error = { statusCode: 404, status: 'fail',
        message: 'Record not found.', isOperational: true };
    }

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;