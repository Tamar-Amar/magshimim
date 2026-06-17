const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const emailDreamsRouter = require('./routes/emailDreams');
const yemotDreamsRouter = require('./routes/yemotDreams');
const landingDreamsRouter = require('./routes/landingDreams');

const app = express();

// 1. הגדרת פורט דינמי שמתאים לענן (רנדר מזריקה את הפורט ל-process.env.PORT)
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הגשת דף הנחיתה והקבצים הסטטיים מתוך תיקיית public
app.use(express.static(path.join(__dirname, 'public')));

// 2. הגדרת מחרוזת חיבור גמישה (נעביר לה את הקישור האמיתי של מונגו בהמשך)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:21017/magshimim_db';

mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB! 🍃'))
  .catch((err) => console.error('MongoDB connection error:', err));

// כל מקור נתונים מקבל נתיב ייעודי משלו
app.use('/api/dreams/email', emailDreamsRouter);
app.use('/api/dreams/yemot', yemotDreamsRouter);
app.use('/api/dreams/landing', landingDreamsRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running smoothly on port ${PORT} 🚀`);
});