const { addLogin, getAllLogins, getLoginsByDate, getLoginsByStudent } = require('../db/logins');
const { UserLogin } = require('../models/UserLogin');
const { getStudentInfo } = require('../services/person-search-api');
const { searchCard } = require('../services/id-card-api');
const express = require('express');

const router = express.Router();
router.use(express.json());

router.get('/logins', async (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
    if (startDate == undefined) {
      const data = await getAllLogins(req.database);
      res.json(data);
    } else {
      if (endDate == undefined) {
        const data = await getLoginsByDate(new Date(startDate), null, req.database);
        res.json(data);
      } else {
        const data = await getLoginsByDate(new Date(startDate), req.database, new Date(endDate));
        res.json(data);
      }
    }

  } catch (e) {
    res.status(500).send(`There was an error getting the information you requested: ${e}`);
  }
});

router.get('/logins/:studentNumber', async (req, res) => {
  const studentNumber = req.params.studentNumber;

  const results = await getLoginsByStudent(studentNumber, req.database);

  res.json(results);
});

router.post('/logins', async (req, res) => {
  const studentIdentifierType = req.body.identifierType;
  const studentIdentifier = req.body.identifier;
  let student;

  if (req.body.reason === undefined) {
    res.status(400).send('Reason not specified in request body');
    return;
  } else if (studentIdentifier === undefined) {
    res.status(400).send('Student identifier not specified in request body');
  }

  try {
    if (studentIdentifierType === 'magStripCode') {
      const regex = new RegExp('.{14}');

      if (!regex.test(studentIdentifier)) {
        throw new Error(`Identifier ${studentIdentifier} is invalid for type ${studentIdentifierType}`);
      }

      const regId = await searchCard(req.body.identifier, 'mag_strip_code');
      student = await getStudentInfo(regId);
    } else if (studentIdentifierType === 'uwNetId') {
      student = await getStudentInfo(req.body.identifier, 'net_id');
    } else if (studentIdentifierType === 'studentId') {
      const regex = new RegExp('[0-9]{7}');
      
      if (!regex.test(studentIdentifier)) {
        throw new Error(`Identifier ${studentIdentifier} in invalid for type ${studentIdentifierType}`);
      }

      student = await getStudentInfo(req.body.identifier, 'student_number');  
    } else {
      throw new Error(`Identifier type ${req.body.identifierType} is not one of magStripCode, uwNetId, or studentId`);
    }
  } catch (error) {
    console.error(error.message);
    res.status(400).send(error.message);
    return;
  }

  const userLogin = new UserLogin(student, req.body.reason);
  const item = await addLogin(userLogin, req.database);

  if (item.statusCode >= 200 && item.statusCode < 300) {
    res.json(userLogin);
  } else {
    res.status(500).send('There was an error inserting the data into the database, please check Azure logs');
  }
});

module.exports = router;
 