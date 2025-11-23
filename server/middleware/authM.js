const jwt = require('jsonwebtoken');

// ----------------------------------------------------
// 1. Middleware לאימות טוקן
// ----------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'נדרש טוקן אימות' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      // אם הטוקן פג תוקף או אינו תקין
      return res.status(403).json({ message: 'טוקן לא תקף' });
    }
    req.user = user; // מוסיף את פרטי המשתמש (role, userId וכו') ל-request
    next();
  });
};

// ----------------------------------------------------
// 2. Middleware לבדיקת הרשאות (Role Checkers)
// ----------------------------------------------------

// Middleware לבדיקת הרשאות תלמיד
const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') { // 👈 ודא שאת בודקת קודם ש-req.user קיים
    next();
  } else {
    return res.status(403).json({ message: 'גישה מוגבלת לתלמידים בלבד' });
  }
};

// 🚀 הוספה 1: Middleware לבדיקת הרשאות מורה/מדריך
const isInstructor = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    return res.status(403).json({ message: 'גישה מוגבלת למדריכים בלבד' });
  }
};

// 🚀 הוספה 2: Middleware לבדיקת הרשאות מנהל (תצטרכי את זה ל-admin.js)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'גישה מוגבלת למנהלים בלבד' });
  }
};


// ----------------------------------------------------
// 3. ייצוא הפונקציות
// ----------------------------------------------------
module.exports = {
  authenticateToken,
  isInstructor, // 👈 עכשיו הפונקציה מוגדרת!
  isStudent,
  isAdmin     // 👈 ייצוא נוסף שימושי
};