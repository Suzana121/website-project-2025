require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// ==========================================================
// 1. הגדרת האפליקציה (חייב להיות ראשון!)
const app = express();
// ==========================================================


// ----------------------------------------------------------
// 2. הגדרת Middlewares
// ----------------------------------------------------------

// מאפשר ל-Express לטפל בנתוני JSON שנשלחים ב-Body
app.use(express.json());

// הגדרת CORS - מאפשר גישה מכל דומיין (כוכבית)
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: false
}));

// הגשת קבצים סטטיים מתיקיית client
// זה מאפשר לגשת לקבצים כמו index.html, admin.js, CSS וכו'.
// path.join מבטיח שהנתיב יעבוד נכון בכל מערכת הפעלה.
app.use(express.static(path.join(__dirname, '../client')));


// ----------------------------------------------------------
// 3. חיבור למסד הנתונים
// ----------------------------------------------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// ----------------------------------------------------------
// 4. Routes של API - חיבור קבצי הראוטר
// ----------------------------------------------------------
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const adminRoutes = require('./routes/admin');

// חיבור הראוטרים לנתיבי הבסיס שלהם
app.use('/api/auth', authRoutes);     // לוגין, הרשמה
app.use('/api/courses', coursesRoutes); // קורסים ציבוריים ושלי
app.use('/api/admin', adminRoutes);   // ניהול קורסים ומשתמשים

// Route בסיסי לבדיקה
app.get('/api', (req, res) => {
  res.send('Server is running!');
});


// ----------------------------------------------------------
// 5. הרצת השרת
// ----------------------------------------------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving static files from: ${path.join(__dirname, '../client')}`);
  console.log(`🌐 Open: http://localhost:${PORT}/login.html`);
  console.log(`🔧 API available at: http://localhost:${PORT}/api`);
});