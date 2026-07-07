const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

// ===========================
// دالة مساعدة لعمل الـ Token
// ===========================
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

// ===========================
// دالة موحدة للرد بالتوكن والكوكي
// ===========================
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  // ✅ FIX: اسم الكوكي "jwt" موحد في كل الكود
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

// ===========================
// signup
// ===========================
exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      role: req.body.role,
    });

    // ✅ FIX: استخدام createSendToken بدل الكود اليدوي (بيعمل cookie صح)
    createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "عذراً، حدث خطأ أثناء إنشاء الحساب",
      error: err.message,
    });
  }
};

// ===========================
// login
// ===========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "من فضلك أدخل البريد الإلكتروني وكلمة المرور",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      });
    }

    // ✅ FIX: استخدام createSendToken بدل الكود اليدوي (بيعمل cookie صح)
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "حدث خطأ في السيرفر الداخلي",
      error: err.message,
    });
  }
};

// ===========================
// protect middleware
// ===========================
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1) البحث في الهيدرز (للموبايل أو الـ Postman)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2) البحث في الكوكيز (للمتصفح والفرونت إيند)
    // ✅ FIX: "user_token" → "jwt" عشان يتطابق مع اللي بيتحط في createSendToken
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    // 3) التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) التأكد من أن المستخدم لسه موجود وحسابه نشط
    const currentUser = await User.findById(decoded.id).select("+isActive");

    if (!currentUser || currentUser.isActive === false) {
      return res.status(401).json({
        status: "fail",
        message:
          "The token belonging to this user does no longer exist or user is inactive.",
      });
    }

    // 5) التأكد إذا كان المستخدم غيّر الباسورد بعد صدور التوكن
    if (currentUser.changePasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: "fail",
        message: "User recently changed password. Please log in again.",
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token or token has expired. Please log in again.",
      error: err.message,
    });
  }
};

// ===========================
// restrictTo middleware
// ===========================
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to perform this action",
      });
    }
    next();
  };
};

// ===========================
// forgotPassword
// ===========================
// ✅ FIX: شيلنا next من الـ signature لأنه مش مستخدم
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "لا يوجد مستخدم بهذا البريد",
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

  const message = `
    نسيت كلمة المرور؟
    اضغط على الرابط التالي:
    ${resetURL}
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset Password",
      message,
    });

    return res.status(200).json({
      status: "success",
      message: "تم إرسال الإيميل",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: "error",
      message: "حدث خطأ في إرسال الإيميل",
      error: err.message,
    });
  }
};

// ===========================
// resetPassword
// ===========================
// ✅ FIX: شيلنا next من الـ signature + استخدام createSendToken
exports.resetPassword = async (req, res) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }

  // 2) Set new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 3) Save user
  await user.save();

  // 4) Log user in — ✅ FIX: createSendToken بدل الكود اليدوي
  createSendToken(user, 200, res);
};
