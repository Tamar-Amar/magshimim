require('dotenv').config();
const mongoose = require('mongoose');
const YemotDream = require('../models/YemotDream');
const { fetchYemotRecords } = require('../services/yemotApi');

// משלים את שדה השכונה (address + neighborhoodCode) לרשומות ימות קיימות
// על סמך השדה P050 שכבר נשמר בימות. בטוח להריץ שוב ושוב.
async function main() {
  const token = process.env.YEMOT_API_TOKEN;
  const extension = process.env.YEMOT_EXTENSION || '8';
  if (!token) {
    console.error('חסר YEMOT_API_TOKEN ב-.env');
    process.exit(1);
  }

  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/magshimim_db';
  await mongoose.connect(mongoURI);

  const records = await fetchYemotRecords(token, extension);
  let updated = 0;
  let withNeighborhood = 0;

  for (const record of records) {
    if (!record.callId) continue;
    if (record.neighborhoodCode == null) continue;

    const result = await YemotDream.updateOne(
      { callId: record.callId },
      { $set: { address: record.neighborhood, neighborhoodCode: record.neighborhoodCode } },
    );

    if (result.matchedCount > 0) {
      updated += 1;
      if (record.neighborhood) withNeighborhood += 1;
    }
  }

  console.log(`עודכנו ${updated} רשומות עם קוד שכונה (מתוכן ${withNeighborhood} נפתרו לשם שכונה).`);
  if (updated > 0 && withNeighborhood === 0) {
    console.log('שים לב: עדיין לא הוגדר מיפוי קוד→שם שכונה ב-yemotApi.js, לכן נשמר רק הקוד.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('שגיאה:', err.message);
  process.exit(1);
});
