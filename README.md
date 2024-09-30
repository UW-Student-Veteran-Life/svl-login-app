# Overview
This repository contains a full stack application for managing user logins through a kiosk. The 
application consists of the following resources running on an Azure cloud environment:
- Web App running NodeJS
- CosmosDB for NoSQL
- Azure KeyVault

# Infrastructure
## Azure KeyVault
The Azure KeyVault is used to contain any database connection strings required by the application.
Additionally, it also contains the certificate needed to communicate with UW's ID card
reader and person search API services. Details on importing this certificate into the key vault
are down below.

## CosmosDB for NoSQL
A CosmosDB instance is used for keeping track of application data such as login events
or possible login options. It is not necessary that you use the specific `CosmosDB for NoSQL`
offering, the `CosmosDB for MongoDB` offering may work but it could potentially require 
alterations on the backend.

## Web App running NodeJS
A web app running NodeJS is needed to use this application. It is highly recommended to use
the latest long-term support version of NodeJS offered by Azure as this application does not
have any requirements to be ran on an older NodeJS runtime.

# Application Dependencies
The main dependencies of this application are the following services provided by UW IT:
- ID Card Reader service
- Person Search API service

These are both out of scope for this documentation and you may want to reach out to UW IT for 
further information.

In order to interact with these services, you will need a valid PFX certificate
granted by UW's certificate authority (known as UWCA). This is also out of scope for
this documentation but more can be found out by contacting UW IT.

# Generating a Certificate for API Access
The ID Card Reader service and Person Search APIs are both secured via certificate authenication.
Certificates can be retrieved via the UW's [IAM Tools Service](https://iam-tools.u.washington.edu/cs/).

Once you have retrieved your certificate, perform the following steps to import the certificate
into the key vault:
1. Extract the certificate using `openssl pkcs12 -in your-cert.p12 -out newfile.crt.pem -nokeys`
    - This extracts the certificate without the private key into a base64 string
2. Extract the private key using `openssl pkcs12 -in your-cert.p12 -out newfile.key.pem -nocerts -nodes`
    - This extracts the private key into a base64 string
    - **CAUTION**: The `-nodes` option means to output the private key without encryption. Be 
    careful not to expose the output of this command to parties who should not have it.
3. Copy the certificate in `newfile.crt.pem` and the key from `newfile.key.pem` into a new file
`cert.pem` which will contain the certificate to be loaded into the key vault
    - Copy only the contents between `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`
    as well as `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`, omit
    any bag attributes if present
4. Import the file into the key vault

## Deploying via Terraform
If you intend on deploying the certificate as a Terraform `azurerm` resource, complete the above steps
and then replace all newline characters in `cert.pem` with a literal `\n`. This can be done
trivially with `awk '{printf "%s\\n", $0}' cert.pem` in a bash terminal.

The output of the above command should then be stored in as secret value in your build pipeline can be
used in Terraform via the `azurerm_key_vault_certificate`.

# Data Retention Policies
Information stored for this application is [FERPA](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
sensitive. As such, there are data retention policies in place to delete data older than
a certain timeframe to limit any possible data leakage if it were to happen. The timeframes
are summarized down below. TTL (time-to-live) in CosmosDB is specified by seconds.

| Environment | Record TTL (time-to-live) |
|-------------|---------------------------|
| PRD | 7,776,000 seconds (90 days) |
| QAT | 86,400 seconds (1 day) |
| ADT | 3,600 seconds (1 hour) |