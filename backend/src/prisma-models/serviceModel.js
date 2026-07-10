const prisma = require('../utils/prisma');

const serviceModel = {
  findAll: async () => prisma.service.findMany({ where: { isActive: true } }),
  create: async (data) => prisma.service.create({ data }),
  findBySlug: async (slug) => prisma.service.findUnique({ where: { slug } }),
  findById: async (id) => prisma.service.findUnique({ where: { id } }),
};

module.exports = serviceModel;