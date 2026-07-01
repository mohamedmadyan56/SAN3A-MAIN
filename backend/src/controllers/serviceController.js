const Service = require('../models/serviceModel');

// 1. جلب جميع الخدمات للـ Landing Page
exports.getAllServices = async (req, res) => {
  try {
    // بنجيب الخدمات الشغالة بس (isActive: true)
    const services = await Service.find({ isActive: true });

    // الـ Response بالفورمات القياسي
    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ أثناء جلب الخدمات (Something went wrong)',
      error: err.message
    });
  }
};

// 2. إضافة خدمة جديدة (عشان تملى الداتابيز داتا تجريبية)
exports.createService = async (req, res) => {
  try {
    const newService = await Service.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        service: newService
      }
    });
  } catch (err) {
    // لو الاسم مكرر أو البيانات ناقصة هيدخل هنا
    res.status(400).json({
      status: 'fail',
      message: 'فشل إنشاء الخدمة، تأكد من البيانات المدخلة',
      error: err.message
    });
  }
};