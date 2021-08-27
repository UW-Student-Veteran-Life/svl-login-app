const express = require('express');
const app = express();
const port = 5000 | process.env.port

let routes = require('./routes');

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});