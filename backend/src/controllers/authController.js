const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { promisify } = require("util");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
// دالة مساعدة لعمل الـ Token
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

// بتعمل التوكن وبتبعته في الـ Cookie والـ Response معاً
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  res.cookie("token", token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 يوم
    httpOnly: true, // الـ JS في المتصفح ميقدرش يقرأه (حماية من XSS)
    sameSite: "lax", // حماية من CSRF
    secure: process.env.NODE_ENV === "production", // HTTPS فقط في production
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      role: req.body.role,
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      error: err.message,
    });
  }
};

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

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "حدث خطأ في السيرفر الداخلي",
      error: err.message,
    });
  }
};
// protect midddleware
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
    // 2) البحث في الكوكيز (للمتصفح والفرونت إيند بتاعك)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    console.log("Token detected:", token); // عشان تطمن في التيرمنال إن التوكن مقروءة

    // لو مفيش توكن خالص
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    // 3) التحقق من صحة التوكن (الـ Verification)
    // لو التوكن منتهية أو ملعوب فيها، السطر ده هيرمي خطأ فوراً والـ catch هتمسكه
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

    // لو كله تمام، بنخزن بيانات المستخدم في الـ req عشان الـ routes اللي بعد كده
    req.user = currentUser;
    next();
  } catch (err) {
    // الـ catch هنا بتمسك أي مشكلة في فك شفرة الـ JWT (زي منتهي الصلاحية أو خطأ سينتكس)
    return res.status(401).json({
      status: "fail",
      message: "Invalid token or token has expired. Please log in again.",
      error: err.message,
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "you don't have permission to perform this action",
      });
    }

    next();
  };
};
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
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
      message: "حدث خطأ في إرسال الإيميل",
      error: err.message,
    });
  }
};
exports.resetPassword = async (req, res, next) => {
  //1- Get User based on Token
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
      message: "token  is invalid or has expired",
    });
  }

  user.password = req.body.password; //خُد الباسورد الجديد اللي المستخدم كتبه في الـ request body وحطه مكان الباسورد القديم في الـ user object.
  user.passwordConfrim = req.body.passwordConfrim;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //2-if token has not expired and there is a user , set the new Password
  //3- Update changePasswordAt property for user
  //4- log the user im , send JWT
};
