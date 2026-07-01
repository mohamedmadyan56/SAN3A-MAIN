const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'الطلب يجب أن ينتمي لعميل'] 
  },
  craftsman: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null // بيبدأ null لحد ما فني يوافق على الأوردر
  },
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: [true, 'الطلب يجب أن يحدد نوع الخدمة الأساسية'] 
  },
  
  status: {
    type: String,
    enum: ['PENDING_MATCHING', 'SELECTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED'],
    default: 'PENDING_MATCHING' // الحالة المبدئية: جاري البحث عن فني
  },
  statusHistory:[{
    status:{type:String},
    changedAt:{type:Date,default:Date.now},
    note:{type:String}
  }],

  /*
   * matchingPool: قايمة الفنيين اللي ظهر الطلب عندهم في شاشة الرادار/المطابقة
   * بنسجل offeredAt (وقت العرض) و respondedAt (وقت الرد، لو رد) و response
   * عشان نقدر نحسب سرعة استجابة كل فني بدقة، ونعرف هل الفني شاف الطلب ورفضه
   * أو لسه ماردّ.
   */
  matchingPool: [{
    craftsman: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    offeredAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    response: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING'
    }
  }],

  arriveAt:{type:Date},
    startedAt: { type: Date },
  completedAt: { type: Date },

  
  location: {
    address: { 
      type: String, 
      required: [true, 'يجب إدخال العنوان النصي بالتفصيل'] 
    },
    coordinates: {
      type: [Number], // [longitude, latitude] مهم الترتيب ده للـ GeoJSON في المونجو
      required: [true, 'يجب تحديد الموقع الجغرافي على الخريطة']
    }
  },
  
  scheduledAt: { 
    type: Date, 
    default: Date.now // لو العميل اختار "الآن"، بينزل بوقت اللحظة الحالية
  }, 
  
  clientNotes: { 
    type: String // ملاحظات العميل (مثل: تسريب مياه تحت الحوض)
  },
  
  pricing: {
    baseFee: { type: Number, required: true, default: 0 },      // السعر الأساسي للمعاينة أو الخدمة
    emergencyFee: { type: Number, default: 0 },   // رسوم الطوارئ (مثلاً 30 جنيه لو الطلب "الآن")
    totalAmount: { type: Number, required: true, default: 0 }    // الإجمالي اللي بيظهر للفني
  },
  
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'VODAFONE_CASH'],
    default: 'CASH'
  },
  
  isPaid: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

// عمل Index جغرافي للإحداثيات عشان نقدر نعمل Queries ونطلع أقرب فنيين للطلب بسهولة
requestSchema.index({ "location.coordinates": "2dsphere" });
module.exports = mongoose.model('Request', requestSchema);
