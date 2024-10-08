/**
 * This code stub can be found at https://learn.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-nodejs-webapp-msal
 */
const process = require('process');

const msalConfig = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID, // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
    authority: process.env.CLOUD_INSTANCE + process.env.MSAL_TENANT_ID, // Full directory URL, in the form of https://login.microsoftonline.com/<tenant>
    clientSecret: process.env.MSAL_CLIENT_SECRET // Client secret generated from the app registration in Azure portal
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 'Info',
    }
  },
};

const REDIRECT_URI = process.env.REDIRECT_URI;
const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI;
const GRAPH_ME_ENDPOINT = process.env.GRAPH_API_ENDPOINT + 'v1.0/me';

module.exports = {
  msalConfig,
  REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI,
  GRAPH_ME_ENDPOINT
};
