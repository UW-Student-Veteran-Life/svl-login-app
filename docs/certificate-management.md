# Certificate management

This guide covers the UW client certificate used by the Student Veteran Life Login application to access the UW ID Card Reader and Person Search APIs. It also distinguishes that client certificate from the App Service TLS certificate used for a custom hostname.

## UW API client certificate

Application certificates are managed through the UW [IAM Tools Service](https://iam-tools.u.washington.edu/cs/). Request the appropriate client certificate there, and confirm API access and service URLs with UW IT.

### Protect the private key

The private key is provided only once, during initial enrollment. It will not be provided again when the certificate is renewed. Store the private key securely when it is first issued and retain it for future renewals; do not assume it can be recovered from the certificate-management service. Ensure a renewed certificate matches the retained private key, and contact UW IT if the renewal process requires a different key.

Never commit the private key or certificate to source control, print them in logs, or leave unnecessary local copies behind. The Key Vault secret and any working copies containing the private key must be treated as sensitive credentials.

### Configure the application secret

In each environment's Azure Key Vault, provision the secret `svlcardreader-vetlife-washington-edu` as a string containing PEM text with the client private key and its matching certificate. Its PEM blocks should have this general form (the bracketed text is illustrative):

```text
-----BEGIN PRIVATE KEY-----
<base64-encoded private key data>
-----END PRIVATE KEY-----
-----BEGIN CERTIFICATE-----
<base64-encoded certificate data>
-----END CERTIFICATE-----
```

If the certificate authority supplies intermediate certificates, include the required certificate chain in PEM form after the client certificate. Do not convert this value to a PFX or base64-encode the entire PEM text; the application expects the PEM text as-is.

The application's `cert.js` loader uses `VAULT_URI` and Azure's `DefaultAzureCredential` chain to read the current version of the secret. In Azure App Service, the app's managed identity needs permission to read Key Vault secrets. For local development, the identity from `az login` needs the same access. The loader verifies that the secret contains a PEM private-key block and a certificate block, then uses the unchanged PEM value for TLS client authentication.

The ID Card Reader and Person Search API clients use Node HTTPS agents to present these credentials during the TLS handshake. These are TLS credentials, not HTTP request headers. Do not use the PEM secret with the `pfx` option, which is for a binary PKCS#12/PFX bundle.

### Renew or rotate the certificate

Update the Key Vault secret with PEM text containing the renewed certificate and its matching private key, then restart or redeploy the app so newly created TLS agents load the latest secret version. Because the private key is not reissued upon renewal, verify that the retained key matches the renewed certificate before updating the secret.

## App Service custom-hostname TLS certificate

The App Service TLS certificate secures HTTPS for a custom application hostname. It is separate from the UW API client certificate described above. Terraform in this repository does not provision it. See the [DNS and custom domains instructions](../README.md#dns-and-custom-domains) for hostname binding and HTTPS setup.
