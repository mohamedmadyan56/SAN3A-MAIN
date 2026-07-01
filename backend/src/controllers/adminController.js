const User = require('../models/userModel');
const Request = require('../models/requestModel');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeWorkers,
      revenueResult,
      openDisputes,
      requestsByStatus,
      recentRequests,
      serviceDistribution,
      weeklyRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'craftsman', isAvailable: true }),
      Request.aggregate([
        { $match: { status: 'COMPLETED', isPaid: true } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
      ]),
      Request.countDocuments({ status: 'DISPUTED' }),
      Request.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Request.find()
        .populate('client', 'name')
        .populate('craftsman', 'name')
        .populate('service', 'nameAr')
        .sort({ createdAt: -1 })
        .limit(5),
      Request.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$service.nameAr', count: 1 } },
      ]),
      Request.aggregate([
        { $match: { status: 'COMPLETED', isPaid: true } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$pricing.totalAmount' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 7 },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const statusMap = {};
    requestsByStatus.forEach((r) => { statusMap[r._id] = r.count; });

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          activeWorkers,
          todayRevenue: totalRevenue,
          openDisputes: openDisputes || 0,
          totalRequests: Object.values(statusMap).reduce((a, b) => a + b, 0),
        },
        requestsByStatus: statusMap,
        recentRequests,
        serviceDistribution,
        weeklyRevenue,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (role && role !== 'all') filter.role = role;
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('+isActive').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'المستخدم غير موجود' });
    }
    const requestHistory = await Request.find({
      $or: [{ client: user._id }, { craftsman: user._id }],
    })
      .populate('service', 'nameAr')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      status: 'success',
      data: { user, requestHistory },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isActive, isAvailable } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (role) updates.role = role;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;
    if (typeof isAvailable !== 'undefined') updates.isAvailable = isAvailable;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'المستخدم غير موجود' });
    }

    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'المستخدم غير موجود' });
    }
    res.status(200).json({ status: 'success', message: 'تم تعطيل المستخدم بنجاح' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { status: filterStatus, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (filterStatus && filterStatus !== 'all') filter.status = filterStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('client', 'name phone email')
        .populate('craftsman', 'name phone')
        .populate('service', 'nameAr nameEn')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Request.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getDisputes = async (req, res) => {
  try {
    const disputes = await Request.find({ status: 'DISPUTED' })
      .populate('client', 'name phone email')
      .populate('craftsman', 'name phone')
      .populate('service', 'nameAr')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: disputes.length,
      data: { disputes },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, note } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    request.status = resolution === 'refund' ? 'REFUNDED' : 'COMPLETED';
    request.statusHistory.push({
      status: resolution === 'refund' ? 'REFUNDED' : 'COMPLETED',
      note: `تم حل النزاع: ${note || ''}`,
    });
    await request.save();

    res.status(200).json({ status: 'success', data: { request } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
