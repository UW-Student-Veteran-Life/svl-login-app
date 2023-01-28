const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const express = require('express');
const http = require('http');
const morgan = require('morgan');
const process = require('process');

const server = express();
const port = process.env.PORT || 8080;

const loginsRouter = require('./routers/logins');

// Router middleware setup
server.use(morgan('combined'));
server.use(async (req, res, next) => {
  // Initalize connection to database
  const vaultUri = process.env.VAULT_URI;
  if (vaultUri == undefined) throw Error('The environment variable \'VAULT_URI\' cannot be undefined');
  const azureCred = new DefaultAzureCredential();
  const kvSecretClient = new SecretClient(vaultUri, azureCred);
  const dbConn = await kvSecretClient.getSecret('db-conn');
  const dbClient = new CosmosClient(dbConn.value);
  const database = dbClient.database('SVL');

  req.database = database;
  next();
});

server.use('/api', loginsRouter);
// server.use('/api', optionsRouter);

server.use(express.static('public'));
server.use(express.static('views'));

http.createServer(server).listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
