const { ClientSecretCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

async function getCert() {
  // Authentication for Azure Active Directory
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET
  );
  const vaultUrl = 'https://svl-keyvault.vault.azure.net/';

  const client = new SecretClient(vaultUrl, credential)
  const cert = await client.getSecret('svlcardreader-vetlife-washington-edu');
  console.log(cert.name);

  return cert;
}

module.exports = getCert;