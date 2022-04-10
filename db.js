const { CosmosClient } = require('@azure/cosmos');
const dbClient = new CosmosClient(process.env.cosmos_db_conn);
const database = dbClient.database('SVL');
const container = database.container(process.env.database);

async function logEntry(data) {
  let item = await container.items.create(data);
  return item;
}

async function getItemsByDate(startDate, endDate = null) {
  let qry = `SELECT * FROM C WHERE C.timestamp >= "${startDate}"`;

  if (endDate) qry += `AND C.timestamp <= "${endDate}"`;

  const { resources } = await container.items.query(qry).fetchAll();
  const results = [];

  for (const record of resources) {
    results.push(record);
  }

  return results;
}

module.exports = [logEntry, getItemsByDate];