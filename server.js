const express = require('express');
const http = require('http');
const server = express();
const getCert = require('./auth');
const port = process.env.PORT || 8080;

// Obtain certificate from Azure KeyVault and initialize server
getCert()
.then(cert => {
  console.log(`Certificate name: ${cert.name}`);
  console.log(`Certificate create date: ${cert.properties.createdOn}`);
  console.log(`Certificate expiration date: ${cert.properties.expiresOn}`);

  requestOptions = {
    // PFX is encoded in base64
    pfx: new Buffer.from(cert.value, 'base64')
  }

  // Router middleware setup
  let initRoutes = require('./routes');
  server.use('/student', initRoutes(requestOptions));
  server.use(express.static('public'));

  http.createServer(server).listen(port, () => {
    console.log(`Server started on port: ` + port);
  });
}).catch(err => console.error(err));
