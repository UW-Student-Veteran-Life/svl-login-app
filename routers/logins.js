const { getStudentRegId, getStudentInfo } = require('../services/person-search-api');
const { addItem, getItems } = require('../db');

const express = require('express');
const router = express.Router();
router.use(express.json());

router.get('/logins', async (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
    const query = 'SELECT C.name, C.netid, C.sid, C.reason, C.created_at FROM Logins C ORDER BY C.created_at DESC';
    const data = await getItems('Logins', query);

    res.status(200).json(data);
  } catch (e) {
    res.status(500).send(`There was an error getting the information you requested: ${e}`);
  }
});

router.post('/logins', async (req, res) => {
  let magStripCode = req.body.magStripCode;
  let netId = req.body.netId;
  let sid = req.body.sid;
  let studentInfo;
  let studentData;

  console.log(req.body);

  try {
    if (req.body.reason === undefined) {
      res.status(400).json({ 'text': 'Please include a reason with the request body'});
      return;
    } else if (magStripCode != undefined) {
      regId = await getStudentRegId(magStripCode);
      studentInfo = await getStudentInfo(regId);
    } else if (netId != undefined) {
      studentInfo = await getStudentInfo(netId, type="net_id");
    } else if (sid != undefined) {
      studentInfo = await getStudentInfo(sid, type="student_number");
    } else {
      res.status(400).json({ 'text': 'Please supply either a magstrip code, net ID, or student ID'});
      return;
    }
  } catch (e) {
    res.status(400).json({ 'text': e });
    return;
  }

  studentData = {
    name: studentInfo.StudentName,
    netid: studentInfo.UWNetID,
    sid: studentInfo.StudentNumber,
    reason: req.body.reason
  }

  let item = await addItem('Logins', studentData);
  if (item.statusCode >= 200 && item.statusCode < 300) {
    studentData.text = `${studentInfo.StudentName} has successfully signed in for: ${req.body.reason}`;
    res.json(studentData);
  } else {
    res.status(500).json({
      "text": "There was an error inserting the data into the database, please check Azure logs"
    });
  }
});

module.exports = router;