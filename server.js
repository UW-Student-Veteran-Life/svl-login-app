const express = require('express');
const https = require('https');
const fs = require('fs');
const getCert = require('./auth');
const app = express();
const port = process.env.PORT || 8080;

// Get certificate from KeyVault and then start server
httpsOptions = {
  pfx: fs.readFileSync(process.env.cert_path),
  passphrase: process.env.cert_pass
}

requestOptions = {
  hostname: `wseval.s.uw.edu`,
  method: 'GET',
  pfx: fs.readFileSync(process.env.cert_path),
  passphrase: process.env.cert_pass
}

// Router middleware setup
let initRoutes = require('./routes');
app.use('/', initRoutes(requestOptions));

https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`Server started on port: ` + port);
});