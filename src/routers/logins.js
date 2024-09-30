/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains a router to retrieve and create login events
 */
const { addLogin, getAllLogins, getLoginsByDate, getLoginsByStudent } = require('../db/logins');
const { UserLogin } = require('../core/UserLogin');
const { getStudentInfo } = require('../services/person-search-api');
const { searchCard } = require('../services/id-card-api');
const express = require('express');
const { isAuthenticated, isAuthorized } = require('../utilities/auth');

const router = express.Router();
router.use(express.json());

// All get requests in this router must be protected by
// auth challenge as login information can contain FERPA
// sensitive information
router.get('/logins*', (req, res, next) => {
  if (!isAuthenticated(req)) {
    return res.redirect('/auth/signin');
  }

  if (!isAuthorized(req, 'Login.Read')) {
    return res.status(401).send('You do not have the valid permissions to view logins');
  }

  next();
});

router.get('/logins', async (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
    if (startDate == undefined) {
      const data = await getAllLogins(req.database);
      res.json(data);
    } else {
      if (endDate == undefined) {
        const data = await getLoginsByDate(new Date(startDate), req.database);
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

  if (req.body.reasons === undefined || req.body.reasons.length === 0) {
    res.status(400).send('Reason not specified in request body');
    return;
  } else if (studentIdentifier === undefined) {
    res.status(400).send('Student identifier not specified in request body');
    return;
  }

  const identifierMappings = {
    'magStripCode': 'mag_strip_code',
    'proxRfid': 'prox_rfid',
    'uwNetId': 'net_id',
    'studentId': 'student_number'
  };

  if (!Object.keys(identifierMappings).includes(studentIdentifierType)) {
    res.status(400).send(`Identifier type ${studentIdentifierType} is not one of magStripCode, uwNetId, proxRfid, or studentId`);
    return;
  }

  try {
    let identiferIsValid = true;
    const sidRegex = new RegExp('[0-9]{7}');

    if (studentIdentifierType === 'magStripCode' && !(studentIdentifier.length === 14)) identiferIsValid = false;
    if (studentIdentifierType === 'proxRfid' && !(studentIdentifier.length === 16)) identiferIsValid = false;
    if (studentIdentifierType === 'studentId' && !sidRegex.test(studentIdentifier)) identiferIsValid = false;

    if (!identiferIsValid) {
      console.log(`Identifier ${studentIdentifier} is invalid for type ${studentIdentifierType}`);
      res.status(400).send(`Identifier ${studentIdentifier} is invalid for type ${studentIdentifierType}`);
      return;
    }


    if (studentIdentifierType === 'magStripCode' || studentIdentifierType === 'proxRfid') {
      console.log(`Performing search for identifier ${studentIdentifier} using type ${studentIdentifierType}`);
      const regId = await searchCard(studentIdentifier, identifierMappings[studentIdentifierType]);
      
      console.log(`Retrieving student information for identifier ${regId} using type reg_id`);
      student = await getStudentInfo(regId);
    } else {
      console.log(`Retrieving student information for identifier ${studentIdentifier} using type ${identifierMappings[studentIdentifierType]}`);
      student = await getStudentInfo(studentIdentifier, identifierMappings[studentIdentifierType]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
    return;
  }

  const userLogin = new UserLogin(student, req.body.reasons);
  const item = await addLogin(userLogin, req.database);

  if (item.statusCode >= 200 && item.statusCode < 300) {
    res.json(userLogin);
  } else {
    res.status(500).send('There was an error inserting the data into the database, please check Azure logs');
  }
});

module.exports = router;
 