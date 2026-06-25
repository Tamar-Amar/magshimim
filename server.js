require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const emailDreamsRouter = require('./routes/emailDreams');
const yemotDreamsRouter = require('./routes/yemotDreams');
const landingDreamsRouter = require('./routes/landingDreams');
const { syncAllDreamsToSheets } = require('./services/googleSheets');
const { startYemotPoller } = require('./services/yemotPoller');

const app = express();

// 1. הגדרת פורט דינמי שמתאים לענן (רנדר מזריקה את הפורט ל-process.env.PORT)
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הגשת דף הנחיתה והקבצים הסטטיים מתוך תיקיית public
app.use(express.static(path.join(__dirname, 'public')));

// 2. הגדרת מחרוזת חיבור גמישה (נעביר לה את הקישור האמיתי של מונגו בהמשך)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/magshimim_db';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Successfully connected to MongoDB! 🍃');
    try {
      await syncAllDreamsToSheets();
    } catch (err) {
      console.error('[Google Sheets] Startup sync failed:', err.message);
    }

    startYemotPoller();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// כל מקור נתונים מקבל נתיב ייעודי משלו
app.use('/api/dreams/email', emailDreamsRouter);
app.use('/api/dreams/yemot', yemotDreamsRouter);
app.use('/api/dreams/landing', landingDreamsRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running smoothly on port ${PORT} 🚀`);
});