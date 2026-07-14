const prisma = require('../utils/prisma')
const {haversineDistance} = require('../utils/haversine')


const MATCH_WEIGHTS = { distance: 0.4, rating: 0.3, responseTime: 0.2, history: 0.1 };
const MAX_SEARCH_DISTANCE_METERS = 10000;
const RATING_MIN = 1; const RATING_MAX = 5;
const DEFAULT_RESPONSE_SECONDS = 120; const WORST_RESPONSE_SECONDS = 600;





function normalize(value, min, max, lowerIsBetter = false) {
  if (max === min) return 1;
  let ratio = (value - min) / (max - min);
  ratio = Math.min(Math.max(ratio, 0), 1);
  return lowerIsBetter ? 1 - ratio : ratio;
}
exports.findNearbyCraftsmen = async (req, res) => {
  try {
    const request = await prisma.request.findUnique({
      where: { id: req.params.requestId },
      include: { matchingPoolEntries: true },
    });
    if (!request) return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });

    const maxDistance = Number(req.query.radius) || 5000;
    const allCraftsmen = await prisma.user.findMany({
      where: { role: 'craftsman', isAvailable: true, isActive: true },
      select: { id: true, name: true, phone: true, avatar: true, rating: true, latitude: true, longitude: true },
    });

    const nearbyCraftsmen = allCraftsmen
      .map((c) => ({ ...c, distance: haversineDistance(request.latitude, request.longitude, c.latitude, c.longitude) }))
      .filter((c) => c.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    const alreadyTracked = new Set(request.matchingPoolEntries.map((e) => e.craftsmanId));
    for (const c of nearbyCraftsmen) {
      if (!alreadyTracked.has(c.id)) {
        await prisma.matchingPoolEntry.create({ data: { requestId: request.id, craftsmanId: c.id } });
      }
    }

    res.status(200).json({ status: 'success', results: nearbyCraftsmen.length, data: { craftsmen: nearbyCraftsmen } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: 'تعذر البحث عن فنيين قريبين', error: err.message });
  }
};

















exports.getMatchResults = async (req, res) => {
  try {
    const currentRequest = await prisma.request.findUnique({ where: { id: req.params.requestId } });
    if (!currentRequest) return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });

    const maxDistance = Number(req.query.radius) || MAX_SEARCH_DISTANCE_METERS;
    const allCraftsmen = await prisma.user.findMany({
      where: { role: 'craftsman', isAvailable: true, isActive: true },
      select: { id: true, name: true, phone: true, avatar: true, rating: true, latitude: true, longitude: true, avgResponseTimeSeconds: true },
    });

    const craftsmenWithDistance = allCraftsmen
      .map((c) => ({ ...c, distance: haversineDistance(currentRequest.latitude, currentRequest.longitude, c.latitude, c.longitude) }))
      .filter((c) => c.distance <= maxDistance);

    if (craftsmenWithDistance.length === 0) {
      return res.status(200).json({ status: 'success', results: 0, data: { matches: [] } });
    }

    const historyAgg = await prisma.request.groupBy({
      by: ['craftsmanId'],
      where: { clientId: currentRequest.clientId, craftsmanId: { in: craftsmenWithDistance.map((c) => c.id) }, status: 'COMPLETED' },
      _count: { id: true },
    });
    const historyMap = new Map(historyAgg.map((h) => [h.craftsmanId, h._count.id]));
    const maxHistoryCount = Math.max(1, ...historyAgg.map((h) => h._count.id));

    const matches = craftsmenWithDistance.map((c) => {
      const distanceScore = normalize(c.distance, 0, maxDistance, true);
      const ratingScore = normalize(c.rating ?? RATING_MIN, RATING_MIN, RATING_MAX, false);
      const responseSeconds = c.avgResponseTimeSeconds ?? DEFAULT_RESPONSE_SECONDS;
      const responseScore = normalize(responseSeconds, 0, WORST_RESPONSE_SECONDS, true);
      const completedWithClient = historyMap.get(c.id) || 0;
      const historyScore = completedWithClient === 0 ? 0 : normalize(completedWithClient, 0, maxHistoryCount, false);

      const matchPercentage = Math.round(
        (distanceScore * MATCH_WEIGHTS.distance + ratingScore * MATCH_WEIGHTS.rating +
         responseScore * MATCH_WEIGHTS.responseTime + historyScore * MATCH_WEIGHTS.history) * 100
      );

      return {
        _id: c.id, name: c.name, phone: c.phone, avatar: c.avatar, rating: c.rating,
        distanceKm: Math.round((c.distance / 1000) * 10) / 10,
        avgResponseTimeSeconds: c.avgResponseTimeSeconds ?? null,
        completedWithClient, matchPercentage,
        breakdown: { distance: Math.round(distanceScore * 100), rating: Math.round(ratingScore * 100), responseTime: Math.round(responseScore * 100), history: Math.round(historyScore * 100) },
      };
    });
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({ status: 'success', results: matches.length, data: { matches } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: 'تعذر حساب نتائج التطابق', error: err.message });
  }
};


