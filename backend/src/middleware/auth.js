const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'You are not logged in!' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({ status: 'fail', message: 'User no longer exists or inactive.' });
    }
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({ status: 'fail', message: 'Password changed recently. Log in again.' });
      }
    }
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Invalid token.', error: err.message });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: "You don't have permission" });
    }
    next();
  };
};