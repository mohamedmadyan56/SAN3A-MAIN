# توثيق مشروع "صنعة" (San3a)

## نظرة عامة

**صنعة** هي منصة إلكترونية (Web App) بتوسّط بين **العملاء** اللي محتاجين خدمات منزلية (زي سباكة، كهرباء، نظافة، تكييف، إلخ) وبين **الحرفيين** (الفنيين) المحترفين الموثوقين. الفكرة إن العميل يطلب خدمة، والنظام يدور على أقرب فني متاح ليه بناءً على موقعه الجغرافي، ويعرضله درجة المطابقة لكل فني عشان يختار الأحسن.

**المشكلة اللي بيحلها المشروع:**
- صعوبة إيجاد فني موثوق وقريب بسرعة
- عدم وجود نظام تقييم وشفافية في التعامل مع الحرفيين
- العميل بيضيع وقت في البحث والاتصال اليدوي

**المستخدمين المستهدفين:**
- العملاء (أصحاب المنازل والمكاتب) اللي محتاجين خدمة منزلية
- الحرفيين (الفنيين) اللي عايزين شغل مستمر ومنتظم
- مشرف/أدمن المنصة (لإدارة المستخدمين والنزاعات)

---

## التقنيات المستخدمة (Tech Stack)

### Backend
| التقنية | الاستخدام |
|---------|-----------|
| **Node.js** (>= 16) | بيئة تشغيل الجافاسكريبت |
| **Express 5** | إطار عمل لبناء APIs |
| **MongoDB** | قاعدة بيانات NoSQL |
| **Mongoose 9** | ORM للتعامل مع MongoDB |
| **JWT (jsonwebtoken)** | المصادقة والتوثيق |
| **bcryptjs** | تشفير كلمات المرور |
| **Nodemailer** | إرسال الإيميلات (استعادة كلمة المرور) |
| **validator** | التحقق من صحة الإيميل |
| **cors** | السماح بالاتصالات Cross-Origin |
| **dotenv** | إدارة متغيرات البيئة |
| **Docker** | الحزم والتشغيل في حاويات |
| **dumb-init** | إدارة إشارات النظام داخل الحاوية |

### Frontend
| التقنية | الاستخدام |
|---------|-----------|
| **Next.js 16** (App Router) | فريموورك React مع SSR |
| **React 19** | مكتبة واجهات المستخدم |
| **TypeScript** | كتابة كود آمن بالأنواع |
| **Tailwind CSS v4** | تصميم الـ UI بسرعة |
| **Axios** | عمل طلبات HTTP للباك إند |
| **Leaflet + react-leaflet** | خرائط تفاعلية |
| **lucide-react** | أيقونات SVG |
| **react-hot-toast** | إشعارات جميلة للمستخدم |

### أدوات أخرى
| الأداة | الاستخدام |
|--------|-----------|
| **PostCSS** | معالجة CSS (مع Tailwind) |
| **ESLint** | فحص جودة الكود |
| **Nodemon** | إعادة تشغيل السيرفر تلقائياً في التطوير |
| **Docker Compose** | تشغيل الخدمات (MongoDB + Backend) في حاويات |

---

## هيكل المشروع (Project Structure)

