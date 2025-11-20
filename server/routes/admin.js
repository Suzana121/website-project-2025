const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 

// ⬅️ ודא שהנתיבים כוללים .js או שהם נכונים
const Course = require('../models/course.js'); 
const User = require('../models/user.js');   

// ==================================================================
// Middleware: אימות והרשאות (Defined Locally)
// ==================================================================

// פונקציה לבדיקת טוקן JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'נדרש טוקן אימות (401)' });

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => { 
        if (err) return res.status(403).json({ message: 'טוקן לא תקין או פג תוקף (403)' });
        req.user = user;
        next();
    });
};

// פונקציה לבדיקת תפקיד 'admin'
const checkAdminRole = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'נדרשת הרשאת מנהל (Admin)' });
    }
};

// 🛑 הפעלת ה-Middleware על כל הראוטר פעם אחת!
router.use(authenticateToken, checkAdminRole);

// ==================================================================
// I. ניהול משתמשים (Users) 
// ==================================================================

// GET /api/admin/users - שליפת כל המשתמשים
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password') 
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error('שגיאת שרת: GET /api/admin/users', error);
        res.status(500).json({ message: 'שגיאת שרת בשליפת משתמשים' });
    }
});

// PUT /api/admin/users/:id/role - עדכון תפקיד המשתמש
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        
        // ✅ עדכון: ודא שהתפקיד הוא רק אחד מהתפקידים הקיימים במערכת
        if (!['admin', 'student'].includes(role)) {
            return res.status(400).json({ message: 'תפקיד לא חוקי. התפקידים המותרים הם: admin או student' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { role: role }, 
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'המשתמש לא נמצא' });
        }

        res.json({ message: `התפקיד עודכן ל: ${updatedUser.role}`, user: updatedUser });
    } catch (error) {
        console.error('שגיאת שרת: PUT /api/admin/users/:id/role', error);
        res.status(400).json({ message: 'שגיאה בעדכון תפקיד: ' + error.message });
    }
});

// DELETE /api/admin/users/:id - מחיקת משתמש
router.delete('/users/:id', async (req, res) => {
    try {
        // מניעת מחיקה עצמית של המנהל המחובר
        if (req.user.userId === req.params.id) {
            return res.status(400).json({ message: 'אין אפשרות למחוק את חשבון המנהל המחובר כרגע' });
        }
        
        const result = await User.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ message: 'המשתמש לא נמצא' });
        }

        // הסרת המשתמש מכל הקורסים שנרשם אליהם (שלמות נתונים)
        await Course.updateMany(
            { students: req.params.id }, 
            { $pull: { students: req.params.id } }
        );
        
        res.json({ message: 'המשתמש נמחק בהצלחה!' });
    } catch (error) {
        console.error('שגיאת שרת: DELETE /api/admin/users/:id', error);
        res.status(500).json({ message: 'שגיאה במחיקת משתמש' });
    }
});


// ==================================================================
// II. ניהול קורסים (Courses) 
// ==================================================================

// GET /api/admin/courses - שליפת כל הקורסים לניהול
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(courses); 
    } catch (error) {
        console.error('שגיאת שרת: GET /api/admin/courses', error);
        res.status(500).json({ message: 'שגיאת שרת בשליפת קורסים' });
    }
});

// POST /api/admin/courses - יצירת קורס חדש
router.post('/courses', async (req, res) => {
    try {
        const { title, tagline, description, price, image } = req.body;
        
        // המנהל הוא האינסטרקטור
        const newCourse = new Course({
            title, tagline, description, price, image,
            instructor: req.user.userId, 
            students: []
        });
        await newCourse.save();
        res.status(201).json({ message: 'הקורס נוצר בהצלחה!', course: newCourse });
    } catch (error) {
        console.error('שגיאת שרת: POST /api/admin/courses', error);
        res.status(400).json({ message: 'שגיאה ביצירת קורס: ' + error.message });
    }
});

// PUT /api/admin/courses/:id - עדכון קורס
router.put('/courses/:id', async (req, res) => {
    try {
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: 'הקורס לא נמצא' });
        }

        res.json({ message: 'הקורס עודכן בהצלחה!', course: updatedCourse });
    } catch (error) {
        console.error('שגיאת שרת: PUT /api/admin/courses/:id', error);
        res.status(400).json({ message: 'שגיאה בעדכון קורס: ' + error.message });
    }
});

// DELETE /api/admin/courses/:id - מחיקת קורס
router.delete('/courses/:id', async (req, res) => {
    try {
        const result = await Course.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ message: 'הקורס לא נמצא' });
        }

        res.json({ message: 'הקורס נמחק בהצלחה!' });
    } catch (error) {
        console.error('שגיאת שרת: DELETE /api/admin/courses/:id', error);
        res.status(500).json({ message: 'שגיאה במחיקת קורס' });
    }
});


module.exports = router;