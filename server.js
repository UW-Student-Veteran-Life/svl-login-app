const express = require('express');
const http = require('http');
const app = express();
const getCert = require('./auth');
const port = process.env.PORT || 8080;

// Obtain certificate from Azure KeyVault and initialize server
getCert()
.then(cert => {
  console.log(`Certificate name: ${cert.name}`);
  console.log(`Certificate create date: ${cert.properties.createdOn}`);
  console.log(`Certificate expiration date: ${cert.properties.expiresOn}`);

  requestOptions = {
    hostname: `wseval.s.uw.edu`,
    method: 'GET',
    // PFX is encoded in base64
    pfx: new Buffer.from(cert.value, 'base64')
  }

  // Router middleware setup
  let initRoutes = require('./routes');
  app.use('/', initRoutes(requestOptions));

  http.createServer(app).listen(port, () => {
    console.log(`Server started on port: ` + port);
  });
}).catch(err => console.error(err));
