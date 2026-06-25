require('dotenv').config();
const mongoose = require('mongoose');
const { syncAllDreamsToSheets } = require('../services/googleSheets');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/magshimim_db';

mongoose.connect(mongoURI)
  .then(async () => {
    await syncAllDreamsToSheets();
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Sync failed:', err.message);
    process.exit(1);
  });
