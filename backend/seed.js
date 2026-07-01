const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./src/models/serviceModel');
const User = require('./src/models/userModel');
const Request = require('./src/models/requestModel');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const services = [
      { nameAr: 'نظافة', nameEn: 'Cleaning', slug: 'cleaning', icon: 'cleaning-icon' },
      { nameAr: 'تكييف', nameEn: 'Air Conditioning', slug: 'ac', icon: 'ac-icon' },
      { nameAr: 'سباكة', nameEn: 'Plumbing', slug: 'plumbing', icon: 'plumbing-icon' },
      { nameAr: 'كهرباء', nameEn: 'Electricity', slug: 'electricity', icon: 'electricity-icon' },
      { nameAr: 'دهانات', nameEn: 'Painting', slug: 'painting', icon: 'painting-icon' },
      { nameAr: 'نجارة', nameEn: 'Carpentry', slug: 'carpentry', icon: 'carpentry-icon' },
    ];

    for (const s of services) {
      await Service.updateOne({ slug: s.slug }, { $set: s }, { upsert: true });
    }
    console.log('Seeded services');

    const allServices = await Service.find();

    const hashedPassword = await bcrypt.hash('12345678', 12);

    const usersData = [
      { name: 'أحمد المدير', email: 'admin@san3a.com', phone: '+201001000001', password: hashedPassword, role: 'admin', rating: 5, isAvailable: true,
        location: { type: 'Point', coordinates: [31.2357, 30.0444], address: 'القاهرة، مصر' } },
      { name: 'أحمد حسن', email: 'ahmed@san3a.com', phone: '+201001000002', password: hashedPassword, role: 'craftsman', rating: 4.9, isAvailable: true, avgResponseTimeSeconds: 45, responseCount: 120,
        location: { type: 'Point', coordinates: [31.2400, 30.0500], address: 'الزمالك، القاهرة' } },
      { name: 'عمر السباك', email: 'omar@san3a.com', phone: '+201001000003', password: hashedPassword, role: 'craftsman', rating: 4.8, isAvailable: true, avgResponseTimeSeconds: 60, responseCount: 85,
        location: { type: 'Point', coordinates: [31.2300, 30.0380], address: 'المعادي، القاهرة' } },
      { name: 'سارة كريم', email: 'sara@san3a.com', phone: '+201001000004', password: hashedPassword, role: 'customer', rating: 4.7,
        location: { type: 'Point', coordinates: [31.2200, 30.0350], address: 'مصر الجديدة، القاهرة' } },
      { name: 'محمد النجار', email: 'mohamed@san3a.com', phone: '+201001000005', password: hashedPassword, role: 'craftsman', rating: 4.7, isAvailable: true, avgResponseTimeSeconds: 90, responseCount: 200,
        location: { type: 'Point', coordinates: [31.2500, 30.0600], address: 'مدينة نصر، القاهرة' } },
      { name: 'ليلى حسن', email: 'layla@san3a.com', phone: '+201001000006', password: hashedPassword, role: 'customer', rating: 4.5,
        location: { type: 'Point', coordinates: [31.2100, 30.0300], address: 'المهندسين، الجيزة' } },
      { name: 'طارق محمود', email: 'tarek@san3a.com', phone: '+201001000007', password: hashedPassword, role: 'craftsman', rating: 4.6, isAvailable: false, avgResponseTimeSeconds: 120, responseCount: 150,
        location: { type: 'Point', coordinates: [31.2600, 30.0700], address: 'العباسية، القاهرة' } },
      { name: 'منى نبيل', email: 'mona@san3a.com', phone: '+201001000008', password: hashedPassword, role: 'customer', rating: 4.8,
        location: { type: 'Point', coordinates: [31.2450, 30.0550], address: 'الدقي، الجيزة' } },
    ];

    await User.deleteMany({});
    const users = await User.insertMany(usersData);
    console.log('Seeded users');

    const adminUser = users.find(u => u.role === 'admin');
    const craftsmen = users.filter(u => u.role === 'craftsman');
    const customers = users.filter(u => u.role === 'customer');

    await Request.deleteMany({});

    const requestData = [
      {
        client: customers[0]._id, craftsman: craftsmen[0]._id,
        service: allServices.find(s => s.slug === 'plumbing')._id,
        status: 'IN_PROGRESS', pricing: { baseFee: 120, emergencyFee: 30, totalAmount: 150 },
        location: { address: 'الزمالك، القاهرة', coordinates: [31.2400, 30.0500] },
        clientNotes: 'تسريب في ماسورة المطبخ، يحتاج إصلاح عاجل. المياه تتجمع تحت الحوض.',
        paymentMethod: 'CASH', isPaid: false,
        statusHistory: [{ status: 'PENDING_MATCHING' }, { status: 'ACCEPTED' }, { status: 'ARRIVED' }, { status: 'IN_PROGRESS' }],
      },
      {
        client: customers[1]._id, craftsman: craftsmen[1]._id,
        service: allServices.find(s => s.slug === 'electricity')._id,
        status: 'COMPLETED', pricing: { baseFee: 120, emergencyFee: 0, totalAmount: 120 },
        location: { address: 'المعادي، القاهرة', coordinates: [31.2300, 30.0380] },
        clientNotes: 'تركيب قفل ذكي للباب الرئيسي',
        paymentMethod: 'CARD', isPaid: true,
        completedAt: new Date(),
        statusHistory: [{ status: 'PENDING_MATCHING' }, { status: 'ACCEPTED' }, { status: 'IN_PROGRESS' }, { status: 'COMPLETED' }],
      },
      {
        client: customers[2]._id, craftsman: craftsmen[2]._id,
        service: allServices.find(s => s.slug === 'ac')._id,
        status: 'PENDING_MATCHING', pricing: { baseFee: 120, emergencyFee: 30, totalAmount: 150 },
        location: { address: 'مدينة نصر، القاهرة', coordinates: [31.2500, 30.0600] },
        clientNotes: 'صيانة دورية للمكيف',
        paymentMethod: 'CASH', isPaid: false,
        statusHistory: [{ status: 'PENDING_MATCHING' }],
      },
      {
        client: customers[0]._id, craftsman: craftsmen[0]._id,
        service: allServices.find(s => s.slug === 'cleaning')._id,
        status: 'COMPLETED', pricing: { baseFee: 120, emergencyFee: 0, totalAmount: 350 },
        location: { address: 'الزمالك، القاهرة', coordinates: [31.2400, 30.0500] },
        clientNotes: 'تنظيف عميق للشقة',
        paymentMethod: 'VODAFONE_CASH', isPaid: true,
        completedAt: new Date(Date.now() - 86400000),
        statusHistory: [{ status: 'PENDING_MATCHING' }, { status: 'ACCEPTED' }, { status: 'IN_PROGRESS' }, { status: 'COMPLETED' }],
      },
      {
        client: customers[1]._id, craftsman: null,
        service: allServices.find(s => s.slug === 'plumbing')._id,
        status: 'PENDING_MATCHING', pricing: { baseFee: 120, emergencyFee: 30, totalAmount: 150 },
        location: { address: 'المهندسين، الجيزة', coordinates: [31.2100, 30.0300] },
        clientNotes: 'تسريب مياه في الحمام',
        paymentMethod: 'CASH', isPaid: false,
        statusHistory: [{ status: 'PENDING_MATCHING' }],
      },
      {
        client: customers[0]._id, craftsman: craftsmen[0]._id,
        service: allServices.find(s => s.slug === 'electricity')._id,
        status: 'DISPUTED', pricing: { baseFee: 120, emergencyFee: 30, totalAmount: 150 },
        location: { address: 'الزمالك، القاهرة', coordinates: [31.2400, 30.0500] },
        clientNotes: 'قام الفني بإتلاف إطار الباب أثناء تركيب القفل الذكي. القفل يعمل، لكن الخشب يحتاج إلى إصلاح.',
        paymentMethod: 'CASH', isPaid: false,
        statusHistory: [{ status: 'PENDING_MATCHING' }, { status: 'ACCEPTED' }, { status: 'IN_PROGRESS' }, { status: 'COMPLETED' }, { status: 'DISPUTED' }],
      },
    ];

    await Request.insertMany(requestData);
    console.log('Seeded requests with demo data');

    console.log('\n========================================');
    console.log('  Demo Accounts for Defense:');
    console.log('========================================');
    console.log('  Admin:     admin@san3a.com / 12345678');
    console.log('  Craftsmen: ahmed@san3a.com / 12345678');
    console.log('             omar@san3a.com / 12345678');
    console.log('  Customers: sara@san3a.com / 12345678');
    console.log('             layla@san3a.com / 12345678');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
