const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// === הגבלת שליחת בקשות איפוס סיסמה ===
const forgotPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 דקות
  max: 3, // עד 3 בקשות בתקופה זו
  message: { message: 'יותר מדי בקשות איפוס סיסמה, נסה שוב מאוחר יותר.' }
});

// === הגדרת transporter למייל ===
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// === ולידציה של תעודת זהות ישראלית ===
const validateIsraeliID = (id) => {
  id = String(id).trim();
  if (id.length !== 9 || isNaN(id)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = Number(id[i]);
    let step = digit * ((i % 2) + 1);
    sum += step > 9 ? step - 9 : step;
  }
  return sum % 10 === 0;
};

// === ולידציה של אימייל ===
const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

// === רישום משתמש חדש ===
router.post('/register', async (req, res) => {
  try {
    const { idNumber, name, email, password } = req.body;

    if (!idNumber || !name || !email || !password) {
      return res.status(400).json({ message: 'נא למלא את כל השדות החובה' });
    }

    if (!validateIsraeliID(idNumber)) {
      return res.status(400).json({ message: 'תעודת זהות לא תקינה' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'אימייל לא תקין' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ idNumber }, { email }] 
    });

    if (existingUser) {
      if (existingUser.idNumber === idNumber) {
        return res.status(400).json({ message: 'תעודת זהות זו כבר רשומה במערכת' });
      }
      return res.status(400).json({ message: 'כתובת המייל כבר קיימת במערכת' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      idNumber,
      name,
      email,
      password: hashedPassword,
      role: 'student'
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, idNumber: newUser.idNumber, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'משתמש נרשם בהצלחה!',
      token,
      user: {
        id: newUser._id,
        idNumber: newUser.idNumber,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'שגיאה ברישום משתמש', error: error.message });
  }
});

// === התחברות ===
router.post('/login', async (req, res) => {
  try {
    const { idNumber, password } = req.body;

    if (!idNumber || !password) {
      return res.status(400).json({ message: 'נא למלא תעודת זהות וסיסמה' });
    }

    const user = await User.findOne({ idNumber });
    if (!user) {
      return res.status(400).json({ message: 'תעודת זהות או סיסמה שגויים' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'תעודת זהות או סיסמה שגויים' });
    }

    const token = jwt.sign(
      { userId: user._id, idNumber: user.idNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'התחברת בהצלחה!',
      token,
      user: {
        id: user._id,
        idNumber: user.idNumber,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'שגיאה בהתחברות', error: error.message });
  }
});

// === שכחתי סיסמה ===
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { idNumber } = req.body;

    if (!idNumber) {
      return res.status(400).json({ message: 'נא למלא תעודת זהות' });
    }

    if (!validateIsraeliID(idNumber)) {
      return res.status(400).json({ message: 'תעודת זהות לא תקינה' });
    }

    const user = await User.findOne({ idNumber });
    if (!user) {
      return res.status(400).json({ message: 'לא נמצא משתמש עם תעודת זהות זו' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // שעה
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${idNumber}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'איפוס סיסמה',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>שלום ${user.name},</h2>
          <p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
          <p>לחץ על הקישור הבא כדי לאפס את הסיסמה:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">איפוס סיסמה</a>
          <p>הקישור תקף למשך שעה אחת.</p>
          <p>אם לא ביקשת לאפס את הסיסמה, התעלם ממייל זה.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: `נשלח מייל לאיפוס סיסמה לכתובת: ${user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'שגיאה בשליחת מייל לאיפוס סיסמה', error: error.message });
  }
});

// === איפוס סיסמה ===
router.post('/reset-password', async (req, res) => {
  try {
    const { idNumber, token, newPassword } = req.body;

    if (!idNumber || !token || !newPassword) {
      return res.status(400).json({ message: 'חסרים נתונים' });
    }

    const user = await User.findOne({
      idNumber,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'הקישור לאיפוס סיסמה לא תקף או פג תוקפו' });
    }

    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenValid) {
      return res.status(400).json({ message: 'הקישור לאיפוס סיסמה לא תקף' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'הסיסמה עודכנה בהצלחה!' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'שגיאה באיפוס סיסמה', error: error.message });
  }
});

module.exports = router;
