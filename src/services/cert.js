/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module obtains the PEM certificate and private key for UW IT's servers
 */
const { DefaultAzureCredential } = require('@azure/identity');
const process = require('process');
const { SecretClient } = require('@azure/keyvault-secrets');

const azureCred = new DefaultAzureCredential();
const kvSecretClient = new SecretClient(process.env.VAULT_URI, azureCred);

const tlsCredentials = (async () => {
  const secret = await kvSecretClient.getSecret('svlcardreader-vetlife-washington-edu');
  const pem = secret.value;

  if (!pem || !/-----BEGIN (?:[A-Z0-9 ]*PRIVATE KEY)-----/.test(pem) || !/-----BEGIN CERTIFICATE-----/.test(pem)) {
    throw new Error('The Key Vault secret must contain a PEM private key and certificate.');
  }

  return { key: pem, cert: pem };
})();

module.exports = { tlsCredentials };