```
san3a-project/
├── backend/                          # سيرفر الباك إند (Express API)
│   ├── app.js                        # إعداد Express — الـ entry point الرئيسي للـ app
│   ├── server.js                     # تشغيل السيرفر — الاتصال بـ MongoDB واستماع البورت
│   ├── seed.js                       # سكريبت لملء الداتابيز ببيانات تجريبية
│   ├── Dockerfile                    # بناء صورة Docker (multi-stage)
│   ├── docker-compose.yml            # تشغيل MongoDB + API معاً
│   ├── package.json
│   ├── .env / .env.example           # متغيرات البيئة
│   └── src/
│       ├── models/                   # نماذج MongoDB (Mongoose schemas)
│       │   ├── userModel.js          # نموذج المستخدم (عميل/حرفي/أدمن)
│       │   ├── serviceModel.js       # نموذج الخدمة (نظافة، كهرباء، إلخ)
│       │   └── requestModel.js       # نموذج الطلب (request)
│       ├── controllers/              # منطق الأعمال (Business Logic)
│       │   ├── authController.js     # تسجيل/دخول/حماية/استعادة كلمة المرور
│       │   ├── requestController.js  # إنشاء طلب، بحث عن فنيين، قبول/رفض
│       │   ├── serviceController.js  # جلب وإضافة الخدمات
│       │   ├── adminController.js    # لوحة تحكم الأدمن
│       │   └── dashboardController.js# لوحات تحكم العميل والحرفي
│       ├── routes/                    # تعريف الـ Routes
│       │   ├── userRoutes.js         # /api/v1/users
│       │   ├── serviceRoutes.js      # /api/v1/services
│       │   ├── requestRoutes.js      # /api/v1/requests
│       │   └── adminRoutes.js        # /api/v1/admin
│       └── utils/                    # دوال مساعدة
│           ├── email.js              # إرسال إيميلات (Nodemailer)
│           ├── appError.js           # (فاضي — غير مستخدم)
│           └── catchAsync.js         # (فاضي — غير مستخدم)
│
├── frontend/                          # تطبيق Next.js
│   ├── next.config.ts                # إعدادات Next.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── .env.example
│   ├── .npmrc                        # إعدادات npm (تسريع)
│   ├── public/                       # ملفات ثابتة (صور، أيقونات)
│   ├── src/
│   │   └── app/                      # App Router (Next.js 16)
│   │       ├── layout.tsx            # الـ Root Layout الرئيسي
│   │       ├── globals.css           # стили Tailwind + خط IBM Plex Sans Arabic
│   │       ├── page.tsx              # الصفحة الرئيسية (Landing Page)
│   │       ├── (auth)/               # مجموعة صفحات المصادقة
│   │       │   ├── login/page.tsx    # صفحة تسجيل الدخول
│   │       │   └── register/page.tsx # صفحة إنشاء حساب
│   │       ├── dashboard/            # مجموعة لوحات التحكم
│   │       │   ├── layout.tsx        # حماية الـ Dashboard (authentication check)
│   │       │   ├── admin/page.tsx    # لوحة تحكم الأدمن
│   │       │   ├── craftsman/page.tsx# لوحة تحكم الحرفي
│   │       │   ├── customer/page.tsx # لوحة تحكم العميل
│   │       │   └── settings/page.tsx # إعدادات الحساب
│   │       └── requests/             # مجموعة صفحات الطلبات
│   │           ├── new/page.tsx      # إنشاء طلب جديد
│   │           └── matching/
│   │               └── [requestId]/
│   │                   ├── page.tsx               # الرادار (بحث عن فنيين)
│   │                   └── results/page.tsx       # نتائج المطابقة
│   │
│   └── src/components/               # مكونات React قابلة لإعادة الاستخدام
│       ├── Map.tsx                    # خريطة Leaflet (اللانديج)
│       ├── withAuth.tsx               # HOC لحماية الصفحات
│       └── dashboard/
│           └── Sidebar.tsx            # الشريط الجانبي للـ Dashboard
│
├── matching_page.tsx                  # نسخة قديمة من صفحة المطابقة (غير مستخدمة حالياً)
├── password-reset-notes.md            # ملاحظات عن استعادة كلمة المرور
├── PERFORMANCE_GUIDE.md               # دليل تحسين الأداء
├── PROJECT_DOCUMENTATION.md           # أنت هنا
└── .gitignore
```

### ليه الملفات متوزعة كده؟

- **Models** منفصلة عن **Controllers** عشان يكون فيه فصل واضح بين شكل البيانات ومنطق التعامل معاها (Separation of Concerns).
- **Routes** منفصلة عشان كل مجموعة من الـ endpoints تكون في مكانها، وسهل تعدلها أو تضيف عليها.
- **Frontend** فيه `app/page.tsx` هي الـ Landing page، وكل مجموعة صفحات ليها folder خاص (auth, dashboard, requests) عشان الـ App Router يشتغل صح.
- شجرة المسارات في الفرونت إيند بتطابق بالظبط شجرة URL (زي `/dashboard/admin`, `/requests/new`, `/requests/matching/[id]/results`).

---

## الـ Flow الكامل

### Flow 1: تسجيل حساب جديد (Signup)

```
المستخدم (عميل أو حرفي)
    │
    ▼
[ /register ] — يختار نوع الحساب (عميل / فني)
    │
    ▼
يملأ الفورم (الاسم، الإيميل، التليفون، الباسورد، يوافق على الشروط)
    │
    ▼
axios.post → http://localhost:5000/api/v1/users/signup
    │
    ▼
[ authController.signup ]
    │
    ├── ينشئ مستخدم جديد في MongoDB (User.create)
    ├── يولد JWT Token (signToken)
    └── يرجع الـ Token + بيانات المستخدم
    │
    ▼
الفرونت إيند يخزن الـ Token في localStorage (token, user_token, user_role)
    │
    ▼
يتحول تلقائياً للصفحة الرئيسية (/)
```

