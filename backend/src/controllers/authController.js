const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')
const bcrypt = require('bcryptjs')
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "90d" });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id, user.role);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({ status: "success", token, data: { user } });
};

exports.signup = catchAsync(async (req, res, next) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  const newUser = await prisma.user.create({
    data: {
      name: req.body.name, email: req.body.email, phone: req.body.phone,
      password: hashedPassword, role: req.body.role || 'customer',
    },
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("من فضلك أدخل البريد الإلكتروني وكلمة المرور", 400));
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401));
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError("You are not logged in!", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!currentUser || !currentUser.isActive) {
    return next(new AppError("User no longer exists or inactive.", 401));
  }
  if (currentUser.passwordChangedAt) {
    const changedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
    if (decoded.iat < changedTimestamp) {
      return next(new AppError("Password changed recently. Log in again.", 401));
    }
  }
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You don't have permission", 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user) return next(new AppError("لا يوجد مستخدم بهذا البريد", 404));

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
  await sendEmail({ email: user.email, subject: "Reset Password", message: `انسخ الرابط: ${resetURL}` });
  res.status(200).json({ status: "success", message: "تم إرسال الإيميل" });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      passwordChangedAt: new Date(),
    },
  });
  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
  createSendToken(updatedUser, 200, res);
});
