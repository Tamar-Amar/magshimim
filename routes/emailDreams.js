const express = require('express');
const router = express.Router();
const EmailDream = require('../models/EmailDream');
const IrregularRequest = require('../models/IrregularRequest');
const { appendEmailDream, appendIrregularRequest } = require('../services/googleSheets');

router.post('/', async (req, res) => {
  try {
    const { childName, phone, dreamDescription, email } = req.body;

    // תנאי 1: אם הכול חזר null מה-AI (מייל ספאם / ניוזלטר / הודעה לא קשורה) - נתעלם
    if (!childName && !phone && !dreamDescription) {
      console.log(`[Email] Ignored unrelated email from: ${email}`);
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
        source: 'email',
        reason,
      });

      await irregular.save();
      appendIrregularRequest(irregular);
      console.log(`[Email] Saved to Irregular Requests. Reason: ${reason}`);
      return res.status(201).json({ message: 'Saved to irregular requests.' });
    }

    // תנאי 3: פנייה תקינה לחלוטין! שומרים באוסף email_dreams
    const newDream = new EmailDream({
      childName,
      phone,
      dreamDescription,
      email,
    });

    await newDream.save();
    appendEmailDream(newDream);
    console.log(`[Email] Successfully saved new dream for: ${childName}`);
    return res.status(201).json({ message: 'Dream successfully saved to email_dreams!' });

  } catch (error) {
    console.error('Error processing email webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