### Flow 2: تسجيل الدخول (Login)

```
المستخدم يدخل الإيميل والباسورد
    │
    ▼
axios.post → http://localhost:5000/api/v1/users/login
    │
    ▼
[ authController.login ]
    │
    ├── يتأكد من وجود الإيميل والباسورد
    ├── يبحث عن المستخدم بـ User.findOne({ email }).select('+password')
    ├── يقارن الباسورد بـ bcrypt.compare
    ├── لو صح → يولد JWT Token
    └── يرجع الـ Token + بيانات المستخدم
    │
    ▼
الفرونت يخزن التوكن ويوجه المستخدم حسب الـ Role:
    ├── craftsman → /dashboard/craftsman
    ├── admin → /dashboard/admin
    └── customer → /dashboard/customer
```

### Flow 3: إنشاء طلب خدمة والبحث عن فني

```
العميل (مسجل دخول) يفتح /requests/new
    │
    ▼
الصفحة تجلب الخدمات المتاحة من:
    GET /api/v1/services
    │
    ▼
العميل:
    ├── يختار الخدمة (نظافة، كهرباء، إلخ)
    ├── يكتب العنوان والملاحظات
    └── يختار التوقيت (الآن / جدولة)
    │
    ▼
POST /api/v1/requests  (body: service, address, coordinates, notes, paymentMethod, scheduling)
    │
    ▼
[ requestController.createRequest ]
    ├── يحسب baseFee (120) + emergencyFee (30 لو طلب "الآن")
    ├── ينشئ الطلب في MongoDB (status: PENDING_MATCHING)
    └── يرجع الطلب الجديد
    │
    ▼
الفرونت يوجه لـ  /requests/matching/[requestId]
    │
    ▼
[ صفحة الرادار ]
    ├── كل 4 ثواني بتعمل: GET /:requestId/nearby-craftsmen
    │   └── [ requestController.findNearbyCraftsmen ]
    │       ├── يستخدم $geoNear (MongoDB) ليجيب الفنيين الـ Available
    │       ├── في نطاق 5 كم (افتراضي) أو 10 كم (لو وسّع المستخدم)
    │       ├── يسجل كل فني ظهر في matchingPool (لو مش مسجل قبل كده)
    │       └── يرجع قائمة الفنيين مع المسافة
    │
    ├── بعد 15 ثانية (أو يدويًا) → يتوجه لـ /requests/matching/[id]/results
    │
    ▼
[ صفحة نتائج المطابقة ]
    GET /:requestId/match-results
    │
    ▼
[ requestController.getMatchResults ]
    ├── يستخدم نفس $geoNear عشان يجيب الفنيين
    ├── يحسب درجة المطابقة لكل فني باستخدام معادلة مركبة:
    │   ├── المسافة (40%)
    │   ├── التقييم (30%)
    │   ├── سرعة الاستجابة (20%)
    │   └── التعاملات السابقة مع العميل (10%)
    ├── يرتب النتائج تنازلياً حسب النسبة
    └── يرجع المatches مع تفاصيل الـ breakdown
```

### Flow 4: الحرفي يقبل/يرفض طلب

```
الحرفي يفتح الـ Dashboard بتاعه (/dashboard/craftsman)
    │
    ▼
بيشوف الطلبات المتاحة (PENDING_MATCHING) من getCraftsmanDashboard
    │
    ▼
يضغط "قبول" → POST /:requestId/accept
    │
    ▼
[ requestController.acceptRequest ]
    ├── يتأكد أن المستخدم فني (role === 'craftsman')
    ├── يتأكد أن الطلب لسه PENDING_MATCHING (محدش أخده قبله)
    ├── يربط الـ craftsman._id بالطلب
    ├── يغير الحالة لـ ACCEPTED
    ├── يسجل وقت الاستجابة في matchingPool
    ├── يحول الفني لـ isAvailable = false (مشغول)
    └── يرجع نجاح
    │
    ▼
الحرفي يضغط "رفض" → POST /:requestId/reject
    │
    ▼
[ requestController.rejectRequest ]
    ├── يتأكد أن الطلب عُرض على الفني فعلاً (في matchingPool)
    ├── يسجل الرفض + وقت الاستجابة
    └── (الطلب لسه متاح لفني تاني)
```

### Flow 5: الحرفي يحدّث حالة الطلب حتى الإكمال

