const express = require('express');
const router = express.Router();
const Course = require('../models/course.js');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');

// Middleware לאימות JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'נדרש טוקן אימות' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'טוקן לא תקין' });
    }
    req.user = user;
    next();
  });
};

// GET /api/courses/my-courses - מחזיר את כל הקורסים של המשתמש המחובר
router.get('/my-courses', authenticateToken, async (req, res) => {
  try {
const userId = req.user.userId;

    // מוצא את כל הקורסים שהמשתמש רשום בהם
    const courses = await Course.find({ students: userId })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      courses: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('שגיאה בשליפת קורסים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשליפת הקורסים' 
    });
  }
});

// GET /api/courses/:id - מחזיר קורס בודד
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'הקורס לא נמצא' 
      });
    }

    // בדיקה אם המשתמש רשום לקורס
    const isEnrolled = course.students.includes(req.user.id);

    res.json({
      success: true,
      course: course,
      isEnrolled: isEnrolled
    });
  } catch (error) {
    console.error('שגיאה בשליפת קורס:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשליפת הקורס' 
    });
  }
});

// GET /api/courses - מחזיר את כל הקורסים (לעמוד הבית)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      courses: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('שגיאה בשליפת קורסים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשליפת הקורסים' 
    });
  }
});

module.exports = router;