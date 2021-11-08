const express = require('express');
const https = require('https');
const getCert = require('./auth');
const app = express();

getCert()
.then(cert => {
  httpsOptions = {
    pfx: new Buffer.from(cert.value, 'base64')
  }

  requestOptions = {
    hostname: `wseval.s.uw.edu`,
    method: 'GET',
    pfx: new Buffer.from(cert.value, 'base64')
  }

  // Router middleware setup
  let initRoutes = require('./routes');
  app.use('/', initRoutes(requestOptions));

  https.createServer(httpsOptions, app).listen(process.env.PORT, () => {
    console.log(`Server started on port: ` + process.env.PORT);
  });
}).catch(err => console.error(err));