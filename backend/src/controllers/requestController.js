const Request = require('../models/requestModel');
const User = require('../models/userModel');

exports.findNearbyCraftsmen = async (req, res) => {
    try {
        const request = await Request.findById(req.params.requestId);

        if (!request) {
            return res.status(404).json({
                status: 'fail',
                message: 'الطلب غير موجود',
            });
        }

        const [longitude, latitude] = request.location.coordinates;

        // بمساحة بحث قابلة للتوسيع: لو الفرونت بعت radius (مثلاً بعد توسيع النطاق
        // إلى 10كم)، نستخدمها، وإلا الافتراضي 5كم
        const maxDistance = Number(req.query.radius) || 5000;

        const craftsmen = await User.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [longitude, latitude] },
                    distanceField: 'distance',
                    maxDistance,
                    query: { role: 'craftsman', isAvailable: true },
                    spherical: true,
                },
            },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    avatar: 1,
                    rating: 1,
                    distance: 1,
                },
            },
            { $sort: { distance: 1 } },
        ]);

        // تسجيل كل فني ظاهر دلوقتي في matchingPool (لو لسه مش مسجل من قبل)
        // عشان نقدر نحسب سرعة استجابته لما يرد على الطلب
        const alreadyTracked = new Set(
            request.matchingPool.map((entry) => entry.craftsman.toString())
        );

        let poolUpdated = false;
        craftsmen.forEach((c) => {
            if (!alreadyTracked.has(c._id.toString())) {
                request.matchingPool.push({ craftsman: c._id });
                poolUpdated = true;
            }
        });

        if (poolUpdated) {
            await request.save();
        }

        res.status(200).json({
            status: 'success',
            results: craftsmen.length,
            data: {
                craftsmen,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: 'تعذر البحث عن فنيين قريبين',
            error: err.message,
        });
    }
};

/*
 * أوزان معادلة التطابق (لازم مجموعهم = 1)
 * نفس الأوزان المعروضة في تصميم شاشة "درجة المطابقة": 40% مسافة، 30% تقييم،
 * 20% سرعة استجابة، 10% تاريخ تعامل سابق مع نفس العميل
 */
const MATCH_WEIGHTS = {
  distance: 0.4,
  rating: 0.3,
  responseTime: 0.2,
  history: 0.1,
};

const MAX_SEARCH_DISTANCE_METERS = 10000; // 10 كم: أبعد مسافة نعتبرها في الحساب
const RATING_MIN = 1;
const RATING_MAX = 5;
// فني بدون سجل استجابة كافي بياخد قيمة افتراضية متوسطة (لا تظلمه ولا تفضّله)
const DEFAULT_RESPONSE_SECONDS = 120; // دقيقتين
// أبطأ استجابة معقولة نقيس عليها (بعد كذا، النقاط تقرب من صفر بس متوصلش له)
const WORST_RESPONSE_SECONDS = 600; // 10 دقايق

// تطبيع أي قيمة لنطاق 0-1، مع عكس الاتجاه لو "أقل = أفضل" (مسافة، وقت استجابة)
function normalize(value, min, max, lowerIsBetter = false) {
  if (max === min) return 1;
  let ratio = (value - min) / (max - min);
  ratio = Math.min(Math.max(ratio, 0), 1); // تثبيت النتيجة بين 0 و1
  return lowerIsBetter ? 1 - ratio : ratio;
}

