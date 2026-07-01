const express = require('express');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword/:token', authController.resetPassword);

router.get('/craftsmen', async (req, res) => {
  try {
    const User = require('../models/userModel');
    const craftsmen = await User.find(
      { role: 'craftsman', isAvailable: true },
      'name rating location avgResponseTimeSeconds'
    );
    res.status(200).json({ status: 'success', data: { craftsmen } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.get('/profile', authController.protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
});

router.patch('/update-profile', authController.protect, async (req, res) => {
  try {
    const User = require('../models/userModel');
    const { name, phone, address, avatar } = req.body;
    const update: any = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (avatar) update.avatar = avatar;
    if (address) update['location.address'] = address;

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
});

router.get('/dashboard/customer', authController.protect, authController.restrictTo('customer', 'admin'), dashboardController.getCustomerDashboard);
router.get('/dashboard/craftsman', authController.protect, authController.restrictTo('craftsman', 'admin'), dashboardController.getCraftsmanDashboard);

router.get('/admin-dashboard',
  authController.protect,
  authController.restrictTo('admin'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'أهلاً بك يا أدمن في لوحة التحكم السرية! 👑',
    });
  }
);

router.get('/craftsman-orders',
  authController.protect,
  authController.restrictTo('craftsman', 'admin'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'هنا الطلبات المتاحة لك كحرفي في منصة صنعة 🛠️',
    });
  }
);

module.exports = router;
