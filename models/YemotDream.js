const mongoose = require('mongoose');

// חלומות שהגיעו מימות המשיח (אין מייל; יש מזהה שיחה ולפעמים קישור להקלטה)
const YemotDreamSchema = new mongoose.Schema({
  childName: { type: String, default: null },
  phone: { type: String, required: true },
  dreamDescription: { type: String, default: null },
  callId: { type: String, default: null },      // מזהה שיחה ייחודי מימות המשיח (Booking)
  recordingUrl: { type: String, default: null }, // קישור להקלטה של הילד אם יש
}, { timestamps: true });

YemotDreamSchema.index({ callId: 1 }, { unique: true, sparse: true });

// הפרמטר השלישי מכריח את שם האוסף להיות yemot_dreams
module.exports = mongoose.model('YemotDream', YemotDreamSchema, 'yemot_dreams');
