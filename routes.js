const https = require('https');
const express = require('express');
const router = express.Router();
const logEntry = require('./db');

function initRoutes(options) {
  router.use(express.json());

  router.get('/', (req, res) => {
    res.send('Post a user entry at the /logUser endpoint');
  });

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

        let item = await logEntry(userData);
        if (item.statusCode >= 200 && item.statusCode < 300) {
          res.json(userData);
        } else {
          res.status(500).json({
            "text": "There was an error inserting the data into the database, please check Azure logs"
          });
        }
      }
    }
  });

  /**
   * Gets the student's RegId for a given a mag strip code
   * @param {string} magStripCode The mag strip code to get information for
   * @returns A Promise with the student's regId or an error
   */
  function getStudentRegId(magStripCode) {
    return new Promise((resolve, reject) => {
      options.path = `/idcard/v1/card.json?mag_strip_code=${magStripCode}`

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
      options.path = `/student/v5/person.json?reg_id=${regId}`

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

  return router;
}

module.exports = initRoutes;