```
الحرفي بيكمل الخطوات:
    ACCEPTED → يضغط "وصلت للموقع" → PATCH status = 'ARRIVED'
    ARRIVED → يضغط "بدء العمل" → PATCH status = 'IN_PROGRESS'
    IN_PROGRESS → يضغط "اكتمل العمل" → PATCH status + POST complete
    │
    ▼
[ requestController.updateRequestStatus + completeRequest ]
    ├── يسجل كل تغيير في statusHistory
    ├── completeRequest تعدل حالة الفني لـ isAvailable = true
    └── الطلب خلص بنجاح
```

### Flow 6: لوحة تحكم الأدمن

```
الأدمن يفتح /dashboard/admin ويشوف:
    ├── Overview: إجمالي المستخدمين، العمال النشطين، إيرادات اليوم، النزاعات
    ├── Tab المستخدمين: بحث، تصفية، تفعيل/تعطيل، حذف
    ├── Tab النزاعات: يعرض الطلبات DISPUTED، ويقدر يحلها (complete/refund)
    └── Tab الطلبات: يعرض كل الطلبات مع التصفية

كل البيانات جاية من:
    GET /api/v1/admin/dashboard
    GET /api/v1/admin/users?search=&role=&status=&page=
    GET /api/v1/admin/disputes
    GET /api/v1/admin/requests?status=&page=
    PATCH /api/v1/admin/disputes/:id/resolve
```

---

## الـ APIs / Endpoints

### المسار الرئيسي: `http://localhost:5000/api/v1`

#### المصادقة (Auth) — `/users`

| الطريقة | المسار | الوصف | المدخلات | المخرجات |
|---------|--------|-------|---------|---------|
| POST | `/users/signup` | إنشاء حساب جديد | `{ name, email, phone, password, role }` | `{ status, token, data: { user } }` |
| POST | `/users/login` | تسجيل الدخول | `{ email, password }` | `{ status, token, data: { user } }` |
| POST | `/users/forgotPassword` | إرسال إيميل استعادة كلمة المرور | `{ email }` | `{ status, message }` |
| POST | `/users/resetPassword/:token` | إعادة تعيين كلمة المرور | `{ password, passwordConfrim }` (في البودي) + التوكن في الـ URL | `{ status }` |
| GET | `/users/profile` | جلب بيانات المستخدم الحالي | (محمي بـ protect) | `{ status, data: { user } }` |
| GET | `/users/dashboard/customer` | لوحة تحكم العميل | (محمي، role: customer/admin) | `{ activeRequests, requestHistory, totalSpent, favorites }` |
| GET | `/users/dashboard/craftsman` | لوحة تحكم الحرفي | (محمي، role: craftsman/admin) | `{ user, stats, activeJobs, recentJobs, availableRequests }` |

#### الخدمات — `/services`

| الطريقة | المسار | الوصف | المدخلات | المخرجات |
|---------|--------|-------|---------|---------|
| GET | `/services` | جلب الخدمات النشطة | — | `{ status, results, data: { services } }` |
| POST | `/services` | إضافة خدمة جديدة | `{ nameAr, nameEn, slug, icon }` | `{ status, data: { service } }` |

#### الطلبات — `/requests` (كلها محمية بـ protect)

| الطريقة | المسار | الوصف | المدخلات | المخرجات |
|---------|--------|-------|---------|---------|
| POST | `/requests` | إنشاء طلب جديد | `{ service, address, coordinates, clientNotes, paymentMethod, scheduling }` | `{ status, data: { request } }` |
| GET | `/requests/:id` | جلب طلب بالـ ID | — | `{ status, data: { request } }` |
| GET | `/requests/:requestId/nearby-craftsmen` | البحث عن فنيين قريبين | Query: `?radius=5000` | `{ status, results, data: { craftsmen } }` |
| GET | `/requests/:requestId/match-results` | نتائج المطابقة (مع الدرجات) | Query: `?radius=10000` | `{ status, results, data: { matches } }` (كل match فيها `matchPercentage` و `breakdown`) |
| POST | `/requests/:requestId/accept` | قبول الطلب (الحرفي) | — | `{ status, message, data: { request } }` |
| POST | `/requests/:requestId/reject` | رفض الطلب (الحرفي) | — | `{ status, message }` |
| PATCH | `/requests/:requestId/status` | تحديث حالة الطلب (الحرفي) | `{ status }` | `{ status, message, data: { request } }` |
| PATCH | `/requests/:requestId/complete` | إنهاء الطلب + تحرير الحرفي | — | `{ status, message, data: { request } }` |

