# توثيق Backend منصة صنعة

> وثيقة شاملة لكود و Flow الـ Backend لمشروع منصة صنعة (San3a)  
> المشروع: سوق إلكتروني لخدمات الصيانة المنزلية (سباكة، كهرباء، تكييف، نظافة)

---

## 📋 المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [التقنيات المستخدمة](#2-التقنيات-المستخدمة)
3. [هيكل المشروع (Folder Structure)](#3-هيكل-المشروع)
4. [قاعدة البيانات (Database Schema)](#4-قاعدة-البيانات)
5. [التوثيق (Authentication & Authorization)](#5-التوثيق)
6. [دورة حياة الطلب (Request Lifecycle)](#6-دورة-حياة-الطلب)
7. [خوارزمية المطابقة (Match Scoring)](#7-خوارزمية-المطابقة)
8. [الـ API الكامل (Endpoints)](#8-الـ-api-الكامل)
9. [Geolocation & البحث الجغرافي](#9-البحث-الجغرافي)
10. [التثبيت والتشغيل](#10-التثبيت-والتشغيل)
11. [Docker & Deployment](#11-docker)

---

## 1. نظرة عامة

**منصة صنعة** هي API بنظام Node.js/Express يربط **العملاء** بأصحاب المهن (الصنّاع) لطلب خدمات الصيانة المنزلية.

###解决问题的
- العميل يطلب خدمة (مثلاً "سباكة") مع تحديد موقعه
- النظام يبحث عن أقرب الصنّاع المتاحين باستخدام MongoDB الجغرافي
- ترتيب الصنّاع حسب **نسبة المطابقة** (المسافة + التقييم + سرعة الاستجابة + تاريخ التعامل)
- إدارة دورة حياة الطلب من "قيد البحث" حتى "مكتمل"

### الأدوار (Roles)

| الدور | الوصف |
|-------|-------|
| `customer` | عميل يطلب خدمات |
| `craftsman` | فني/صانع يستقبل الطلبات |
| `admin` | مشرف (لوحة تحكم) |

---

## 2. التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|----------|---------|-----------|
| Node.js | >= 16 | بيئة التشغيل |
| Express | ^5.2.1 | إطار العمل (Web Framework) |
| MongoDB | 7.0 | قاعدة البيانات |
| Mongoose | ^9.6.3 | إدارة قواعد MongoDB |
| jsonwebtoken | ^9.0.3 | المصادقة بالـ JWT |
| bcryptjs | ^3.0.3 | تشفير كلمات المرور |
| nodemailer | ^6.10.1 | إرسال الإيميلات (استعادة كلمة المرور) |
| validator | ^13.15.35 | التحقق من صحة الإيميل |
| cors | ^2.8.6 | التحكم في النطاقات المسموحة |
| dotenv | ^17.4.2 | إدارة المتغيرات البيئية |
| nodemon | ^3.1.14 | إعادة التشغيل التلقائي (تطوير) |

---

## 3. هيكل المشروع

```
backend/
├── server.js                    # نقطة الدخول: اتصال MongoDB + تشغيل السيرفر
├── app.js                       # إعداد Express: CORS, JSON parsing, routing
├── seed.js                      # سكريبت بذر الخدمات (نظافة، تكييف، سباكة، كهرباء)
├── Dockerfile                   # حاوية Docker للإنتاج
├── docker-compose.yml           # تشغيل MongoDB + Backend معاً
├── .env.example                 # نموذج المتغيرات البيئية
├── package.json
│
└── src/
    ├── controllers/
    │   ├── authController.js     # signup, login, protect, restrictTo,
    │   │                         # forgotPassword, resetPassword
    │   ├── requestController.js  # CRUD الطلبات، البحث الجغرافي، المطابقة
    │   └── serviceController.js  # قائمة وعرض الخدمات
    │
    ├── models/
    │   ├── userModel.js          # Schema المستخدم
    │   ├── requestModel.js       # Schema الطلب
    │   └── serviceModel.js       # Schema الخدمة
    │
    ├── routes/
    │   ├── userRoutes.js         # /api/v1/users/*
    │   ├── serviceRoutes.js      # /api/v1/services/*
    │   └── requestRoutes.js      # /api/v1/requests/*
    │
    └── utils/
        └── email.js              # إرسال الإيميل عبر Nodemailer
```

### شرح المجلدات

| المجلد | الوظيفة |
|--------|---------|
| `controllers/` | منطق الأعمال (Business Logic) - كل process في ملف |
| `models/` | تعريف Schemas Mongoose مع الحقول، التحقق، الـ Hooks، والـ Indexes |
| `routes/` | ربط الـ Endpoints بالـ Controllers وإضافة Middleware |
| `utils/` | أدوات مساعدة (إيميل) |

---

## 4. قاعدة البيانات

### 4.1 User Model (`src/models/userModel.js`)
**Collection:** `users`

| الحقل | النوع | إجباري | الافتراضي | ملاحظات |
|-------|------|--------|-----------|---------|
| `name` | String | ✅ | — | الاسم الكامل |
| `email` | String | ✅ | — | unique, lowercase, validation |
| `phone` | String | ✅ | — | unique |
| `password` | String | ✅ | — | minlength 8, `select: false` |
| `role` | String | — | `'customer'` | enum: customer, craftsman, admin |
| `avatar` | String | — | `'default.png'` | |
| `location.type` | String | — | `'Point'` | GeoJSON |
| `location.coordinates` | [Number] | — | `[31.2357, 30.0444]` | [lng, lat] - القاهرة افتراضياً |
| `location.address` | String | — | — | العنوان النصي |
| `isAvailable` | Boolean | — | `true` | هل الفني متاح؟ |
| `rating` | Number | — | `4.5` | من 1 إلى 5 |
| `avgResponseTimeSeconds` | Number | — | `null` | متوسط سرعة الاستجابة بالثواني |
| `responseCount` | Number | — | `0` | عدد مرات الرد |
| `passwordChangedAt` | Date | — | — | لتحديث JWT بعد تغيير الباسورد |
| `isActive` | Boolean | — | `true` | `select: false` |
| `passwordResetToken` | String | — | — | SHA-256 hash |
| `passwordResetExpires` | Date | — | — | 10 دقائق صلاحية |

**Indexes:**
```javascript
userSchema.index({ location: '2dsphere' });
```

**Hooks:**
- `pre('save')`: تشفير الباسورد بـ bcryptjs (12 round) عند التعديل

**Instance Methods:**
| الدالة | الوظيفة |
|--------|---------|
| `correctPassword(candidate, hash)` | مقارنة الباسورد |
| `changePasswordAfter(JWTTimestamp)` | التحقق من تغيير الباسورد بعد الـ JWT |
| `createPasswordResetToken()` | توليد توكن استعادة (plain text + SHA-256 hash) |
| `recordResponseTime(seconds)` | تحديث متوسط سرعة الاستجابة (running average) |

### 4.2 Service Model (`src/models/serviceModel.js`)
**Collection:** `services`

| الحقل | النوع | ملاحظات |
|-------|------|---------|
| `nameAr` | String | unique, trim - اسم الخدمة بالعربية |
| `nameEn` | String | unique, trim - اسم الخدمة بالإنجليزية |
| `slug` | String | unique - المعرف |
| `icon` | String | الأيقونة |
| `isActive` | Boolean | default: true |

**الخدمات المزروعة (seed):**
- نظافة (Cleaning)
- تكييف (Air Conditioning)
- سباكة (Plumbing)
- كهرباء (Electricity)

### 4.3 Request Model (`src/models/requestModel.js`)
**Collection:** `requests`

| الحقل | النوع | ملاحظات |
|-------|------|---------|
| `client` | ObjectId → User | العميل صاحب الطلب |
| `craftsman` | ObjectId → User | null في البداية |
| `service` | ObjectId → Service | نوع الخدمة |
| `status` | String | PENDING_MATCHING ← ACCEPTED ← ARRIVED ← IN_PROGRESS ← COMPLETED / CANCELLED |
| `statusHistory[]` | [{status, changeAt, note}] | سجل تغييرات الحالة |
| `matchingPool[]` | [{craftsman, offeredAt, respondedAt, response}] | سجل عرض الطلب على الصنّاع |
| `location.address` | String | العنوان |
| `location.coordinates` | [Number] | [lng, lat] |
| `scheduledAt` | Date | موعد الخدمة |
| `clientNotes` | String | ملاحظات العميل |
| `pricing.baseFee` | Number | 120 ج.م |
| `pricing.emergencyFee` | Number | 30 ج.م للطلبات الفورية |
| `pricing.totalAmount` | Number | الإجمالي |
| `paymentMethod` | String | CASH, CARD, VODAFONE_CASH |
| `isPaid` | Boolean | default: false |

**Statuses:**
```
PENDING_MATCHING → جاري البحث عن فني
ACCEPTED         → تم قبول الطلب
ARRIVED          → الفني وصل
IN_PROGRESS      → الخدمة قيد التنفيذ
COMPLETED        → تم الإنهاء
CANCELLED        → ملغي
```

**matchingPool:**
كل فني شاف الطلب في شاشة الرادار بيتسجل هنا مع:
- `offeredAt`: وقت عرض الطلب
- `respondedAt`: وقت الرد
- `response`: PENDING / ACCEPTED / REJECTED / EXPIRED

---

## 5. التوثيق

### 5.1 Signup
```
POST /api/v1/users/signup
Body: { name, email, phone, password, role? }
Response: 201 { token, user }
```
- `User.create()` → pre-save hook يشفر الباسورد → `signToken()` → JWT

### 5.2 Login
```
POST /api/v1/users/login
Body: { email, password }
Response: 200 { token, user }
```
- البحث عن المستخدم بـ `select('+password')` → `correctPassword()` → `signToken()`

### 5.3 Protect Middleware
1. استخراج التوكن من `Authorization: Bearer <token>` أو `req.cookies.user_token`
2. `jwt.verify(token, JWT_SECRET)`
3. البحث عن المستخدم بـ `select('+isActive')`
4. التحقق من أن المستخدم نشط
5. `changePasswordAfter(decoded.iat)`
6. `req.user = currentUser` → `next()`

### 5.4 restrictTo(...roles)
```javascript
authController.restrictTo('admin')
authController.restrictTo('craftsman', 'admin')
```

### 5.5 Forgot Password
```
POST /api/v1/users/forgotPassword
Body: { email }
Response: 200 { message: "تم إرسال الإيميل" }
```
1. البحث عن المستخدم بالإيميل
2. `createPasswordResetToken()` → randomBytes(32) + SHA-256 hash
3. حفظ التوكن في DB (صلاحية 10 دقائق)
4. إرسال إيميل بالرابط: `{protocol}://{host}/api/v1/users/resetPassword/{plainToken}`

### 5.6 Reset Password
```
POST /api/v1/users/resetPassword/:token
Body: { password }
```
1. تشفير التوكن بـ SHA-256
2. البحث عن المستخدم بالتوكن المشفر وعدم انتهاء الصلاحية
3. تحديث الباسورد وحذف التوكن

⚠️ **ملاحظة:** الـ resetPassword غير مكتمل - لا يُرجع Response نجاح ولا يضبط `passwordChangedAt`.

---

## 6. دورة حياة الطلب

### 6.1 إنشاء الطلب (Customer)
```
Customer → POST /requests
         → PENDING_MATCHING
         → pricing: baseFee=120, emergencyFee=30 (للفوري)
```

### 6.2 البحث عن الصنّاع

**السيناريو الكامل:**

```
1. العميل ينشئ طلب (PENDING_MATCHING)
2. يدخل شاشة الرادار → GET /nearby-craftsmen
   → $geoNear على Users (role=craftsman, isAvailable=true)
   → تسجيلهم في matchingPool
3. بعد 15 ثانية → تحويل تلقائي لنتائج المطابقة
4. GET /match-results → خوارزمية التقييم
5. الصنّاع يشوفون الطلب → POST /accept أو /reject
6. أول فني يقبل → ACCEPTED → isAvailable=false
7. الفني يحدث الحالة: ARRIVED → IN_PROGRESS
8. الفني ينهي: PATCH /complete → COMPLETED → isAvailable=true
```

### 6.3 قبول الطلب
```
POST /requests/:requestId/accept  [Craftsman only]
```
1. التحقق من أن `role === 'craftsman'`
2. التحقق من أن `status === 'PENDING_MATCHING'`
3. تعيين `craftsman = req.user._id` و `status = ACCEPTED`
4. تحديث `matchingPool` (response=ACCEPTED, respondedAt)
5. حساب `responseSeconds` من `respondedAt - offeredAt`
6. `craftsman.isAvailable = false`
7. `recordResponseTime(responseSeconds)`

### 6.4 رفض الطلب
```
POST /requests/:requestId/reject  [Craftsman only]
```
- البحث عن الـ pool entry → REJECTED + حساب response time

### 6.5 تحديث الحالة
```
PATCH /requests/:requestId/status  [Assigned craftsman only]
Body: { status }
```

### 6.6 إنهاء الطلب
```
PATCH /requests/:requestId/complete  [Assigned craftsman only]
```
- `status = COMPLETED`
- `craftsman.isAvailable = true`

---

## 7. خوارزمية المطابقة

### الأوزان (المجموع = 1)

| العامل | الوزن | الوصف |
|--------|-------|-------|
| المسافة (Distance) | 40% | الأقرب = الأعلى نقاطاً |
| التقييم (Rating) | 30% | من 1 إلى 5 |
| سرعة الاستجابة (Response Time) | 20% | الأسرع = الأعلى نقاطاً |
| تاريخ التعامل (History) | 10% | عدد الطلبات المكتملة سابقاً مع هذا العميل |

### كيف تعمل الخوارزمية (`getMatchResults`)

```
GET /requests/:requestId/match-results?radius=10000
```

**الخطوات:**

1. **$geoNear** → البحث عن الصنّاع المتاحين ضمن نطاق 10 كم
2. **تجميع التاريخ السابق** → عدد الطلبات المكتملة لكل فني مع هذا العميل
3. **التطبيع (Normalization)** لكل عامل إلى قيمة بين 0 و 1:
   - المسافة: `normalize(distance, 0, maxDistance, lowerIsBetter=true)`
   - التقييم: `normalize(rating, 1, 5, lowerIsBetter=false)`
   - سرعة الاستجابة: `normalize(responseSeconds, 0, 600, lowerIsBetter=true)`
   - التاريخ: `normalize(completedCount, 0, maxHistory, lowerIsBetter=false)`
4. **الدرجة النهائية** = `(distance * 0.4 + rating * 0.3 + responseTime * 0.2 + history * 0.1) * 100`
5. **الترتيب** تنازلياً حسب `matchPercentage`

**قيم افتراضية:**
- فني بدون تقييم: 4.5
- فني بدون سجل استجابة: 120 ثانية (دقيقتين)
- أبطأ استجابة معقولة: 600 ثانية (10 دقائق)

---

## 8. الـ API الكامل

**Base URL:** `http://localhost:5000/api/v1`

### المصادقة (Users)

| الطريقة | المسار | Auth | الوصف |
|---------|--------|------|-------|
| POST | `/users/signup` | ❌ | تسجيل حساب جديد |
| POST | `/users/login` | ❌ | تسجيل الدخول → JWT |
| POST | `/users/forgotPassword` | ❌ | إرسال إيميل استعادة كلمة المرور |
| POST | `/users/resetPassword/:token` | ❌ | إعادة تعيين كلمة المرور |
| GET | `/users/profile` | ✅ | الملف الشخصي |
| GET | `/users/admin-dashboard` | Admin | لوحة تحكم المشرف |
| GET | `/users/craftsman-orders` | Craftsman | طلبات الفني |

### الخدمات (Services)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/services/` | جلب الخدمات النشطة |
| POST | `/services/` | إنشاء خدمة جديدة |

### الطلبات (Requests)

| الطريقة | المسار | Auth | الوصف |
|---------|--------|------|-------|
| POST | `/requests/` | ✅ | إنشاء طلب جديد |
| GET | `/requests/:id` | ✅ | عرض الطلب (بدون التحقق من الملكية) |
| GET | `/requests/:requestId/nearby-craftsmen` | ✅ | بحث عن أقرب الصنّاع (افتراضي 5 كم) |
| GET | `/requests/:requestId/match-results` | ✅ | نتائج المطابقة (افتراضي 10 كم) |
| POST | `/requests/:requestId/accept` | Craftsman | قبول الطلب |
| POST | `/requests/:requestId/reject` | Craftsman | رفض الطلب |
| PATCH | `/requests/:requestId/status` | Craftsman | تحديث حالة الطلب |
| PATCH | `/requests/:requestId/complete` | Craftsman | إنهاء الطلب |

### هيدر المصادقة
```
Authorization: Bearer <your_jwt_token>
```

---

## 9. البحث الجغرافي

### تخزين الإحداثيات

**User (craftsman):**
```javascript
location: {
  type: 'Point',
  coordinates: [longitude, latitude],  // [31.2357, 30.0444] القاهرة
  address: String
}
```

**Request:**
```javascript
location: {
  address: String,
  coordinates: [longitude, latitude]
}
```

### 2dsphere Indexes
- `users`: `{ location: '2dsphere' }`
- `requests`: `{ "location.coordinates": "2dsphere" }`

### استعلام $geoNear
```javascript
User.aggregate([
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [longitude, latitude] },
      distanceField: 'distance',
      maxDistance: radiusInMeters,
      query: { role: 'craftsman', isAvailable: true },
      spherical: true,
    },
  },
]);
```

### أنصاف أقطار البحث
| الاستخدام | الافتراضي | قابل للتغيير |
|-----------|-----------|---------------|
| Nearby (قريب) | 5,000 م (5 كم) | `?radius=` |
| Match (مطابقة) | 10,000 م (10 كم) | `?radius=` |

---

## 10. التثبيت والتشغيل

### محلياً
```bash
cd backend
npm install
cp .env.example .env
# عدّل .env ببيانات MongoDB, JWT secret, إعدادات الإيميل
npm run dev          # للتطوير (مع auto-reload)
npm start            # للإنتاج
```

### بذر البيانات
```bash
node seed.js
# يضيف: تنظيف، تكييف، سباكة، كهرباء
```

### المتغيرات البيئية

| المتغير | إجباري | الوصف |
|---------|--------|-------|
| `MONGO_URI` | ✅ | رابط MongoDB |
| `JWT_SECRET` | ✅ | مفتاح توقيع JWT |
| `PORT` | ❌ | البورت (default: 5000) |
| `NODE_ENV` | ❌ | development/production |
| `FRONTEND_URL` | ❌ | CORS origin (default: http://localhost:3000) |
| `EMAIL_HOST` | للـ Password Reset | SMTP host |
| `EMAIL_PORT` | للـ Password Reset | SMTP port |
| `EMAIL_USERNAME` | للـ Password Reset | SMTP user |
| `EMAIL_PASSWORD` | للـ Password Reset | SMTP pass |

---

## 11. Docker

### Dockerfile
- مرحلتين (Multi-stage): `deps` لتثبيت الاعتماديات، `runner` للتشغيل
- يستخدم `node:20-alpine` (صورة خفيفة)
- `dumb-init` لإدارة الإشارات (SIGTERM)
- مستخدم غير جذر (non-root `appuser`)
- `NODE_ENV=production`

### Docker Compose
```bash
docker compose up --build
```

**الخدمات:**
| الخدمة | البورت | الوصف |
|--------|--------|-------|
| `mongo` | 27017 | MongoDB 7.0 |
| `backend` | 5000 | Node.js API |

**ملاحظة:** في البيئة المحلية مع Docker، استخدم:
```
MONGO_URI=mongodb://mongo:27017/san3a
```

### أوامر npm
| الأمر | الوظيفة |
|-------|---------|
| `npm run dev` | تشغيل مع nodemon (تطوير) |
| `npm start` | تشغيل عادي |
| `npm run start:prod` | تشغيل إنتاج (NODE_ENV=production) |
| `npm test` | غير مطبّق (placeholder) |

---

## ✅ نقاط القوة في المشروع

1. خوارزمية مطابقة ذكية بأوزان متعددة (4 عوامل)
2. تتبع سرعة استجابة الصنّاع بـ running average
3. البحث الجغرافي المتقدم بـ `$geoNear`
4. نظام matchingPool لتتبع كل فني شاف الطلب
5. أسعار ديناميكية (رسوم طوارئ للطلبات الفورية)
6. Docker جاهز للإنتاج (Multi-stage, non-root, health checks)
7. بذر بيانات (seed) لتكرار الخدمات

## ⚠️ نقاط الضعف / غير المكتمل

1. **resetPassword غير مكتمل** — لا يُرجع Response ولا يضبط `passwordChangedAt`
2. **لا يوجد Review API** — التقييم موجود في الـ model لكن لا يوجد endpoint لتحديثه
3. **لا يوجد معالج أخطاء عام (Global Error Handler)**
4. **لا يوجد Layer خدمات (Service Layer)** — كل المنطق في الـ Controllers
5. **لا يوجد اختبارات (Tests)**
6. **لا يوجد WebSockets** للتحديثات المباشرة
7. **GET /requests/:id** بدون التحقق من الملكية (IDOR)
8. **POST /services/** بدون حماية (أي شخص ينشئ خدمة)

---

## 🔧 اقتراحات للتطوير

1. إكمال `resetPassword` مع JWT response
2. إضافة API للتقييم بعد الإنهاء
3. إضافة async error handler و global error middleware
4. حماية POST /services بـ `restrictTo('admin')`
5. إضافة التحقق من ملكية الطلب في GET /requests/:id
6. إضافة WebSocket للتحديثات الفورية
7. إضافة Rate Limiting و Helmet للأمان
8. إضافة اختبارات (Jest + Supertest)

---

*تم إعداد هذه الوثيقة من تحليل كود Backend منصة صنعة*
