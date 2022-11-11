const routes = require('./routes');
const express = require('express');
const http = require('http');
const morgan = require('morgan');

const server = express();
const port = process.env.PORT || 8080;

// Router middleware setup
server.use(morgan('combined'));
server.use('/student', routes);
server.use(express.static('public'));
server.use(express.static('views'));

http.createServer(server).listen(port, () => {
  console.log(`Server started on port: ` + port);
});
