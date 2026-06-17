const mongoose = require('mongoose');

// חלומות שהגיעו ממייל (במייל חובה שיהיה גם טלפון וגם תיאור חלום)
const EmailDreamSchema = new mongoose.Schema({
  childName: { type: String, default: null },
  phone: { type: String, required: true },
  dreamDescription: { type: String, required: true },
  email: { type: String, default: null },
}, { timestamps: true });

// הפרמטר השלישי מכריח את שם האוסף להיות email_dreams
module.exports = mongoose.model('EmailDream', EmailDreamSchema, 'email_dreams');
