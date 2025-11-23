const mongoose = require('mongoose');

// 1. הגדרת סכמת משנה לשיעור בודד (LESSON SCHEMA)
// זה המבנה של כל פריט בפלייליסט
const lessonSchema = new mongoose.Schema({
    lessonId: { type: String, required: true },
    title: { type: String, required: true },
    duration: { type: String, default: '00:00' },
    videoId: { type: String, required: true }, // מזהה ה-YouTube הקריטי
}, { _id: false }); // אנו לא צריכים ID נפרד לכל שיעור במערך


// 2. סכמת הקורס הראשית (COURSE SCHEMA)
const courseSchema = new mongoose.Schema({
    // שדות קריטיים
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    
    tagline: {
        type: String,
        required: true,
        maxlength: 100
    },
    
    description: {
        type: String,
        required: true,
        minlength: 20
    },

    image: {
        type: String,
        default: 'https://via.placeholder.com/600x400'
    },

    // שדות לוגיים וקישורים
    instructor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    
    price: {
        type: Number,
        required: true,
        min: 0
    },
    
    // מערך הסטודנטים הרשומים
    students: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    
    // ⭐️ זהו השדה החדש שמאחסן את הפלייליסט הדינמי
    courseContent: [lessonSchema], // מערך של שיעורים (LessonSchema)

}, { 
    timestamps: true // מתי נוצר הקורס ומתי עודכן לאחרונה
});

module.exports = mongoose.model('Course', courseSchema);