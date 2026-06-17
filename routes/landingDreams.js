const express = require('express');
const router = express.Router();
const LandingDream = require('../models/LandingDream');

router.post('/', async (req, res) => {
  try {
    const { childName, address, email, phone, dreamDescription } = req.body;

    // ולידציה בסיסית בצד השרת (בנוסף לוולידציה בדפדפן)
    if (!childName || !address || !email || !phone || !dreamDescription) {
      return res.status(400).json({
        success: false,
        message: 'חסרים שדות חובה: שם הילד/ה, כתובת, מייל, טלפון ותיאור החלום.',
      });
    }

    const newDream = new LandingDream({
      childName,
      address,
      email,
      phone,
      dreamDescription,
    });

    await newDream.save();
    console.log(`[Landing] Successfully saved new dream for: ${childName}`);
    return res.status(201).json({ success: true, message: 'החלום נשמר בהצלחה!' });

  } catch (error) {
    console.error('Error processing landing request:', error);
    return res.status(500).json({ success: false, message: 'אירעה שגיאה בשרת. נסו שוב.' });
  }
});

module.exports = router;
