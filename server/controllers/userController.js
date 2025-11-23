// controllers/userController.js

const User = require('../models/user'); 

// 🚀 ודא שהפונקציה מוגדרת ומיוצאת נכון!
exports.getRoleCounts = async (req, res) => {
    try {
        // [אופציונלי: בקרת הרשאות - לוודא שזה רק לאדמין]
        // if (req.user.role !== 'admin') { return res.status(403).json({ message: 'אין הרשאת גישה' }); }
        
        const pipeline = [
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ];

        const roleCounts = await User.aggregate(pipeline);

        res.status(200).json({ success: true, stats: roleCounts });

    } catch (error) {
        console.error('Aggregation Error (Roles):', error);
        res.status(500).json({ message: 'שגיאת שרת פנימית בטעינת סטטיסטיקה' });
    }
};


// ==========================================================
// 2. פונקציה לספירת סטודנטים בקורס (Students Per Course)
// ==========================================================
exports.getCourseStudentCounts = async (req, res) => {
    try {
        // [אופציונלי: בדיקת הרשאות Admin]
        
        // 🚀 ה-Pipeline שביקשת (שימוש ב-'$size' על מערך 'students')
        const pipeline = [
            {
                $project: {
                    _id: 0, // הסתרת ה-ID המקורי
                    courseId: "$_id",
                    title: "$title", // הוספת כותרת הקורס לצורך קריאות
                    numberOfStudents: { 
                        $size: "$students" 
                    }
                }
            },
            { $sort: { numberOfStudents: -1 } }
        ];

        // הרצת השאילתה על מודל הקורסים
        const studentCounts = await Course.aggregate(pipeline); 

        res.status(200).json({ 
            success: true, 
            courseStats: studentCounts 
        });

    } catch (error) {
        console.error('Aggregation Error (Students):', error);
        res.status(500).json({ message: 'שגיאה בטעינת סטטיסטיקת קורסים' });
    }
};

// ... ניתן להוסיף כאן פונקציות נוספות ...