exports.createRequest = async (req, res) => {
  try {
    const { service, address, coordinates, clientNotes, paymentMethod, scheduledAt } = req.body;
    const baseFee = 120;
    const emergencyFee = !scheduledAt || new Date(scheduledAt) <= new Date() ? 30 : 0;
    const totalAmount = baseFee + emergencyFee;

    const newRequest = await prisma.request.create({
      data: {
        clientId: req.user.id, serviceId: service, address,
        longitude: coordinates?.[0] || 31.2357, latitude: coordinates?.[1] || 30.0444,
        clientNotes, scheduledAt: scheduledAt || new Date(), baseFee, emergencyFee, totalAmount,
        paymentMethod: paymentMethod || 'CASH',
        statusHistory: { create: { status: 'PENDING_MATCHING', changedAt: new Date() } },
      },
      include: { service: true, statusHistory: true },
    });
    res.status(201).json({ status: 'success', data: { request: newRequest } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: 'فشل في إنشاء الطلب', error: err.message });
  }
};


exports.getRequest = async (req, res) => {
  try {
    const request = await prisma.request.findUnique({
      where: { id: req.params.id },
      include: {
        service: true,
        craftsman: { select: { id: true, name: true, phone: true, avatar: true, rating: true, avgResponseTimeSeconds: true, latitude: true, longitude: true } },
        matchingPoolEntries: { include: { craftsman: { select: { id: true, name: true } } } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
      },
    });
    if (!request) return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    res.status(200).json({ status: 'success', data: { request } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: 'تعذر جلب الطلب', error: err.message });
  }
};


exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const selectedCraftsmanId = req.user.role === 'customer' ? req.body.craftsmanId : req.user.id;

    if (!['craftsman', 'customer'].includes(req.user.role))
      return res.status(403).json({ status: 'fail', message: 'غير مسموح' });
    if (!selectedCraftsmanId)
      return res.status(400).json({ status: 'fail', message: 'يرجى تحديد الفني' });

    // Craftsman يقبل طلب
    if (req.user.role === 'craftsman') {
      const existing = await prisma.request.findFirst({ where: { id: requestId, craftsmanId: req.user.id, status: 'SELECTED' } });
      if (!existing) return res.status(409).json({ status: 'fail', message: 'الطلب لم يعد متاحاً' });
      const updated = await prisma.request.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED', statusHistory: { create: { status: 'ACCEPTED', changedAt: new Date() } } },
      });
      await prisma.user.update({ where: { id: req.user.id }, data: { isAvailable: false } });
      return res.status(200).json({ status: 'success', message: 'تم قبول الطلب', data: { request: updated } });
    }

    // Customer يختار فني
    const currentRequest = await prisma.request.findFirst({ where: { id: requestId, status: 'PENDING_MATCHING', clientId: req.user.id } });
    if (!currentRequest) return res.status(409).json({ status: 'fail', message: 'الطلب لم يعد متاحاً' });

    const poolEntry = await prisma.matchingPoolEntry.findFirst({ where: { requestId, craftsmanId: selectedCraftsmanId } });
    let responseSeconds = null;
    if (poolEntry) {
      const respondedAt = new Date();
      responseSeconds = Math.round((respondedAt - poolEntry.offeredAt) / 1000);
      await prisma.matchingPoolEntry.update({ where: { id: poolEntry.id }, data: { respondedAt, response: 'ACCEPTED' } });
    }

    await prisma.request.update({
      where: { id: requestId },
      data: { craftsmanId: selectedCraftsmanId, status: 'SELECTED', statusHistory: { create: { status: 'SELECTED', changedAt: new Date() } } },
    });

    if (responseSeconds !== null) {
      const craftsman = await prisma.user.findUnique({ where: { id: selectedCraftsmanId } });
      if (craftsman) {
        const newAvg = Math.round(((craftsman.avgResponseTimeSeconds || 0) * (craftsman.responseCount || 0) + responseSeconds) / ((craftsman.responseCount || 0) + 1));
        await prisma.user.update({ where: { id: selectedCraftsmanId }, data: { avgResponseTimeSeconds: newAvg, responseCount: (craftsman.responseCount || 0) + 1 } });
      }
    }

    const updated = await prisma.request.findUnique({ where: { id: requestId } });
    res.status(200).json({ status: 'success', message: 'تم اختيار الفني', data: { request: updated } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};


exports.confirmBooking = async (req,res)=>{
  try{
    const {requestId} = req.params;
    const { paymentMethod } = req.body;
        const currentRequest = await prisma.request.findUnique({ where: { id: requestId } });

        if (!currentRequest) return res.status(404).json({
          status:'fail',
          message:'طلب غير موجود'
        })
  }
}