#### الأدمن — `/admin` (محمية بـ protect + restrictTo('admin'))

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/admin/dashboard` | إحصائيات لوحة التحكم (مستخدمين، إيرادات، نزاعات، طلبات حسب الحالة) |
| GET | `/admin/users` | قائمة المستخدمين مع بحث وتصفية وباجينيشن |
| GET | `/admin/users/:id` | مستخدم معين + تاريخ الطلبات بتاعه |
| PATCH | `/admin/users/:id` | تعديل بيانات المستخدم |
| DELETE | `/admin/users/:id` | تعطيل المستخدم (soft delete) |
| GET | `/admin/requests` | كل الطلبات مع باجينيشن |
| GET | `/admin/disputes` | النزاعات المفتوحة |
| PATCH | `/admin/disputes/:id/resolve` | حل نزاع (complete/refund) |

---

## قاعدة البيانات (Database Schema)

### 1. User Model — `users` collection

```javascript
{
  name: String,              // مطلوب
  email: String,             // مطلوب، unique، lowercase
  phone: String,             // مطلوب، unique
  password: String,          // مطلوب، minlength: 8، select: false
  role: String,              // enum: ['customer', 'craftsman', 'admin']
  avatar: String,            // default: 'default.png'
  location: {
    type: String,            // default: 'Point', enum: ['Point']
    coordinates: [Number],   // [longitude, latitude]
    address: String
  },
  isAvailable: Boolean,      // default: true (للحرفيين)
  rating: Number,            // 1-5, default: 4.5
  avgResponseTimeSeconds: Number,  // null للفنيين الجداد
  responseCount: Number,     // default: 0
  passwordChangedAt: Date,
  isActive: Boolean,         // default: true, select: false
  passwordResetToken: String,
  passwordResetExpires: Date
}
```
- **Index:** `{ location: '2dsphere' }` (عشان الـ geo queries)
- **Methods:** `correctPassword`, `changePasswordAfter`, `createPasswordResetToken`, `recordResponseTime`

### 2. Service Model — `services` collection

```javascript
{
  nameAr: String,   // مطلوب، unique (مثلاً "نظافة")
  nameEn: String,   // مطلوب، unique (مثلاً "Cleaning")
  slug: String,     // مطلوب، unique (مثلاً "cleaning")
  icon: String,     // مطلوب (مثلاً "cleaning-icon")
  isActive: Boolean // default: true
}
```

### 3. Request Model — `requests` collection

```javascript
{
  client: ObjectId,           // ref: 'User', مطلوب
  craftsman: ObjectId,        // ref: 'User', default: null
  service: ObjectId,          // ref: 'Service', مطلوب
  status: String,             // PENDING_MATCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED (أو CANCELLED / DISPUTED / REFUNDED)
  statusHistory: [{           // سجل تغييرات الحالة
    status: String,
    changeAt: Date,
    note: String
  }],
  matchingPool: [{            // الفنيين اللي اتسألوا عن الطلب
    craftsman: ObjectId,      // ref: 'User'
    offeredAt: Date,
    respondedAt: Date,
    response: String,         // PENDING / ACCEPTED / REJECTED / EXPIRED
  }],
  location: {
    address: String,          // مطلوب
    coordinates: [Number]     // [lng, lat]، مطلوب
  },
  scheduledAt: Date,
  clientNotes: String,
  pricing: {
    baseFee: Number,          // 120 (ثابت)
    emergencyFee: Number,     // 30 لو طلب "الآن"
    totalAmount: Number
  },
  paymentMethod: String,      // CASH / CARD / VODAFONE_CASH
  isPaid: Boolean,
  arriveAt: Date,
  startedAt: Date,
  completedAt: Date
}
```
- **Index:** `{ "location.coordinates": "2dsphere" }`

### العلاقات بين الجداول

```
User (client) ─────┐
                   ├──→ Request ───→ Service
