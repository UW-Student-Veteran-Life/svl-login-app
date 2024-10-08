/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This file contains implementation to interact with the Person Search API to pull
 * basic student information
 */
const axios = require('axios');
const https = require('https');
const process = require('process');
const { pfxCert } = require('./cert');
const { Student } = require('../core/Student');

const apiRoot = process.env.API_ROOT;

/**
 * Gets a students information from their regId
 * @param {string} searchParam Search parameter to find student
 * @param {string} type The type of search parameter, can be: reg_id (Registration ID), net_id (UW Net ID), student_number (Student Number)
 * @returns {Promise<Student>} Student's information from UW's Person Search Resource API
 */
async function getStudentInfo(searchParam, type='reg_id') {
  if (!['reg_id', 'net_id', 'student_number'].includes(type)) {
    throw new Error('Type is not of value reg_id, net_id, or student_number');
  }

  // Create an HTTPS agent with base64 encoded certificate
  const httpsAgent = new https.Agent({
    pfx: await pfxCert
  });

  const requestUrl = new URL('student/v5/person.json', apiRoot);
  requestUrl.searchParams.append(type, searchParam);

  try {
    console.log(`Processing request ${requestUrl}`);
    const response = await axios.get(requestUrl, { httpsAgent });
    const studentData = response.data.Persons[0];
    return new Student(studentData.StudentName, studentData.StudentNumber, studentData.UWNetID);
  } catch (error) {
    console.error(`There was an issue with reaching the Person Search API: ${error.message}`);
    throw new Error(`Unable to find ${searchParam}`);
  }
}

module.exports = { getStudentInfo };
