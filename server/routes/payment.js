// server/routes/payment.js
const express = require("express");
const router = express.Router();

// תשלום "דמוי" – בלי חיבור לחברת סליקה אמיתית
router.post("/", (req, res) => {
  // כאן אפשר לקרוא את פרטי ההזמנה:
  // const { courseId, price, paymentMethod } = req.body;

  // כרגע – רק מחזירים הצלחה "מדומה"
  res.json({
    success: true,
    message: "התשלום בוצע בהצלחה (סימולציה)",
  });
});

module.exports = router;