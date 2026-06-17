const express = require('express');
const router = express.Router();
const { Dream, IrregularRequest } = require('../models/Dream');

router.post('/email', async (req, res) => {
  try {
    const { childName, phone, dreamDescription, email } = req.body;

    // תנאי 1: אם הכול חזר null מה-AI (מייל ספאם / ניוזלטר / הודעה לא קשורה) - נתעלם
    if (!childName && !phone && !dreamDescription) {
      console.log(`[Webhook] Ignored unrelated email from: ${email}`);
      return res.status(200).json({ message: 'Ignored - unrelated email.' });
    }

    // תנאי 2: פנייה חריגה (יש חלום אבל אין טלפון, או להפך)
    if (!phone || !dreamDescription) {
      let reason = 'unknown';
      if (!phone) reason = 'missing_phone';
      if (!dreamDescription) reason = 'missing_dream_description';

      const irregular = new IrregularRequest({
        childName,
        phone,
        dreamDescription,
        email,
        reason
      });

      await irregular.save();
      console.log(`[Webhook] Saved to Irregular Requests. Reason: ${reason}`);
      return res.status(201).json({ message: 'Saved to irregular requests.' });
    }

    // תנאי 3: פנייה תקינה לחלוטין! שומרים במאגר הראשי
    const newDream = new Dream({
      childName,
      phone,
      dreamDescription,
      email
    });

    await newDream.save();
    console.log(`[Webhook] Successfully saved new dream for: ${childName}`);
    return res.status(201).json({ message: 'Dream successfully saved to main database!' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;