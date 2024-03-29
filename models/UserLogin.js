// eslint-disable-next-line no-unused-vars
const { Student } = require('./Student');

/**
 * A POCO class to contain information about a student login
 * 
 * @property {Student} student The student associated with this login
 * @property {Array<string>} loginReasons The reason a student is logging in
 * @property {Date} createdAt JSON string of the date & time of login
 */
class UserLogin {
  student;
  loginReasons;
  createdAt;

  /**
   * Constructs a new UserLogin
   * @param {Student} student Student associated with this login
   * @param {Array<string>} loginReasons Reason why the student is logging in
   * @param {Date} createdAt Date the login was to created, set to the current system date if not specified
   */
  constructor(student, loginReasons, createdAt = new Date()) {
    this.student = student;
    this.loginReasons = loginReasons;
    this.createdAt = createdAt;
  }
}

module.exports = { UserLogin };
