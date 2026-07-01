const User = require('../models/userModel');
const Request = require('../models/requestModel');

exports.getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [activeRequests, requestHistory, totalSpent, favoriteCraftsmen] = await Promise.all([
      Request.find({ client: userId, status: { $nin: ['COMPLETED', 'CANCELLED', 'REFUNDED'] } })
        .populate('craftsman', 'name rating avatar')
        .populate('service', 'nameAr icon')
        .sort({ createdAt: -1 }),
      Request.find({ client: userId })
        .populate('craftsman', 'name rating')
        .populate('service', 'nameAr')
        .sort({ createdAt: -1 })
        .limit(5),
      Request.aggregate([
        { $match: { client: userId, status: 'COMPLETED', isPaid: true } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
      ]),
      [],
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        activeRequests,
        requestHistory,
        totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
        favorites: favoriteCraftsmen,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getCraftsmanDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      activeJobs,
      completedJobs,
      totalEarnings,
      todayEarnings,
      recentJobs,
      availableRequests,
    ] = await Promise.all([
      Request.find({ craftsman: userId, status: { $in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] } })
        .populate('client', 'name phone')
        .populate('service', 'nameAr')
        .sort({ createdAt: -1 }),
      Request.countDocuments({ craftsman: userId, status: 'COMPLETED' }),
      Request.aggregate([
        { $match: { craftsman: userId, status: 'COMPLETED', isPaid: true } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
      ]),
      Request.aggregate([
        {
          $match: {
            craftsman: userId,
            status: 'COMPLETED',
            isPaid: true,
            completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
      ]),
      Request.find({ craftsman: userId })
        .populate('client', 'name')
        .populate('service', 'nameAr')
        .sort({ createdAt: -1 })
        .limit(10),
      Request.find({ status: 'PENDING_MATCHING' })
        .populate('client', 'name')
        .populate('service', 'nameAr')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
        stats: {
          activeJobs: activeJobs.length,
          completedJobs,
          totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
          todayEarnings: todayEarnings.length > 0 ? todayEarnings[0].total : 0,
          rating: req.user.rating,
          avgResponseTime: req.user.avgResponseTimeSeconds,
        },
        activeJobs,
        recentJobs,
        availableRequests,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
