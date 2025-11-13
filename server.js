// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ייבוא ראוטים
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');

const app = express();
app.use(express.json());
app.use(cors());

// ראוט בסיסי לבדיקה
app.get('/', (req, res) => {
  res.send('✅ Server is running!');
});

// שימוש בראוטים
app.use('/users', usersRoutes);
app.use('/courses', coursesRoutes);

// חיבור למסד נתונים
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// הפעלת השרת
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
