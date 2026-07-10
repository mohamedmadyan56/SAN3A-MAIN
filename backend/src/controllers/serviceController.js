const prisma = require('../utils/prisma');





exports.getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true } });
    res.status(200).json({ status: 'success', results: services.length, data: { services } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'حدث خطأ أثناء جلب الخدمات', error: err.message });
  }
};





exports.createService = async (req, res) => {
  try {
    const newService = await prisma.service.create({ data: req.body });
    res.status(201).json({ status: 'success', data: { service: newService } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: 'فشل إنشاء الخدمة', error: err.message });
  }
};