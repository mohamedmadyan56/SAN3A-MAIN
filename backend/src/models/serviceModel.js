const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  nameAr: { 
    type: String, 
    required: [true, 'يجب أن يكون للخدمة اسم بالعربية'], 
    unique: true,
    trim: true
  },
  nameEn: { 
    type: String, 
    required: [true, 'A service must have an English name'], 
    unique: true,
    trim: true
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  icon: { 
    type: String, 
    required: [true, 'يجب تحديد أيقونة للخدمة'] 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Service', serviceSchema);