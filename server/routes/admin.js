const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { authenticateToken } = require('../middleware/authM');

// Middleware לבדיקה שהמשתמש הוא Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'גישה מוגבלת למנהלים בלבד' });
  }
  next();
};

// קבלת כל המשתמשים (רק Admin)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // בלי הסיסמה
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת משתמשים', error: error.message });
  }
});

// שינוי תפקיד משתמש (רק Admin)
router.put('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // בדיקה שהתפקיד תקין
    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'תפקיד לא תקין' });
    }

    // מציאת המשתמש ועדכון התפקיד
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    user.role = role;
    await user.save();

    res.json({ 
      message: `תפקיד המשתמש עודכן בהצלחה ל-${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'שגיאה בעדכון תפקיד', error: error.message });
  }
});

// מחיקת משתמש (רק Admin)
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // לא לאפשר למחוק את עצמו
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'לא ניתן למחוק את המשתמש שלך' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    res.json({ message: 'משתמש נמחק בהצלחה' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'שגיאה במחיקת משתמש', error: error.message });
  }
});

module.exports = router;