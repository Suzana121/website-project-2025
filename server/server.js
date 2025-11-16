require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());

// בדיקת CORS זמנית (פחות מאובטח, רק כדי לזהות את הבעיה)
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: false // השבתת credentials
}));

// חיבור למסד הנתונים
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/admin', adminRoutes);

// בדיקת שרת
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Server.js
// ...
const PORT = process.env.PORT || 8000; // שנה מ-5000 ל-8000 (או 3001)
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
