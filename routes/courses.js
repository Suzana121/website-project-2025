const express = require('express');
const router = express.Router();

router.get('/api/courses/test', (req, res) => {
  res.send('Courses route working!');
});

module.exports = router;