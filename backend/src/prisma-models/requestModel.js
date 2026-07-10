const prisma = require('../utils/prisma');

const requestModel = {
  create: async (data) => {
    const { clientId, serviceId, address, latitude, longitude, clientNotes,
            scheduledAt, baseFee, emergencyFee, totalAmount, paymentMethod } = data;
    return prisma.request.create({
      data: {
        clientId, serviceId, address, latitude, longitude, clientNotes,
        scheduledAt: scheduledAt || new Date(),
        baseFee: baseFee || 120, emergencyFee: emergencyFee || 0,
        totalAmount: totalAmount || 120, paymentMethod: paymentMethod || 'CASH',
        statusHistory: {
          create: { status: 'PENDING_MATCHING', changedAt: new Date() },
        },
      },
      include: { service: true, statusHistory: true },
    });
  },

  findById: async (id) => {
    return prisma.request.findUnique({
      where: { id },
      include: {
        service: true,
        client: { select: { id: true, name: true, phone: true, email: true } },
        craftsman: { select: { id: true, name: true, phone: true, avatar: true,
                               rating: true, avgResponseTimeSeconds: true,
                               latitude: true, longitude: true } },
        matchingPoolEntries: { include: { craftsman: { select: { id: true, name: true } } } },
        statusHistory: true,
      },
    });
  },

  updateStatus: async (id, status, extra = {}) => {
    return prisma.request.update({
      where: { id },
      data: {
        status,
        statusHistory: { create: { status, changedAt: new Date(), note: extra.note || undefined } },
        ...extra.fields,
      },
      include: { statusHistory: true },
    });
  },
};

module.exports = requestModel;