User (craftsman) ──┘
```

أي إن الـ Request بيربط بين:
- عميل (Client) = User واحد
- حرفي (Craftsman) = User واحد (أو null لو لسه متعيينش)
- خدمة (Service) = Service واحدة

---

## نظام المطابقة (Matching Algorithm)

ده أكثر جزء معقد في المشروع، موجود في `requestController.js` (دالة `getMatchResults`).

الفكرة: النظام بيجيب الفنيين القريبين من موقع الطلب، ويدرجهم حسب "درجة المطابقة" اللي بتتكون من 4 عوامل:

### الأوزان (مجموعهم = 1)
```
المسافة — 40% (أقرب فني = أعلى نقاط)
التقييم — 30% (أعلى تقييم = أعلى نقاط)
سرعة الاستجابة — 20% (أسرع رد على الطلبات = أعلى نقاط)
التعاملات السابقة — 10% (أكتر شغل مع نفس العميل = أعلى نقاط)
```

### طريقة الحساب
كل عامل بيتحول لنسبة من 0 لـ 100 باستخدام دالة `normalize`:
```javascript
function normalize(value, min, max, lowerIsBetter = false) {
  if (max === min) return 1;
  let ratio = (value - min) / (max - min);
  ratio = Math.min(Math.max(ratio, 0), 1); // تثبيت النتيجة بين 0 و 1
  return lowerIsBetter ? 1 - ratio : ratio;
}
```
- **المسافة:** `lowerIsBetter = true` (كلما قلّت المسافة، زادت النقاط)
- **التقييم:** `lowerIsBetter = false`
- **سرعة الاستجابة:** `lowerIsBetter = true`
- **التاريخ:** `lowerIsBetter = false` (كلما كثفت التعاملات السابقة، زادت النقاط)

### تتبع سرعة الاستجابة (`recordResponseTime`)
الفكرة إننا مش بنحتفظ بكل الأوقات (مصفوفة لا نهائية)، بنستخدم **Running Average**:
```javascript
userSchema.methods.recordResponseTime = async function (responseSeconds) {
  const newCount = this.responseCount + 1;
  const newAvg = (prevAvg * prevCount + responseSeconds) / newCount;
  this.avgResponseTimeSeconds = Math.round(newAvg);
  this.responseCount = newCount;
  await this.save({ validateBeforeSave: false });
};
```
يعني كل مرة الفني يرد على طلب (قبول أو رفض)، بنحسب متوسط جديد بدون ما نخزن كل الردود القديمة.

### الـ MatchingPool
لما الطلب يتعمل، أي فني يظهر في نتائج البحث الجغرافي بيتضاف لـ `matchingPool` في الطلب ده. كده لما الفني يرد (يقبل أو يرفض)، بنقدر نحسب `respondedAt - offeredAt` عشان نعرف سرعة استجابته الفعلية.

---

## طريقة حساب التكلفة (Pricing)

في `requestController.createRequest`:
```javascript
const baseFee = 120;                                   // 120 جنيه
const emergencyFee = !scheduledAt || new Date(scheduledAt) <= new Date() ? 30 : 0;
const totalAmount = baseFee + emergencyFee;
```
- لو العميل اختار "الآن" أو معاد قديم، 30 جنيه رسوم طوارئ
- إجمالي = 120 + (30 أو 0)

---

## متغيرات البيئة (Environment Variables)

### Backend `.env`

| المتغير | explanation | مثال |
|---------|-------------|------|
| `PORT` | البورت اللي يشتغل عليه السيرفر | `5000` |
| `MONGO_URI` | رابط قاعدة بيانات MongoDB | `mongodb://localhost:27017/san3a` أو رابط Atlas |
| `NODE_ENV` | بيئة التشغيل | `development` / `production` |
| `FRONTEND_URL` | رابط الفرونت إيند (للـ CORS) | `http://localhost:3000` |
| `JWT_SECRET` | مفتاح توقيع JWT (طوّر وقوي في الإنتاج) | نص عشوائي طويل |
| `BCRYPT_ROUNDS` | (محجوز لكن مش مستخدم — الهاردكود 12 في الموديل) | `10` |
| `EMAIL_HOST` | SMTP سيرفر الإيميلات | `sandbox.smtp.mailtrap.io` |
| `EMAIL_PORT` | SMTP بورت | `587` |
| `EMAIL_USERNAME` | اسم مستخدم SMTP | — |
| `EMAIL_PASSWORD` | باسورد SMTP | — |

### Frontend `.env`

| المتغير | الوصف | مثال |
|---------|-------|------|
| `NEXT_PUBLIC_API_URL` | رابط API الباك إند | `http://localhost:5000` |
| `NEXT_ENV` | بيئة التشغيل | `development` |

---

## طريقة التشغيل (Setup & Run)

### التشغيل المحلي (Local) — بدون Docker

#### 1. تشغيل MongoDB
```bash
#要么 يكون عندك MongoDB مثبت محلياً
mongod
# أو تستخدم Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```

#### 2. تشغيل الباك إند
```bash
cd backend
cp .env.example .env   # عدّل القيم لو عايز
npm install
npm run dev            # مع nodemon (auto reload)
# أو
npm start              # بدون nodemon
```

#### 3. تشغيل الـ Seed (بيانات تجريبية)
```bash
cd backend
node seed.js
```
ده هيضيف:
- 6 خدمات
- 8 مستخدمين (أدمن، 4 حرفيين، 3 عملاء)
- 6 طلبات بحالات مختلفة

#### 4. تشغيل الفرونت إيند
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

