const express = require('express');
const router = express.Router();
const LandingDream = require('../models/LandingDream');
const { appendLandingDream } = require('../services/googleSheets');

const NEIGHBORHOOD_NAMES = [
  'בר אילן',
  'ותיקה',
  'חפציבה',
  'קריה חרדית',
  'רמה א',
  'רמה ב',
  'רמה ג1',
  'רמה ג2',
  'רמה ד',
  'רמה ה',
  'רמת אברהם',
].sort((a, b) => a.localeCompare(b, 'he'));

const NEIGHBORHOOD_NOT_FOUND = 'לא מצאתי את השכונה שלי';

const VALID_NEIGHBORHOODS = [...NEIGHBORHOOD_NAMES, NEIGHBORHOOD_NOT_FOUND];

router.post('/', async (req, res) => {
  try {
    const { childName, address, customNeighborhood, email, phone, dreamDescription } = req.body;
    const neighborhood = address?.trim();
    const customNeighborhoodValue = customNeighborhood?.trim();

    // ולידציה בסיסית בצד השרת (בנוסף לוולידציה בדפדפן)
    if (!childName || !neighborhood || !email || !phone || !dreamDescription) {
      return res.status(400).json({
        success: false,
        message: 'חסרים שדות חובה: שם הילד/ה, שכונה, מייל, טלפון ותיאור החלום.',
      });
    }

    if (!VALID_NEIGHBORHOODS.includes(neighborhood)) {
      return res.status(400).json({
        success: false,
        message: 'נא לבחור שכונה מתוך הרשימה.',
      });
    }

    // אם המשתמש בחר "לא מצאתי את השכונה שלי" – חובה למלא שכונה בטקסט חופשי
    if (neighborhood === NEIGHBORHOOD_NOT_FOUND && !customNeighborhoodValue) {
      return res.status(400).json({
        success: false,
        message: 'נא לכתוב את שם השכונה שלך.',
      });
    }

    // השכונה שתישמר: הטקסט החופשי כאשר נבחר "לא מצאתי", אחרת השכונה מהרשימה
    const finalNeighborhood =
      neighborhood === NEIGHBORHOOD_NOT_FOUND ? customNeighborhoodValue : neighborhood;

    const newDream = new LandingDream({
      childName,
      address: finalNeighborhood,
      email,
      phone,
      dreamDescription,
    });

    await newDream.save();
    appendLandingDream(newDream);
    console.log(`[Landing] Successfully saved new dream for: ${childName}`);
    return res.status(201).json({ success: true, message: 'החלום נשמר בהצלחה!' });

  } catch (error) {
    console.error('Error processing landing request:', error);
    return res.status(500).json({ success: false, message: 'אירעה שגיאה בשרת. נסו שוב.' });
  }
});

module.exports = router;