exports.getMatchResults = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentRequest = await Request.findById(requestId);

    if (!currentRequest) {
      return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    const [longitude, latitude] = currentRequest.location.coordinates;
    const maxDistance = Number(req.query.radius) || MAX_SEARCH_DISTANCE_METERS;

    const craftsmen = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance,
          query: { role: 'craftsman', isAvailable: true },
          spherical: true,
        },
      },
      {
        $project: {
          name: 1,
          phone: 1,
          avatar: 1,
          rating: 1,
          distance: 1,
          avgResponseTimeSeconds: 1,
        },
      },
    ]);

    if (craftsmen.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: { matches: [] },
      });
    }

    // عدد الطلبات المكتملة سابقاً بين هذا العميل وكل فني، في استعلام واحد
    const craftsmanIds = craftsmen.map((c) => c._id);
    const historyAgg = await Request.aggregate([
      {
        $match: {
          client: currentRequest.client,
          craftsman: { $in: craftsmanIds },
          status: 'COMPLETED',
        },
      },
      {
        $group: { _id: '$craftsman', completedCount: { $sum: 1 } },
      },
    ]);

    const historyMap = new Map(
      historyAgg.map((h) => [h._id.toString(), h.completedCount])
    );

    const maxHistoryCount = Math.max(
      1,
      ...historyAgg.map((h) => h.completedCount)
    );

    const matches = craftsmen.map((c) => {
      // 1) المسافة: الأقرب = الأعلى نقاطاً
      const distanceScore = normalize(c.distance, 0, maxDistance, true);

      // 2) التقييم: نسبته داخل نطاق 1-5
      const ratingValue = c.rating ?? RATING_MIN;
      const ratingScore = normalize(ratingValue, RATING_MIN, RATING_MAX, false);

      // 3) سرعة الاستجابة: الأسرع = الأعلى نقاطاً
      // فني بدون سجل كافي ياخد القيمة الافتراضية المتوسطة
      const responseSeconds = c.avgResponseTimeSeconds ?? DEFAULT_RESPONSE_SECONDS;
      const responseScore = normalize(
        responseSeconds,
        0,
        WORST_RESPONSE_SECONDS,
        true
      );

      // 4) التاريخ السابق: عدد مرات التعامل مع هذا العميل بالذات، نسبته لأعلى قيمة موجودة
      const completedWithClient = historyMap.get(c._id.toString()) || 0;
      const historyScore =
        completedWithClient === 0
          ? 0
          : normalize(completedWithClient, 0, maxHistoryCount, false);

      const matchPercentage = Math.round(
        (distanceScore * MATCH_WEIGHTS.distance +
          ratingScore * MATCH_WEIGHTS.rating +
          responseScore * MATCH_WEIGHTS.responseTime +
          historyScore * MATCH_WEIGHTS.history) *
          100
      );

      return {
        _id: c._id,
        name: c.name,
        phone: c.phone,
        avatar: c.avatar,
        rating: ratingValue,
        distanceKm: Math.round((c.distance / 1000) * 10) / 10,
        avgResponseTimeSeconds: c.avgResponseTimeSeconds ?? null,
        completedWithClient,
        matchPercentage,
        breakdown: {
          distance: Math.round(distanceScore * 100),
          rating: Math.round(ratingScore * 100),
          responseTime: Math.round(responseScore * 100),
          history: Math.round(historyScore * 100),
        },
      };
    });

    // الأعلى تطابقاً أولاً
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      status: 'success',
      results: matches.length,
      data: { matches },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'تعذر حساب نتائج التطابق',
      error: err.message,
    });
  }
};

exports.createRequest = async (req, res) => {
    try {
        const {
            service,
            address,
            coordinates,
            clientNotes,
            paymentMethod,
            scheduledAt,
        } = req.body;

        const baseFee = 120;
        const emergencyFee = !scheduledAt || new Date(scheduledAt) <= new Date() ? 30 : 0;
        const totalAmount = baseFee + emergencyFee;

        const newRequest = await Request.create({
            client: req.user._id,
            service,
            location: {
                address,
                coordinates,
            },
            clientNotes,
            scheduledAt: scheduledAt || Date.now(),
            pricing: {
                baseFee,
                emergencyFee,
                totalAmount,
            },
            paymentMethod,
        });

        res.status(201).json({
            status: 'success',
            data: {
                request: newRequest,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: 'فشل في إنشاء الطلب، يرجى مراجعة البيانات',
            error: err.message,
        });
    }
};

exports.getRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
          .populate('service')
          .populate('craftsman', 'name phone avatar rating avgResponseTimeSeconds location');

        if (!request) {
            return res.status(404).json({
                status: 'fail',
                message: 'الطلب غير موجود',
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                request,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: 'تعذر جلب الطلب',
            error: err.message,
        });
    }
};


