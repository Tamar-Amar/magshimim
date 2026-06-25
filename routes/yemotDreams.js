const express = require('express');
const router = express.Router();
const YemotDream = require('../models/YemotDream');
const IrregularRequest = require('../models/IrregularRequest');
const { appendIrregularRequest } = require('../services/googleSheets');

// ימות המשיח שולחים בדרך כלל בקשת GET עם הפרמטרים ב-URL (Query Parameters),
// אבל אם בעתיד תעברי דרך Make עם POST - גם זה ייתפס. לכן ממזגים query + body.
async function handleYemotDream(req, res) {
  try {
    const data = { ...req.query, ...req.body };
    const { childName, phone, dreamDescription, callId, recordingUrl } = data;

    // בלי טלפון אין למי לחזור - נשמור כפנייה חריגה
    if (!phone) {
      const irregular = new IrregularRequest({
        childName,
        phone,
        dreamDescription,
        source: 'yemot',
        reason: 'missing_phone',
      });

      await irregular.save();
      appendIrregularRequest(irregular);
      console.log('[Yemot] Saved to Irregular Requests. Reason: missing_phone');
      return res.status(201).json({ success: true, message: 'Saved to irregular requests.' });
    }

    const newYemotDream = new YemotDream({
      childName,
      phone,
      dreamDescription,
      callId,
      recordingUrl,
    });

    await newYemotDream.save();
    console.log(`[Yemot] Successfully saved new dream for phone: ${phone}`);
    return res.status(201).json({ success: true, message: 'Saved from Yemot smoothly!' });

  } catch (error) {
    console.error('Error processing yemot request:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

router.get('/', handleYemotDream);
router.post('/', handleYemotDream);

module.exports = router;
