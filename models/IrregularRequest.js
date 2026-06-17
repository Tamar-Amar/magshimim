const mongoose = require('mongoose');

// פניות חריגות מכל המקורות (למשל מייל אותנטי אבל בלי מספר טלפון).
// שדה source מאפשר לדעת מאיזה ערוץ הגיעה הפנייה החריגה.
const IrregularRequestSchema = new mongoose.Schema({
  childName: { type: String, default: null },
  phone: { type: String, default: null },
  dreamDescription: { type: String, default: null },
  email: { type: String, default: null },
  source: { type: String, default: null }, // 'email' | 'yemot' | 'landing_page'
  reason: { type: String, required: true }, // "missing_phone" / "missing_dream_description"
}, { timestamps: true });

module.exports = mongoose.model('IrregularRequest', IrregularRequestSchema, 'irregular_requests');
