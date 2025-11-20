const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // שדות קריטיים: title ו-description
  title: {
    type: String,
    required: true, // חובה
    trim: true,
    unique: true // מונע קורסים עם אותו שם
  },
  
  // ✅ חדש: נדרש לראוטר ה-Admin (POST)
  tagline: {
    type: String,
    required: true,
    maxlength: 100 // כותרת קצרה למשיכת תשומת לב
  },
  
  description: {
    type: String,
    required: true,
    minlength: 20
  },

  // ✅ חדש: נדרש לראוטר ה-Admin (POST)
  image: {
    type: String,
    default: 'https://via.placeholder.com/600x400' // תמונת ברירת מחדל
  },

  // שדות לוגיים וקישורים
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true // חובה שיהיה מורה
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

}, { 
  timestamps: true // מתי נוצר הקורס ומתי עודכן לאחרונה
});

module.exports = mongoose.model('Course', courseSchema);