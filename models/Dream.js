const mongoose = require('mongoose');

// סכמה לחלומות תקינים (יש גם טלפון וגם תיאור חלום)
const DreamSchema = new mongoose.Schema({
  childName: { type: String, default: null },
  phone: { type: String, required: true }, 
  dreamDescription: { type: String, required: true }, 
  email: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// סכמה לפניות חריגות (למשל, מייל אותנטי אבל בלי מספר טלפון)
const IrregularRequestSchema = new mongoose.Schema({
  childName: { type: String, default: null },
  phone: { type: String, default: null },
  dreamDescription: { type: String, default: null },
  email: { type: String, default: null },
  reason: { type: String, required: true }, // "missing_phone" או "missing_dream_description"
  createdAt: { type: Date, default: Date.now }
});

const Dream = mongoose.model('Dream', DreamSchema);
const IrregularRequest = mongoose.model('IrregularRequest', IrregularRequestSchema);

module.exports = { Dream, IrregularRequest };