const express = require('express');
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post('/logUser', (req, res) => {
  console.log(req.body)
  res.send('I am working!');
});

module.exports = router;