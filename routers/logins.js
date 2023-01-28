const { addLogin, getAllLogins, getLoginsByDate, getLoginsByStudent } = require('../db/logins');
const UserLogin = require('../models/UserLogin');
const { getStudentRegId, getStudentInfo } = require('../services/person-search-api');
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
  let student;

  try {
    if (req.body.reason === undefined) {
      res.status(400).json({ 'text': 'Please include a reason with the request body'});
      return;
    }

    switch (req.body.identifierType) {
    case 'magStripCode':
      const regId = await getStudentRegId(req.body.identifier);
      student = await getStudentInfo(regId);
      break;
    case 'uwNetId':
      student = await getStudentInfo(req.body.identifier, type='net_id');
      break;
    case 'studentId':
      student = await getStudentInfo(req.body.identifier, type='student_number');
      break;
    default:
      console.error(`Identifier type ${req.body.identifierType} is not one of magStripCode, uwNetId, or studentId`);
      res.status(400).send(`Identifier type ${req.body.identifierType} is not one of magStripCode, uwNetId, or studentId`);
      return;
    }

  } catch (error) {
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
 