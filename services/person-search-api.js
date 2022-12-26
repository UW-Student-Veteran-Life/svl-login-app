const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const axios = require('axios');
const https = require('https');

const azureCred = new DefaultAzureCredential();
const kvSecretClient = new SecretClient(process.env.VAULT_URI, azureCred);
const apiRoot = process.env.API_ROOT;

/**
 * Gets the student's RegId for a given a mag strip code
 * @param {string} magStripCode The mag strip code to get information for
 * @returns A Promise with the student's regId or an error
 */
async function getStudentRegId(magStripCode) {
  const certPfx = await kvSecretClient.getSecret('svlcardreader-vetlife-washington-edu');

  // Create an HTTPS agent with base64 encoded certificate
  const httpsAgent = new https.Agent({
    pfx: new Buffer.from(certPfx.value, 'base64')
  });

  const requestUrl = new URL(`/idcard/v1/card.json`, apiRoot);
  requestUrl.searchParams.append('mag_strip_code', magStripCode);

  return axios.get(requestUrl, { httpsAgent })
    .then(res => {
      return res.data.Persons[0];
    })
    .catch(err => {
      console.log(err.response.data);
      console.log(err.response.status);
      throw err.response.data.StatusDescription;
    });
}

/**
 * Gets a students information from their regId
 * @param {string} searchParam Search parameter to find student
 * @param {string} type The type of search parameter, can be: reg_id (Registration ID), net_id (UW Net ID), student_number (Student Number)
 * @returns A Promise with the student's information or an error
 */
async function getStudentInfo(searchParam, type="reg_id") {
  if (type != 'reg_id' && type != 'net_id' && type != 'student_number') {
    throw new Error('Type is not of value reg_id, net_id, or student_number');
  }

  const certPfx = await kvSecretClient.getSecret('svlcardreader-vetlife-washington-edu');

  // Create an HTTPS agent with base64 encoded certificate
  const httpsAgent = new https.Agent({
    pfx: new Buffer.from(certPfx.value, 'base64')
  });

  const requestUrl = new URL(`student/v5/person.json`, apiRoot);
  requestUrl.searchParams.append(type, searchParam);

  return axios.get(requestUrl, { httpsAgent })
    .then(res => {
      return res.data.Persons[0];
    })
    .catch(err => {
      console.log(err.response.data);
      console.log(err.response.status);
      throw err.response.data.StatusDescription;
    });
}

module.exports = { getStudentRegId, getStudentInfo }