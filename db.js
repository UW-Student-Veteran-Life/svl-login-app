const { CosmosClient } = require('@azure/cosmos');
const dbClient = new CosmosClient(process.env.cosmos_db_conn);
const database = dbClient.database('SVL');
const container = database.container('Logins');

async function logEntry(data) {
  let item = await container.items.create(data);
  return item;
}

async function getItemsByDate(date) {
  const { resources } = await container.items.query(`SELECT * FROM C WHERE C.date = "${date}"`).fetchAll();
  const results = [];

  for (const record of resources) {
    results.push(record);
  }

  return results;
}

module.exports = [logEntry, getItemsByDate];