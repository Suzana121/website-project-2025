
const User = require('../models/user'); // מודל המשתמש

exports.getRoleCounts = async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$role", // הקיבוץ לפי תפקיד
                    count: { $sum: 1 } // ספירת כל מופע
                }
            },
            { $sort: { count: -1 } } // מיון
        ];

        const roleCounts = await User.aggregate(pipeline);

        // מחזיר את הנתונים המחושבים כ-JSON
        res.status(200).json({ success: true, stats: roleCounts }); 

    } catch (error) {
        console.error("❌ שגיאה ב-Aggregation של תפקידים:", error);
        res.status(500).json({ success: false, message: "שגיאת שרת פנימית" });
    }
};