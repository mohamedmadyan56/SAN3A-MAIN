📌 Password Reset Flow + Nodemailer (ملخص كامل)
🎯 الفكرة العامة

إحنا بنبني نظام Forgot Password بحيث المستخدم يقدر يغيّر كلمة السر لو نسيها عن طريق الإيميل.

🔁 الخطوات كاملة
1️⃣ المستخدم يطلب “نسيت كلمة المرور”
يرسل إيميله للسيرفر
POST /forgotPassword
2️⃣ السيرفر يتأكد من المستخدم
يدور على الإيميل في الداتابيز
const user = await User.findOne({ email });
3️⃣ إنشاء Reset Token
بنعمل token عشوائي
const resetToken = user.createPasswordResetToken();
📌 مهم:
بنخزن hashed token في DB (لأمان)
ونبعت plain token للمستخدم
4️⃣ حفظ البيانات في DB
نحفظ:
resetToken
expiry time (مثلاً 10 دقائق)
await user.save({ validateBeforeSave: false });
5️⃣ بناء Reset URL

لينك زي ده:

http://localhost:3000/api/v1/users/resetPassword/:token
بنحط فيه التوكن اللي هيوصل للمستخدم
6️⃣ إرسال الإيميل باستخدام Nodemailer
📦 إنشاء Transporter

هو الوسيط بين Node.js وسيرفر الإيميل

const transporter = nodemailer.createTransport({
  host,
  port,
  auth: { user, pass }
});

📌 ممكن يكون:

Gmail (غير مناسب للإنتاج)
Mailtrap (للتجربة)
SendGrid (للإنتاج)
✉️ تجهيز الإيميل
const mailOptions = {
  from: "App <support@app.com>",
  to: user.email,
  subject: "Password Reset Token",
  text: resetURL
};
📤 إرسال الإيميل
await transporter.sendMail(mailOptions);
7️⃣ رد على المستخدم
res.status(200).json({
  status: "success",
  message: "Token sent to email"
});
⚠️ التعامل مع الأخطاء (مهم جدًا)

لو إرسال الإيميل فشل:

نرجع الحالة كما كانت:
user.passwordResetToken = undefined;
user.passwordResetExpires = undefined;
await user.save();
ونرجّع Error:
return next(new AppError("Error sending email", 500));
🧠 الفكرة ببساطة
User → Request reset password
↓
Server → generates token
↓
Save hashed token in DB
↓
Send plain token via email (Nodemailer)
↓
User clicks link
↓
Reset password
🔐 أهم نقطة في التصميم
❌ ماينفعش نبعت التوكن في response
✅ لازم يتبعت في الإيميل فقط
🔐 عشان الأمان ومنع اختراق الحسابات