// 4. قبول الطلب من طرف الحرفي (Accept Request)
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const selectedCraftsmanId = req.user.role === 'customer' ? req.body.craftsmanId : req.user._id;

    if (!['craftsman', 'customer'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'غير مسموح لك بتنفيذ هذا الإجراء'
      });
    }

    if (!selectedCraftsmanId) {
      return res.status(400).json({ status: 'fail', message: 'يرجى تحديد الفني' });
    }

    // الحرفي بيقبل طلب موجود (بعد ما العميل اختاره ودفع)
    if (req.user.role === 'craftsman') {
      const currentRequest = await Request.findOneAndUpdate(
        { _id: requestId, craftsman: req.user._id, status: 'SELECTED' },
        {
          $set: { status: 'ACCEPTED' },
          $push: { statusHistory: { status: 'ACCEPTED', changedAt: Date.now() } },
        },
        { new: true }
      );

      if (!currentRequest) {
        return res.status(409).json({
          status: 'fail',
          message: 'الطلب لم يعد متاحاً'
        });
      }

      await User.findByIdAndUpdate(req.user._id, { isAvailable: false });

      return res.status(200).json({
        status: 'success',
        message: 'تم قبول الطلب بنجاح',
        data: { request: currentRequest }
      });
    }

    // العميل بيختار فني (من صفحة المطابقة)
    const query = { _id: requestId, status: 'PENDING_MATCHING', client: req.user._id };

    const currentRequest = await Request.findOneAndUpdate(
      query,
      {
        $set: { craftsman: selectedCraftsmanId, status: 'SELECTED' },
        $push: { statusHistory: { status: 'SELECTED', changedAt: Date.now() } },
      },
      { new: true }
    );

    if (!currentRequest) {
      return res.status(409).json({
        status: 'fail',
        message: 'الطلب لم يعد متاحاً'
      });
    }

    // تسجيل رد الفني في matchingPool وحساب سرعة استجابته الفعلية
    const poolEntry = currentRequest.matchingPool.find(
      (entry) => entry.craftsman.toString() === selectedCraftsmanId.toString()
    );

    let responseSeconds = null;
    if (poolEntry) {
      poolEntry.respondedAt = new Date();
      poolEntry.response = 'SELECTED';
      responseSeconds = Math.round((poolEntry.respondedAt - poolEntry.offeredAt) / 1000);
    }

    await currentRequest.save();

    if (responseSeconds !== null) {
      const craftsman = await User.findById(selectedCraftsmanId);
      await craftsman.recordResponseTime(responseSeconds);
    }

    res.status(200).json({
      status: 'success',
      message: 'تم اختيار الفني بنجاح، بانتظار تأكيد الحجز',
      data: {
        request: currentRequest
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ أثناء قبول الطلب',
      error: err.message
    });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentMethod } = req.body;
    const normalizedPaymentMethod = paymentMethod === 'CARD' ? 'CARD' : 'CASH';

    const currentRequest = await Request.findById(requestId);
    if (!currentRequest) {
      return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    if (currentRequest.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'غير مسموح لك بتأكيد هذا الحجز' });
    }

    if (currentRequest.status !== 'SELECTED') {
      return res.status(400).json({ status: 'fail', message: 'يجب اختيار فني قبل تأكيد الحجز' });
    }

    currentRequest.paymentMethod = normalizedPaymentMethod;
    currentRequest.isPaid = normalizedPaymentMethod === 'CARD';
    currentRequest.statusHistory.push({
      status: 'PAID',
      changedAt: Date.now(),
    });

    await currentRequest.save();

    res.status(200).json({
      status: 'success',
      message: 'تم تأكيد الحجز بنجاح، بانتظار موافقة الحرفي',
      data: { request: currentRequest },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ أثناء تأكيد الحجز',
      error: err.message,
    });
  }
};

// 5. رفض الطلب من طرف الحرفي (Reject Request)
// مهم لحساب سرعة الاستجابة بدقة: الرفض رد فعلي برضو، مش لازم يكون قبول
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (req.user.role !== 'craftsman') {
      return res.status(403).json({
        status: 'fail',
        message: 'هذا الإجراء مخصص للفنيين فقط'
      });
    }

    const currentRequest = await Request.findById(requestId);
    if (!currentRequest) {
      return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    const poolEntry = currentRequest.matchingPool.find(
      (entry) => entry.craftsman.toString() === req.user._id.toString()
    );

    if (!poolEntry) {
      return res.status(400).json({
        status: 'fail',
        message: 'هذا الطلب لم يُعرض عليك من الأساس'
      });
    }

    poolEntry.respondedAt = new Date();
    poolEntry.response = 'REJECTED';
    const responseSeconds = Math.round((poolEntry.respondedAt - poolEntry.offeredAt) / 1000);

    await currentRequest.save();

    const craftsman = await User.findById(req.user._id);
    await craftsman.recordResponseTime(responseSeconds);

    res.status(200).json({
      status: 'success',
      message: 'تم تسجيل رفضك لهذا الطلب'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};


// تحديث حالة الطلب (من قِبل الفني)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // الحالة الجديدة اللي جاية من الفرونت (مثلا: IN_PROGRESS)

    // التأكد إن اللي بيعدل هو الفني وصاحب الطلب ده بالذات
    const currentRequest = await Request.findById(requestId);
    if (!currentRequest) {
      return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    if (currentRequest.craftsman.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'غير مسموح لك بتعديل هذا الطلب' });
    }

    // تحديث الحالة وحفظ التاريخ
    currentRequest.status = status;
    currentRequest.statusHistory.push({
      status,
      changedAt: Date.now()
    });

    await currentRequest.save();

    res.status(200).json({
      status: 'success',
      message: `تم تحديث حالة الطلب إلى ${status}`,
      data: { request: currentRequest }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
// إنهاء الطلب بنجاح
exports.completeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const currentRequest = await Request.findById(requestId);
    if (!currentRequest) {
      return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    // التأكد إن الفني المربوط بالطلب هو اللي بيقفل
    if (currentRequest.craftsman.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'عذراً، أنت لست الفني المسؤول عن هذا الطلب' });
    }

    // 1. تحديث حالة الطلب لـ COMPLETED
    currentRequest.status = 'COMPLETED';
    currentRequest.statusHistory.push({
      status: 'COMPLETED',
      changedAt: Date.now()
    });
    await currentRequest.save();

    // 2. تحرير الفني ليكون متاحاً لطلبات أخرى فوراً ✨
    await User.findByIdAndUpdate(req.user._id, { isAvailable: true });

    res.status(200).json({
      status: 'success',
      message: 'تم إنهاء الطلب بنجاح، وتحويل حالتك إلى متاح لتلقي طلبات جديدة!',
      data: { request: currentRequest }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
