const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env variables at the very beginning
dotenv.config({ path: './.env' });

const app = require('./app');

const DB = process.env.MONGO_URI || 'mongodb://localhost:27017/san3a';

// تحسين خيارات الاتصال بـ MongoDB
const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 45000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

mongoose.connect(DB, mongooseOptions)
  .then(() => {
    console.log('✅ Database connected successfully!');
  })
  .catch(err => {
    console.log('❌ Database connection error:', err.message);
    console.log('⚠️ Retrying connection in 5 seconds...');
    setTimeout(() => {
      mongoose.connect(DB, mongooseOptions);
    }, 5000);
  });

// معالجة فشل الاتصال بعد الاتصال الأولي
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected, attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ Mongoose connection error:', err.message);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server is running and listening on port ${port}...`);
});