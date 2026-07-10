const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')
const bcrypt = require('bcryptjs')
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const { error } = require('console');




const signToken = (id,role)=>{
  return jwt.sign({id,role},process.env.JWT_SECRET,{expiresIn:"90d"});

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




exports.signup = async (req,res)=>{
  try{
    const hashedPassword = await bcrypt.hash(req.body.password,12);
    const newUser = await prisma.user.create({
      data:{
        name:req.body.name, email:req.body.email , phone:req.body.phone,
        password:hashedPassword,role:req.body.role || 'customer',

      },
    });
    createSendToken(newUser,201,res);


  }catch(err){
    res.status(400).json({
      status:"fail",
      message:"عذراً، حدث خطأ أثناء إنشاء الحساب",
      error:err.message
    })
  }
}



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: "fail", message: "من فضلك أدخل البريد الإلكتروني وكلمة المرور" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: "fail", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ status: "error", message: "حدث خطأ في السيرفر الداخلي", error: err.message });
  }
};



exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      return res.status(401).json({ status: "fail", message: "You are not logged in!" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({ status: "fail", message: "User no longer exists or inactive." });
    }
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({ status: "fail", message: "Password changed recently. Log in again." });
      }
    }
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ status: "fail", message: "Invalid token.", error: err.message });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: "fail", message: "You don't have permission" });
    }
    next();
  };
};