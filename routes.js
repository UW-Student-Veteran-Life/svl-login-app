const https = require('https');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const mongoDb = require('./db');

router.use(express.json());

// Authorization schema: Basic <credentials>
// base64 encoding for svl-be:uw123
const CRED = 'c3ZsLWJlOnV3MTIz';

router.use((req, res, next) => {
  if (!checkAuthHeader(req)) {
    res.status(401).json({'text': 'Authorization credentials are incorrect, please try again.'});
  } else {
    next();
  }
})

router.post('/logUser', async (req, res) => {
  let magStripCode = req.body.magStripCode;
  regId = await getStudentRegId(magStripCode)
    .catch(err => {
      console.log(`MagStripCode: ${magStripCode}`);
      console.log(`Response: ${err}`);
      res.status(400).json({
        'text': err
      });
    });

  if (regId !== undefined) {
    studentInfo = await getStudentInfo(regId)
    .catch(err => {
      console.log(`Reg ID:  ${regId}`);
      console.log(`Response: ${err}`);
      res.status(400).json({
        'text': err
      });
    });

    if (studentInfo !== undefined) {
      userData = {
        name: studentInfo.StudentName,
        netid: studentInfo.UWNetID,
        sid: studentInfo.StudentNumber,
        reason: req.body.reason
      }

      let now = new Date();
      userData.timestamp = now.toISOString();
      userData.text = `${userData.name} has successfully signed in at ${now.toString()}`;

      mongoDb.connect(async (err, db) => {
        if (err) throw err;
        let logins = db.db('SVL-Logins').collection('Logins');
        await logins.insertOne(userData);
        await mongoDb.close();
      });

      res.json(userData);
    }
  }
});

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

/**
 * Gets the student's RegId for a given a mag strip code
 * @param {string} magStripCode The mag strip code to get information for
 * @returns A Promise with the student's regId or an error
 */
function getStudentRegId(magStripCode) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `wseval.s.uw.edu`,
      method: 'GET',
      path: `/idcard/v1/card.json?mag_strip_code=${magStripCode}`,
      key: fs.readFileSync('certs/ssl/svlcardreader_vetlife_washington_edu.key.pem'),
      cert: fs.readFileSync('certs/ssl/svlcardreader_vetlife_washington_edu.crt.pem'),
      agent: false
    }

    const req = https.request(options, (res) => {
      res.setEncoding('utf-8');
      res.on('data', data => {
        jsonData = JSON.parse(data);
        if (res.statusCode != 200) {
          reject(jsonData.StatusDescription);
        } else {
          resolve(jsonData.Cards[0].RegID);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Gets a students information from their regId
 * @param {string} regId RegId belonging to a student
 * @returns A Promise with the student's information or an error
 */
function getStudentInfo(regId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `wseval.s.uw.edu`,
      method: 'GET',
      path: `/student/v5/person.json?reg_id=${regId}`,
      key: fs.readFileSync('certs/ssl/svlcardreader_vetlife_washington_edu.key.pem'),
      cert: fs.readFileSync('certs/ssl/svlcardreader_vetlife_washington_edu.crt.pem'),
      agent: false
    }

    const req = https.request(options, res => {
      res.setEncoding('utf-8');
      res.on('data',  data => {
        jsonData = JSON.parse(data);
        if (res.statusCode != 200) {
          reject(jsonData.StatusDescription);
        } else {
          resolve(jsonData.Persons[0]);
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.end();
  });
}

module.exports = router;