require('dotenv').config();
const mongoose = require('mongoose');
const { syncYemotRecords } = require('../services/yemotPoller');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/magshimim_db';

mongoose.connect(mongoURI)
  .then(async () => {
    const result = await syncYemotRecords();
    console.log('[Yemot Poll] Manual sync finished:', result);
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Yemot Poll] Manual sync failed:', err.message);
    process.exit(1);
  });
