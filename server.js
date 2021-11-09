const express = require('express');
const http = require('http');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8080;

requestOptions = {
  hostname: `wseval.s.uw.edu`,
  method: 'GET',
  pfx: fs.readFileSync(process.env.cert_path),
  passphrase: process.env.cert_pass
}

// Router middleware setup
let initRoutes = require('./routes');
app.use('/', initRoutes(requestOptions));

http.createServer(app).listen(port, () => {
  console.log(`Server started on port: ` + port);
});