#### 5. فتح المتصفح
```
http://localhost:3000
```

### حسابات الديمو (من الـ Seed)
| الدور | الإيميل | الباسورد |
|-------|---------|----------|
| أدمن | `admin@san3a.com` | `12345678` |
| حرفي | `ahmed@san3a.com` | `12345678` |
| حرفي | `omar@san3a.com` | `12345678` |
| حرفي | `mohamed@san3a.com` | `12345678` |
| حرفي | `tarek@san3a.com` | `12345678` |
| عميل | `sara@san3a.com` | `12345678` |
| عميل | `layla@san3a.com` | `12345678` |
| عميل | `mona@san3a.com` | `12345678` |

### التشغيل بـ Docker Compose
```bash
cd backend
docker-compose up -d
```

---

## نقاط مهمة / تعقيدات (Gotchas)

### 1. معادلة المطابقة (Matching Algorithm)
أكثر جزء معقد في المشروع. النظام مش بس بيدور على أقرب فني، لكنه بيدرج حسب 4 عوامل بأوزان مختلفة. في `requestController.js:82-87`:
```javascript
const MATCH_WEIGHTS = {
  distance: 0.4,
  rating: 0.3,
  responseTime: 0.2,
  history: 0.1,
};
```
لو عايز تغير الأوزان، غيّر القيم دي ومجموعهم لازم يفضل = 1.

### 2. الـ Geo Queries
الموقع مخزن كـ `[longitude, latitude]` مش `[latitude, longitude]`. ده مهم جداً عشان `$geoNear` في MongoDB تشتغل صح. في `requestModel.js:59`:
```javascript
coordinates: {
  type: [Number], // [longitude, latitude] مهم الترتيب ده للـ GeoJSON
}
```
ولو عكستهم، $geoNear مش هتشتغل.

### 3. سرعة الاستجابة (Running Average)
بدل ما نخزن مصفوفة كل أوقات الاستجابة (اللي هتطول مع الوقت)، بنستخدم `recordResponseTime` في `userModel.js:157` اللي بتحدّث متوسط متحرك. الموديل عنده `avgResponseTimeSeconds` و `responseCount`، وكل مرة الفني يرد، بيتحسب متوسط جديد.

### 4. الـ matchingPool
كل فني يظهر في نتائج البحث الجغرافي بيتضاف لـ `matchingPool` في الطلب. مهم ده عشان المرة اللي يجي يرد عليها (قبول/رفض) نقدر نحسب فرق الوقت من `offeredAt` لـ `respondedAt` ونحدث سرعة استجابته. في `requestController.js:45-55`:
```javascript
const alreadyTracked = new Set(
  request.matchingPool.map((entry) => entry.craftsman.toString())
);
craftsmen.forEach((c) => {
  if (!alreadyTracked.has(c._id.toString())) {
    request.matchingPool.push({ craftsman: c._id });
  }
});
```

### 5. مشكلة "Double Booking"
في `acceptRequest`، بنتأكد أن `currentRequest.status` لسه `PENDING_MATCHING` عشان منسمحش لفنيين يقبلوا نفس الطلب. لو فني آخر قبله الأول، الطلب بيتغير لـ `ACCEPTED` والفني التاني هيجيله error.

### 6. تحرير الحرفي بعد الإكمال
في `completeRequest` (`requestController.js:499`):
```javascript
await User.findByIdAndUpdate(req.user._id, { isAvailable: true });
```
بعد ما الحرفي يخلص الشغل، بيتحول لـ "متاح" تلقائياً عشان يظهر في نتائج البحث تاني.

### 7. حساب رسوم الطوارئ
في `createRequest`:
```javascript
const emergencyFee = !scheduledAt || new Date(scheduledAt) <= new Date() ? 30 : 0;
```
لو العميل مختار "الآن" أو معاد في الماضي، 30 جنيه إضافية. المشكلة إن السطر ده بيحط رسوم طوارئ حتى لو المستخدم اختار "الآن" (اللي هو `scheduledAt = Date.now()`).

### 8. CORS
في `app.js:10-15`:
```javascript
origin: process.env.FRONTEND_URL || 'http://localhost:3000'
```
لو شغال على Domain تاني (زي `https://san3a.com`)، لازم تعدل `FRONTEND_URL`.

---

## ملاحظات / أسئلة

### 1. ملفين فاضيين
`backend/src/utils/appError.js` و `backend/src/utils/catchAsync.js` — ملفين فاضيين، مش مستخدمين في أي حتة. اتضافوا كـ placeholder.

