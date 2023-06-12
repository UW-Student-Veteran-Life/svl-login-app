/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module obtains the PFX certificate necessary to connect to UW IT's servers
 */
const { Buffer } = require('buffer');
const { DefaultAzureCredential } = require('@azure/identity');
const process = require('process');
const { SecretClient } = require('@azure/keyvault-secrets');

const azureCred = new DefaultAzureCredential();
const kvSecretClient = new SecretClient(process.env.VAULT_URI, azureCred);

const pfxCert = (async () => {
  const secret = await kvSecretClient.getSecret('svlcardreader-vetlife-washington-edu');
  const cert = secret.value;

  return new Buffer.from(cert, 'base64');
})();

module.exports = { pfxCert };
