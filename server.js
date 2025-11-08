const express = require('express');
const app = express();
const PORT = 3000;

// ייבוא הראוטים
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');

// שימוש בראוטים
app.use(usersRoutes);
app.use(coursesRoutes);

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});