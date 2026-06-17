const express = require('express');
const mongoose = require('mongoose');
const dreamsRouter = require('./routes/dreams');

const app = express();

// 1. הגדרת פורט דינמי שמתאים לענן (רנדר מזריקה את הפורט ל-process.env.PORT)
const PORT = process.env.PORT || 5000;

app.use(express.json());

// 2. הגדרת מחרוזת חיבור גמישה (נעביר לה את הקישור האמיתי של מונגו בהמשך)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:21017/magshimim_db';

mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB! 🍃'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/dreams', dreamsRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running smoothly on port ${PORT} 🚀`);
});