const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const azureCred = new DefaultAzureCredential();
const kvSecretClient = new SecretClient(process.env.VAULT_URI, azureCred);

let _database = null;

async function addItem(containerName, item) {
  if (!_database) {
    await connectDatabase();
  }
  const container = _database.container(containerName);

  item['created_at'] = (new Date()).toJSON();

  return await container.items.create(item);
}

async function getItems(containerName, userQuery) {
  if (!_database) {
    await connectDatabase();
  }

  const container = _database.container(containerName);

  const qry = {
    query: userQuery
  };

  const { resources } = await container.items.query(qry).fetchAll();

  return resources;
}

async function deleteItem(containerName, itemId) {
  if (!_database) {
    await connectDatabase();
  }
  const container = _database.container(containerName);

  await container.item(itemId, itemId).delete();
}

async function connectDatabase() {
  const dbConn = await kvSecretClient.getSecret('db-conn');
  const dbClient = new CosmosClient(dbConn.value);

  _database = dbClient.database('SVL');
}

module.exports = { addItem, getItems, deleteItem };