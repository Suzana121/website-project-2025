// routes/users.js

const express = require('express');
const router = express.Router();

// 💡 ייבוא ה-Controller וה-Middleware בראש הקובץ
const userController = require('../controllers/userController'); 
const { authenticateToken, isAdmin } = require('../middleware/authM');

// ----------------------------------------------------

// 1. נתיב בדיקה מתוקן (נתיב מלא: /api/users/test)
router.get('/test', (req, res) => {
  res.send('Users route working!');
});

// 2. 🚀 נתיב ה-Aggregation (נתיב מלא: /api/users/roles/count)
// משתמשים ב-Middleware לאימות, ואז בפונקציה מה-Controller
router.get('/roles/count', authenticateToken, isAdmin, userController.getRoleCounts);
module.exports = router;