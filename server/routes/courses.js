const express = require('express');
const router = express.Router(); // הגדרת אובייקט הראוטר (חיוני!)
const Course = require('../models/course.js');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');

// ----------------------------------------------------
// Middleware: אימות JWT (authenticateToken)
// ----------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'נדרש טוקן אימות' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      // אם הטוקן פג תוקף או אינו תקין
      return res.status(403).json({ message: 'טוקן לא תקין או פג תוקף' });
    }
    // הטוקן תקין, מוסיפים את נתוני המשתמש לבקשה
    req.user = user;
    next();
  });
};

// ----------------------------------------------------
// 🎯 GET /api/courses/all-available - מחזיר את כל הקורסים הזמינים לרכישה
// ----------------------------------------------------
router.get('/all-available', async (req, res) => {
  try {
    // שליפת כל הקורסים מהדאטה בייס ללא צורך באימות (פומבי)
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .select('_id title tagline price description students image') // שדות חשובים ל-Frontend
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      courses: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('שגיאה בשליפת כל הקורסים הזמינים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשליפת הקורסים הזמינים' 
    });
  }
});

// ----------------------------------------------------
// 📦 POST /api/courses/purchase - רכישת קורסים (עם סינון רכישה כפולה)
// ----------------------------------------------------
router.post('/purchase', authenticateToken, async (req, res) => {
    try {
        // userId מגיע מה-JWT
        const userId = req.user.userId;
        const { courseIds } = req.body;

        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'לא נשלחו קורסים לרכישה' 
            });
        }

        // 1. מציאת כל הקורסים מתוך הרשימה שנשלחה
        const courses = await Course.find({ _id: { $in: courseIds } });

        if (courses.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'הקורסים לא נמצאו' 
            });
        }
        
        // 2. סינון הקורסים: מוצאים רק את אלה שהמשתמש עדיין לא רשום אליהם
        const coursesToEnroll = courses.filter(course => {
            // ממיר את ה-ObjectIDs שבמערך students למחרוזות לצורך השוואה
            return course.students && !course.students.some(studentId => studentId.toString() === userId);
        });
        
        if (coursesToEnroll.length === 0) {
             return res.status(200).json({
                success: true,
                message: 'המשתמש כבר רשום לכל הקורסים שנבחרו.',
                courses: courses, // מחזיר את רשימת הקורסים המלאה לצורך עדכון ה-UI
                count: courses.length
            });
        }

        // 3. עדכון ה-DB: מוסיף את המשתמש לכל קורס חדש שנבחר
        const enrollPromises = coursesToEnroll.map(course => {
             // שימוש ב-$push יעיל ואטומי
             return Course.updateOne(
                 { _id: course._id },
                 { $push: { students: userId } }
             );
        });

        await Promise.all(enrollPromises);
        
        // 4. שליפת הנתונים המעודכנים של כל הקורסים שנשלחו
        const purchasedCourses = await Course.find({ _id: { $in: courseIds } })
            .populate('instructor', 'name email');

        res.json({
            success: true,
            message: `נרכשו ${coursesToEnroll.length} קורסים חדשים בהצלחה!`,
            courses: purchasedCourses,
            count: purchasedCourses.length
        });

    } catch (error) {
        console.error('❌ שגיאה ברכישת קורסים:', error);
        res.status(500).json({ 
            success: false, 
            message: 'שגיאה ברכישת הקורסים: ' + error.message 
        });
    }
});

// ----------------------------------------------------
// 📝 GET /api/courses/my-courses - מחזיר את כל הקורסים של המשתמש המחובר
// ----------------------------------------------------
router.get('/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // מוצא את כל הקורסים שהמשתמש רשום בהם (היכן ששדה students מכיל את ה-userId)
    const courses = await Course.find({ students: userId })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      courses: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('שגיאה בשליפת קורסים של משתמש:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשליפת הקורסים' 
    });
  }
});


// ----------------------------------------------------
// 👁️ GET /api/courses/:id - מחזיר קורס בודד (לדף single-course)
// ----------------------------------------------------
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
    const isEnrolled = course.students.map(id => id.toString()).includes(req.user.userId);

    res.json({
      success: true,
      course: course,
      isEnrolled: isEnrolled
    });
  } catch (error) {
    console.error('שגיאה בשליפת קורס בודד:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשליפת הקורס' 
    });
  }
});


// ----------------------------------------------------
// 🏠 GET /api/courses - מחזיר את כל הקורסים (לדף הבית - פומבי)
// ----------------------------------------------------
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
    console.error('שגיאה בשליפת קורסים לדף הבית:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשליפת הקורסים' 
    });
  }
});

module.exports = router;