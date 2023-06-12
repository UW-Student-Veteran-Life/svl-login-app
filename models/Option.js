const uuid = require('uuid');

/**
 * A POCO class to contain information about a login option
 * 
 * @property {string} description The description of the login option
 * @property {Date} createdAt The date this option was created
 * @property {string} id The unique ID for this option
 */
class Option {
  description;
  createdAt;
  id;

  /**
   * Constructs a new login option
   * @param {string} description The description of the login option
   * @param {Date} createdAt The date this option was created
   * @param {string} id The unique ID for this option
   */
  constructor(description, createdAt = new Date(), id = uuid.v4()) {
    this.description = description;
    this.createdAt = createdAt;
    this.id = id;
  } 
}

module.exports = { Option };
