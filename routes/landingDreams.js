const express = require('express');
const router = express.Router();
const LandingDream = require('../models/LandingDream');

router.post('/', async (req, res) => {
  try {
    const { childName, phone, dreamDescription, email, parentName } = req.body;

    // ולידציה בסיסית בצד השרת (בנוסף לוולידציה בדפדפן)
    if (!childName || !phone || !dreamDescription) {
      return res.status(400).json({
        success: false,
        message: 'חסרים שדות חובה: שם הילד/ה, טלפון ותיאור החלום.',
      });
    }

    const newDream = new LandingDream({
      childName,
      phone,
      dreamDescription,
      email,
      parentName,
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
