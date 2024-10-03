/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains implementation to interact with UW's ID card API to
 * resolve mag strip and RFID (prox_rfid) codes
 */

const axios = require('axios');
const https = require('https');
const { pfxCert } = require('./cert');
const process = require('process');

const apiRoot = process.env.API_ROOT;

/**
 * Searches for the reg ID associated with a Husky card with the given identifier
 * @param {string} cardIdentifier The identifier for the card
 * @param {string} identifierType The identifier type, should be either mag_strip_code or prox_rfid
 * @returns {Promise<string>} The reg ID for the user associated with the card
 */
async function searchCard(cardIdentifier, identifierType) {
  // Create an HTTPS agent with base64 encoded certificate
  const httpsAgent = new https.Agent({
    pfx: await pfxCert
  });

  const requestUrl = new URL('/idcard/v1/card.json', apiRoot);
  requestUrl.searchParams.append(identifierType, cardIdentifier);

  try {
    console.log(`Processing request ${requestUrl}`);
    const response = await axios.get(requestUrl, { httpsAgent });
    const regId = response.data.Cards[0].RegID;
    return regId;
  } catch (error) {
    console.error(`Unable to resolve ${identifierType} ${cardIdentifier}: ${error.message}`);
    throw new Error(`Unable to resolve ${identifierType} ${cardIdentifier}, this card may no longer be active`);
  }
}

module.exports = { searchCard };
