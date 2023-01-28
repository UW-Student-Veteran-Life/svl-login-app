/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains implementation to access a CosmosDB container
 * called 'Options' to keep track of available login options for the front-end
 */

// eslint-disable-next-line no-unused-vars
const { Database } = require('@azure/cosmos');
const { Option } = require('../models/Option');

/**
 * Adds a login option to the 'Options' collection
 * @param {Option} option Login option information
 * @param {Database} database CosmosDB instance
 */
async function addOption(option, database) {
  const container = database.container('Options');
  return await container.items.create(option);
}

/**
 * Retrieves all the options in the database
 * @param {Database} database CosmosDB instance
 * @returns {Promise<Option>} A set of options ordered alphabetically by their descriptions
 */
async function getOptions(database) {
  const container = database.container('Options');
  const qry = {
    query: 'SELECT * FROM Options C ORDER BY C.description ASC'
  };

  let { resources } = await container.items.query(qry).fetchAll();
  let results = resources.map(record => new Option(record.description, record.created_at, record.id));

  return results;
}

/**
 * Deletes an option from the 'Options' container
 * @param {string} id ID of option to delete
 * @param {Database} database CosmosDB instance
 * @returns Result of the deletion operation
 */
async function deleteOption(id, database) {
  const container = database.container('Options');
  const result = await container.item(id, id).delete();
  return result;
}

module.exports = { addOption, getOptions, deleteOption };
