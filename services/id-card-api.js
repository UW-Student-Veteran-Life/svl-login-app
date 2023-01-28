const axios = require('axios');
const Buffer = require('buffer');
const { DefaultAzureCredential } = require('@azure/identity');
const https = require('https');
const process = require('process');
const { SecretClient } = require('@azure/keyvault-secrets');


const azureCred = new DefaultAzureCredential();
const kvSecretClient = new SecretClient(process.env.VAULT_URI, azureCred);
const apiRoot = process.env.API_ROOT;

/**
 * Gets the student's RegId for a given a mag strip code
 * @param {string} magStripCode The mag strip code to get information for
 * @returns A Promise with the student's regId or an error
 */
async function getStudentRegIdByMag(magStripCode) {
  const certPfx = await kvSecretClient.getSecret('svlcardreader-vetlife-washington-edu');

  // Create an HTTPS agent with base64 encoded certificate
  const httpsAgent = new https.Agent({
    pfx: new Buffer.from(certPfx.value, 'base64')
  });

  const requestUrl = new URL('/idcard/v1/card.json', apiRoot);
  requestUrl.searchParams.append('mag_strip_code', magStripCode);

  try {
    console.log(`Processing request ${requestUrl}`);
    const response = await axios.get(requestUrl, { httpsAgent });
    const studentData = response.data.Persons[0];
    return studentData;
  } catch (error) {
    console.error(`There was an issue searching using mag_strip_code ${magStripCode}: ${error.response.data.StatusDescription}`);
    throw new Error(error.response.data.StatusDescription);
  }
}

/**
 * Retrieves a student's reg id from the RFID associated with their Husky card
 * @param {string} proxRfid RFID from Husky Card
 * @returns {Promise<string>} The student's reg ID
 */
async function getStudentRegIdByProx(proxRfid) {
  const certPfx = await kvSecretClient.getSecret('svlcardreader-vetlife-washington-edu');

  // Create an HTTPS agent with base64 encoded certificate
  const httpsAgent = new https.Agent({
    pfx: new Buffer.from(certPfx.value, 'base64')
  });

  const requestUrl = new URL('/idcard/v1/card.json', apiRoot);
  requestUrl.searchParams.append('prox_rfid', proxRfid);

  try {
    console.log(`Processing request ${requestUrl}`);
    const response = await axios.get(requestUrl, { httpsAgent });
    const studentData = response.data.Persons[0];
    return studentData;
  } catch (error) {
    console.error(`There was an issue searching using prox_rfid ${proxRfid}: ${error.response.data.StatusDescription}`);
    throw new Error(error.response.data.StatusDescription);
  }
}

module.exports = { getStudentRegIdByMag, getStudentRegIdByProx };
