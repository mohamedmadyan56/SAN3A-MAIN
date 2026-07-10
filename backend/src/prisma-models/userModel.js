const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userModel = {
  create: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: {
        name: data.name, email: data.email, phone: data.phone,
        password: hashedPassword, role: data.role || 'customer',
        ...(data.latitude && { latitude: data.latitude }),
        ...(data.longitude && { longitude: data.longitude }),
        ...(data.address && { locationAddress: data.address }),
      },
    });
  },
 // not secure enough there will update in next features
  findByEmail: async (email) => {
    return prisma.user.findUnique({ where: { email } });
  },

  findById: async (id) => {
    return prisma.user.findUnique({ where: { id } });
  },

  update: async (id, data) => {
    return prisma.user.update({ where: { id }, data });
  },

  findAvailableCraftsmen: async () => {
    return prisma.user.findMany({
      where: { role: 'craftsman', isAvailable: true, isActive: true },
      select: { id: true, name: true, rating: true, latitude: true, longitude: true,
               avgResponseTimeSeconds: true, isAvailable: true, locationAddress: true },
    });
  },

  comparePassword: async (candidatePassword, hashedPassword) => {
    return bcrypt.compare(candidatePassword, hashedPassword);
  },

  createPasswordResetToken: async (user) => {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    return resetToken;
  },

  recordResponseTime: async (craftsmanId, responseSeconds) => {
    const craftsman = await prisma.user.findUnique({ where: { id: craftsmanId } });
    const prevCount = craftsman.responseCount || 0;
    const prevAvg = craftsman.avgResponseTimeSeconds || 0;
    const newCount = prevCount + 1;
    const newAvg = Math.round((prevAvg * prevCount + responseSeconds) / newCount);
    return prisma.user.update({
      where: { id: craftsmanId },
      data: { avgResponseTimeSeconds: newAvg, responseCount: newCount },
    });
  },
};

module.exports = userModel;