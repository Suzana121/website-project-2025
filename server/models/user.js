const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  idNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // בדיקה שזה מספר של 9 ספרות בלבד
        return /^\d{9}$/.test(v);
      },
      message: 'תעודת זהות חייבת להכיל 9 ספרות'
    }
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['student', 'instructor'],
    default: 'student'
  },

  // שדות לאיפוס סיסמה
  resetPasswordToken: {
    type: String,
    default: null
  },

  resetPasswordExpires: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

// כדי להימנע משגיאה בנודמונ עם import כפול של המודל
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
