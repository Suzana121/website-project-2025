require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());

// הגדרת CORS
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: false
}));

// הגשת קבצים סטטיים מתיקיית client
// זה מאפשר לגשת לכל קבצי ה-HTML, CSS, JS ישירות דרך השרת
app.use(express.static(path.join(__dirname, '../client')));

// חיבור למסד הנתונים
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes של API
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/admin', adminRoutes);

// Route בסיסי לבדיקה
app.get('/api', (req, res) => {
  res.send('Server is running!');
});

// שרת ישמש גם את הקבצים הסטטיים וגם את ה-API
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving static files from: ${path.join(__dirname, '../client')}`);
  console.log(`🌐 Open: http://localhost:${PORT}/login.html`);
  console.log(`🔧 API available at: http://localhost:${PORT}/api`);
});