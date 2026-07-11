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
