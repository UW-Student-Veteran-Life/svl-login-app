/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This file contains basic implementation to access a CosmosDB instance with a container
 * called 'Logins' to keep track of login events
 */
const { Student } = require('../models/Student');
const { UserLogin } = require('../models/UserLogin');

/**
 * Adds a user login to the 'Logins' collection for the specificed CosmosDB instance
 * @param {UserLogin} userLogin User login information
 * @param {Database} database CosmosDB instance to add to 
 * @returns 
 */
async function addLogin(userLogin, database) {
  const container = database.container('Logins');
  return await container.items.create(userLogin);
}

/**
 * Gets the latest 30 logins in the database sorted by creation time descending
 * @param {Database} database CosmosDB instance to connect to
 * @returns {Promise<Array<UserLogin>>}
 */
async function getAllLogins(database) {
  const container = database.container('Logins');
  const qry = {
    query: 'SELECT TOP 30 C.student, C.loginReason, C.createdAt FROM Logins C ORDER BY C.createdAt DESC'
  };

  let { resources } = await container.items.query(qry).fetchAll();
  let results = resources.map(record => {
    const student = new Student(record.student.name, record.student.number, record.student.uwNetId);
    return new UserLogin(student, record.loginReason, record.createdAt);
  });

  return results;
}

/**
 * Searches the database for records between the start and end date 
 * sorted by creation time descending
 * @param {Date} startDate Starting date to get records for
 * @param {Database} database CosmosDB instance to connect to
 * @param {Date} endDate Ending date to get records for, default is current date
 * @returns {Promise<Array<UserLogin>>}
 */
async function getLoginsByDate(startDate, database, endDate = new Date()) {
  const container = database.container('Logins');
  const qry = {
    query: `SELECT C.student, C.loginReason, C.createdAt FROM Logins C 
    WHERE C.createdAt >= '${startDate.toISOString()}' 
    AND C.createdAt <= '${endDate.toISOString()}' ORDER BY C.createdAt DESC`,
  };

  let { resources } = await container.items.query(qry).fetchAll();
  let results = resources.map(record => {
    return new UserLogin(record.student, record.loginReason, record.createdAt);
  });

  return results;
}

/**
 * Gets all login records for a specific student using their student number sorted by
 * creation time descending
 * @param {string} studentNumber Student number to get records for
 * @param {Database} database CosmosDB instance to connect to
 * @returns {Promise<Array<UserLogin>>}
 */
async function getLoginsByStudent(studentNumber, database) {
  const container = database.container('Logins');
  const qry = {
    query: 'SELECT C.student, C.loginReason, C.createdAt FROM Logins C WHERE C.student.number = @studentNumber ORDER BY C.createdAt DESC',
    parameters: [
      {name: '@studentNumber', value: studentNumber}
    ]
  };

  let { resources } = await container.items.query(qry).fetchAll();
  let results = resources.map(record => {
    return new UserLogin(record.student, record.loginReason, record.createdAt);
  });

  return results;
}

module.exports = { addLogin, getAllLogins, getLoginsByDate, getLoginsByStudent};
