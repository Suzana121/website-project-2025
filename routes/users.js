const express = require('express');
const router = express.Router();

router.get('/api/users/test', (req, res) => {
  res.send('Users route working!');
});

module.exports = router;