### 2. خاصية `passwordConfirm` مش موجودة
في `authController.js:217`:
```javascript
user.passwordConfrim = req.body.passwordConfrim;  // ← في الخطأ الإملائي
```
لكن حقل `passwordConfirm` مش موجود في `userModel.js`. لو المستخدم بعت `passwordConfirm` في الـ request، مش هيتخزن في الداتابيز، والسطر أصلاً مش بيحفظ حاجة في الداتابيز، هو بس بيعمل assignment للـ object. الفكرة إن MongoDB بتتجاهل الحقول اللي مش موجودة في الـ schema.

### 3. `BCRYPT_ROUNDS` مش مستخدم
في `.env.example` فيه `BCRYPT_ROUNDS=10`، لكن في `userModel.js:109`:
```javascript
this.password = await bcrypt.hash(this.password, 12); // ← 12 hardcoded
```

### 4. مشكلة في إعدادات المستخدم (Settings)
في `frontend/src/app/dashboard/settings/page.tsx:43`:
```typescript
await axios.patch(`http://localhost:5000/api/v1/admin/users/${localStorage.getItem('user_id')}`, ...)
```
الصفحة بتستخدم API الأدمن (`/admin/users/:id`) عشان تعدّل بيانات المستخدم العادي. ده مش صح — المفروض يكون فيه endpoint للمستخدم العادي يعدل بياناته بنفسه. بالإضافة إن `user_id` مش متخزن في localStorage أصلاً.

### 5. مشكلة أمنية: التوكن في localStorage
التوكن متخزّن في `localStorage` (مش `httpOnly` cookies)، ده خلاه معرّض لـ XSS attacks. الحل الأحسن هو استخدام `httpOnly` cookies للتوكنات.

### 6. `matching_page.tsx` في الرُوت (جذر المشروع)
فيه نسخة قديمة من صفحة المطابقة (`matching_page.tsx`) في مجلد المشروع الرئيسي، مش في الفرونت إيند. دي مش مستخدمة حالياً — النسخة المستخدمة موجودة في `frontend/src/app/requests/matching/[requestId]/page.tsx`.

### 7. رسوم الطوارئ (Emergency Fee) — منطق غريب
لما `scheduledAt` يكون `null` أو `undefined`، بتحط `emergencyFee = 30` (لإن `new Date(null) <= new Date()` بترجع `true`). الفكرة صحيحة، بس لو `scheduledAt` = قيمة وهمية قديمة برضو هتضيف رسوم طوارئ.

### 8. الـ `coordinates` في فورم إنشاء الطلب hardcoded
في `frontend/src/app/requests/new/page.tsx:145`:
```typescript
coordinates: [31.2358, 30.0445], // إحداثيات ثابتة للقاهرة!
```
المفروض الإحداثيات تتاخد من الخريطة أو GPS بتاع المستخدم، لكن حالياً هي ثابتة (القاهرة).

### 9. التوجيه في `userRoutes.js`
فيه مسارين:
- `/admin-dashboard` — مجرد رسالة ترحيب للأدمن (مش لوحة تحكم حقيقية)
- `/craftsman-orders` — مجرد رسالة ترحيب للحرفي (مش بيجيب طلبات حقيقية)
وده محتاج يتشال أو يتظبط.

---

## ملخص الـ Flow بالصور (نصي)

```
                      ┌─────────────────┐
                      │   Landing Page   │
                      │    (/page.tsx)   │
                      └────────┬────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌──────────────┐    ┌──────────────────┐
            │   تسجيل دخول  │    │   إنشاء حساب جديد │
            │  /login       │    │  /register       │
            └──────┬───────┘    └────────┬─────────┘
                   │                     │
                   └──────────┬──────────┘
                              ▼
                    ┌──────────────────┐
                    │  JWT Authenticated │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │  عميل       │ │  حرفي      │ │  أدمن       │
      │ /customer   │ │ /craftsman │ │ /admin      │
      └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
             │              │              │
             ▼              │              │
    ┌────────────────┐      │              │
    │ طلب خدمة جديد  │      │              │
    │ /requests/new  │      │              │
    └───────┬────────┘      │              │
            ▼               │              │
    ┌────────────────┐      │              │
    │  الرادار (بحث)  │      │              │
    │ /matching/[id]  │      │              │
    └───────┬────────┘      │              │
            ▼               │              │
    ┌────────────────┐      │              │
    │ نتائج المطابقة  │      │              │
    │ /results        │◄─────┘              │
    └───────────────┘                       │
                                            ▼
                                   ┌────────────────┐
                                   │ إدارة المستخدمين│
                                   │ النزاعات، الطلبات│
                                   └────────────────┘
```
