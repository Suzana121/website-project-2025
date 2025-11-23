const express = require('express');
const router = express.Router();
const Course = require('../models/course.js');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');

// 💡 הוספה חדשה: ייבוא ה-Controller לקורסים
// ודא שהנתיב הזה נכון לקובץ ה-Controller שלך (controllers/courseController.js)
const courseController = require('../controllers/courseController'); 

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
      return res.status(403).json({ message: 'טוקן לא תקין או פג תוקף' });
    }
    req.user = user;
    next();
  });
};

// ----------------------------------------------------
// 🚀 נתיב חדש: GET /api/courses/stats/students
// סטטיסטיקה של מספר הסטודנטים בכל קורס (מיועד לאדמין)
// ----------------------------------------------------
router.get('/stats/students', authenticateToken, courseController.getCourseStudentCounts); 
// הערה: מומלץ להוסיף כאן מידלוור לבדיקת הרשאת אדמין בנוסף ל-authenticateToken.

// ----------------------------------------------------
// 🎯 GET /api/courses/all-available - מחזיר את כל הקורסים הזמינים לרכישה
// ----------------------------------------------------
router.get('/all-available', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .select('_id title tagline price description students image')
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
        const userId = req.user.userId;
        const { courseIds } = req.body;

        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'לא נשלחו קורסים לרכישה' 
            });
        }

        const courses = await Course.find({ _id: { $in: courseIds } });

        if (courses.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'הקורסים לא נמצאו' 
            });
        }
        
        const coursesToEnroll = courses.filter(course => {
            return course.students && !course.students.some(studentId => studentId.toString() === userId);
        });
        
        if (coursesToEnroll.length === 0) {
             return res.status(200).json({
                success: true,
                message: 'המשתמש כבר רשום לכל הקורסים שנבחרו.',
                courses: courses,
                count: courses.length
            });
        }

        const enrollPromises = coursesToEnroll.map(course => {
             return Course.updateOne(
                 { _id: course._id },
                 { $push: { students: userId } }
             );
        });

        await Promise.all(enrollPromises);
        
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
// 👁️ GET /api/courses/:id - מחזיר קורס בודד
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

    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'admin') {
      return res.json({
        success: true,
        course: course,
        isEnrolled: true,
        isAdmin: true
      });
    }

    const isEnrolled = course.students.map(id => id.toString()).includes(userId);

    if (!isEnrolled) {
        return res.status(403).json({ 
            success: false, 
            message: 'אינך רשאי לצפות בתוכן זה. נא לרכוש את הקורס.',
            isEnrolled: false
        });
    }

    res.json({
      success: true,
      course: course,
      isEnrolled: true
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