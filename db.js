const { CosmosClient } = require('@azure/cosmos');
const dbClient = new CosmosClient(process.env.cosmos_db_conn);
const database = dbClient.database('SVL');
const container = database.container('Logins');

async function logEntry(data) {
  let item = await container.items.create(data);
  return item;
}

module.exports = logEntry;