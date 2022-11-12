const express = require('express');
const http = require('http');
const morgan = require('morgan');

const server = express();
const port = process.env.PORT || 8080;

const loginsRouter = require('./routers/logins');
const optionsRouter = require('./routers/options');

// Router middleware setup
server.use(morgan('combined'));
server.use('/api', loginsRouter);
server.use('/api', optionsRouter);
server.use(express.static('public'));
server.use(express.static('views'));

http.createServer(server).listen(port, () => {
  console.log(`Server started on port: ` + port);
});
