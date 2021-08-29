const express = require('express');
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Authorization schema: Basic <credentials>
// base64 encoding for svl-be:uw123
const CRED = 'c3ZsLWJlOnV3MTIz';

router.post('/logUser', (req, res, next) => {
  if (!checkAuthHeader(req)) {
    res.status(401).json({'text': 'Authorization credentials are incorrect, please try again.'});
    return;
  }

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

/**
 * Checks to see if an object contains all of the keys in a list
 * @param {Object} obj Object to check the keys of
 * @param {Array} attrs List of attributes to check
 * @returns True if object contains all attributes, false otherwise
 */
function containsAttr(obj, attrs) {
  for(const attr of attrs) {
    if(!Object.keys(obj).includes(attr)) {
      return false;
    }
    return true;
  }
}

/**
 * Checks to see if a submitted request contains an authorization header
 * with the correct base64 credentials
 * @param {Object} req Request object submitted to a route
 * @returns true if auth check passes, false otherwise
 */
function checkAuthHeader(req) {
  let authValue = req.headers.authorization;

  return (authValue && (authValue === `Basic ${CRED}`));
}

module.exports = router;