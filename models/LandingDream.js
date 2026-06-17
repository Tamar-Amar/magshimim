const mongoose = require('mongoose');

// חלומות שהגיעו מטופס דף הנחיתה (המשתמש מילא את הפרטים בעצמו)
const LandingDreamSchema = new mongoose.Schema({
  childName: { type: String, required: true }, // שם מלא כולל שם משפחה
  address: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dreamDescription: { type: String, required: true },
}, { timestamps: true });

// הפרמטר השלישי מכריח את שם האוסף להיות landing_dreams
module.exports = mongoose.model('LandingDream', LandingDreamSchema, 'landing_dreams');
