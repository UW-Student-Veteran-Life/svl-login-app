const { MongoClient } = require('mongodb');
const mongoUri = "mongodb+srv://dbAdmin:rVynkmZnNlWPd7RL@uw-svl.ukooa.mongodb.net/SVL-Logins?retryWrites=true&w=majority";

const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10
});




module.exports = client;