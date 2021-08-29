const express = require('express');
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

let containsAttr = (obj, attrs) => {
  for(const attr of attrs) {
    if(!Object.keys(obj).includes(attr)) {
      return false;
    }
    return true;
  }
}

router.post('/logUser', (req, res) => {
  let userData = req.body;
  let requiredAttrs = ['name', 'netid', 'sid', 'reason']

  if (containsAttr(userData,  requiredAttrs)) {
    let now  = new Date();
    userData.timestamp = now.toISOString();
    userData.text = `User entry successfully recorded for ${userData.name} at ${now.toString()}`;
    res.status(200).json(userData);
  } else {
    res.status(400).send({
      'text': 'Please make sure you include all attributes for this request'
    });
  }
});

module.exports = router;