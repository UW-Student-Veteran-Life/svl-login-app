const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();
const port = 5000 | process.env.port;

let routes = require('./routes');
app.use('/', routes);

httpsOptions = {
  pfx: fs.readFileSync(`/var/ssl/private/${process.env.WEBSITE_LOAD_CERTIFICATES}`),
  passphrase: process.env.CERT_PASS
}

https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`Server started on port: ` + port);
});
