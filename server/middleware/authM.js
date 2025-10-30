const jwt = require('jsonwebtoken');

// Middleware לאימות משתמש
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'נדרש טוקן אימות' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'טוקן לא תקף' });
    }
    req.user = user; // מוסיף את פרטי המשתמש ל-request
    next();
  });
};

// Middleware לבדיקת הרשאות מדריך
const isInstructor = (req, res, next) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'גישה מוגבלת למדריכים בלבד' });
  }
  next();
};

// Middleware לבדיקת הרשאות תלמיד
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'גישה מוגבלת לתלמידים בלבד' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isInstructor,
  isStudent
};

// דוגמה לשימוש ב-route:
// const { authenticateToken, isInstructor } = require('./middleware/auth');
// app.get('/api/instructor-only', authenticateToken, isInstructor, (req, res) => {
//   res.json({ message: 'זה route רק למדריכים' });
// });