// controllers/courseController.js

const Course = require('../models/course'); // ודא ייבוא מודל הקורס

exports.getCourseStudentCounts = async (req, res) => { // 👈 שימוש ב-exports
    try {
        // ... (לוגיקת ה-Aggregation שהצגתי לך קודם) ...
        const pipeline = [
            { $project: { _id: 0, courseId: "$_id", title: "$title", numberOfStudents: { $size: "$students" } } },
            { $sort: { numberOfStudents: -1 } }
        ];

        const studentCounts = await Course.aggregate(pipeline); 
        res.status(200).json({ success: true, courseStats: studentCounts });

    } catch (error) {
        console.error('Aggregation Error (Students):', error);
        res.status(500).json({ message: 'שגיאה בטעינת סטטיסטיקת קורסים' });
    }
};

// ...