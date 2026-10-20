# UW Student Veteran Life Login

This repository contains a kiosk-style web application for recording Student Veteran Life visits. Students can identify themselves with a student number, UW NetID, or Husky Card and select one or more visit reasons. Authorized staff can manage the available reasons and retrieve login records as CSV files.

## Application and infrastructure

- **Web application:** Node.js 24, Express, and static HTML/CSS/JavaScript, hosted by an Azure Linux Web App.
- **Authentication and authorization:** Microsoft Entra ID using MSAL. Staff access to login records and option management requires the `Login.Read` app role.
- **Database:** Azure Cosmos DB for NoSQL, with `SVL` database and `Logins` and `Options` containers.
- **Secrets:** Azure Key Vault stores application credentials, the Cosmos DB connection string, the UW API root, and the UW API certificate secret. The web app uses its managed identity to read secrets. See the [certificate management guide](docs/certificate-management.md) for certificate provisioning and handling.
- **UW services:** UW's ID Card Reader and Person Search APIs resolve card identifiers and retrieve student information. These services require a UW-issued client certificate.

## Run locally

### Prerequisites

- Node.js 24.x and npm
- Access to the application's Azure Key Vault and Cosmos DB
- An Azure identity that can read the required Key Vault secrets (for example, sign in with Azure CLI using `az login`)
- A configured Microsoft Entra application and the UW API certificate described in the [certificate management guide](docs/certificate-management.md)

From the repository root:

```powershell
az login
$env:VAULT_URI = "https://<your-key-vault-name>.vault.azure.net/"
$env:PORT = "8080"
$env:CLOUD_INSTANCE = "https://login.microsoftonline.com/"
$env:MSAL_TENANT_ID = "<Entra-tenant-id>"
$env:MSAL_CLIENT_ID = "<Entra-app-client-id>"
$env:MSAL_CLIENT_SECRET = "<Entra-app-client-secret>"
$env:REDIRECT_URI = "http://localhost:8080/auth/redirect"
$env:POST_LOGOUT_REDIRECT_URI = "http://localhost:8080/"
$env:GRAPH_API_ENDPOINT = "https://graph.microsoft.com/"
$env:API_ROOT = (az keyvault secret show --vault-name "<your-key-vault-name>" --name "API-ROOT" --query value --output tsv)

Set-Location .\src
npm install
npm start
```

Register `http://localhost:8080/auth/redirect` as a Web redirect URI for the Entra app. Replace the placeholders with values for your development environment; do not use production credentials or a production database for local testing. The local Azure CLI identity needs permission to read the required Key Vault secrets. The app also connects to Cosmos DB using the `DB-CONN` secret, so local requests that read or write application data require access to that database. Set values in your shell or local development environment; never commit credentials.

### Run tests

From the `src/` directory, run the automated tests with:

```sh
npm test
```

The tests use Node.js's built-in test runner and do not require access to Azure services.

| Variable | Purpose |
|---|---|
| `VAULT_URI` | URI of the Azure Key Vault used by the app |
| `CLOUD_INSTANCE` | Entra authority base URL, normally `https://login.microsoftonline.com/` |
| `MSAL_TENANT_ID` | Entra tenant ID |
| `MSAL_CLIENT_ID` | Entra app registration client ID |
| `MSAL_CLIENT_SECRET` | Entra app registration client secret |
| `REDIRECT_URI` | Sign-in redirect URI registered for the app |
| `POST_LOGOUT_REDIRECT_URI` | Post-logout redirect URI |
| `GRAPH_API_ENDPOINT` | Microsoft Graph base URL, normally `https://graph.microsoft.com/` |
| `API_ROOT` | Root URL for the UW ID Card Reader and Person Search APIs; in Azure this is read from Key Vault |
| `PORT` | Optional HTTP listening port (default `8080`) |

The app also reads these Key Vault secrets at runtime:

- `APP-SESSION-SECRET` — Express session signing secret
- `DB-CONN` — Cosmos DB SQL API connection string
- `svlcardreader-vetlife-washington-edu` — PEM text containing the client private key and matching certificate for UW API requests; see the [certificate management guide](docs/certificate-management.md)

The local identity needs permission to read these secrets. The Terraform deployment assigns the web app's managed identity a Key Vault role; local identities must be granted access separately.

## Application behavior

- The public kiosk page loads available login reasons from `GET /api/options`.
- Submitting a visit creates a record in `POST /api/logins`. Card swipe identifiers are resolved through the UW ID Card Reader API, then student information is retrieved from the UW Person Search API.
- The admin page is available at `/admin`. Staff can create and delete login reasons and download login records for all students, a date range, or one student number.
- Login-record retrieval is restricted to signed-in users whose Entra token contains the `Login.Read` app role. The admin page requires sign-in.
- Login records include student name, student number, UW NetID, selected reasons, and creation time. They are FERPA-sensitive; exported CSVs require the same care as the records in Cosmos DB.

## UW ID Card Reader and Person Search APIs

Both UW services use certificate-based client authentication. The app uses the same PEM private key and certificate for both:

- The ID Card Reader endpoint `/idcard/v1/card.json` resolves magnetic-stripe and prox/RFID card codes to a registration ID.
- The Person Search endpoint `student/v5/person.json` retrieves student details by registration ID, UW NetID, or student number.
- `API_ROOT` is the service root URL used to construct both API request URLs.

See the [certificate management guide](docs/certificate-management.md) for obtaining and securely storing the UW client certificate and configuring its Key Vault secret.

## Azure deployment

The root Terraform configuration provisions the Azure resources, including the resource group, Linux App Service plan and web app, Key Vault, Cosmos DB account/database/containers, and Application Insights. The App Service uses Node.js 24 LTS. The GitHub Actions **Deploy** workflow can be started manually with the `ADT`, `QAT`, or `PRD` environment selected and performs exactly one operation per run: **Plan**, **Apply**, or **Destroy**. A Plan run publishes a one-day Terraform plan artifact and does not change infrastructure. Apply and Destroy runs execute Terraform directly and are gated by approval through the selected GitHub Environment; configure required reviewers on each environment to enforce this approval gate. Apply and Destroy generate a fresh Terraform plan when they run; a plan artifact from a separate Plan run is for inspection only and is not applied. The workflow also supports an infrastructure-only Apply. Destruction is disabled for `PRD`.

[Read the CI/CD guide](docs/ci-cd.md) for workflow triggers and steps, deployment inputs, GitHub Environment configuration, Terraform state, operational checklists, and failure handling.

Configure these GitHub environment variables and secrets in each deployment environment. Plan runs use the selected environment too, so its required reviewers approve access before Terraform creates the plan. The workflow passes Terraform inputs using matching `TF_VAR_*` environment variables, without modifying the Terraform files:

| Terraform variable | GitHub environment value |
|---|---|
| `arm_client_id` | Secret `ARM_CLIENT_ID` |
| `arm_client_secret` | Secret `ARM_CLIENT_SECRET` |
| `app_client_id` | Secret `APP_CLIENT_ID` |
| `app_post_logout_redirect` | Variable `POST_LOGOUT_REDIRECT_URI` |
| `app_redirect_uri` | Variable `REDIRECT_URI` |
| `app_session_secret` | Secret `APP_SESSION_SECRET` |
| `api_root` | Variable `API_ROOT` |
| `app_client_secret` | Secret `APP_CLIENT_SECRET` |
| `env_name` | Lowercase version of the workflow's selected environment (`ADT`, `QAT`, or `PRD`) |
| `login_record_ttl` | Variable `LOGIN_RECORD_TTL` |

The Terraform configuration sets the resource location to `westus2` and the App Service plan SKU to `B1`. The workflow derives `env_name`, the Terraform state key, and the Web App name from the selected workflow environment, converting it to lowercase. The workflow also needs Azure deployment credentials (`ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `AZURE_SUB_ID`, and `AZURE_TENANT_ID`). Keep secret values in GitHub Environments/Secrets or Key Vault, not in the repository. Terraform plan artifacts can contain sensitive infrastructure values; restrict repository and workflow-run access accordingly.

The GitHub Actions **Build and Validate** workflow installs Node.js 24 dependencies and validates Terraform. The application package is in `src/`.

### DNS and custom domains

This repository does not create DNS records or bind custom hostnames to the App Service. Configure DNS and the custom domain separately for each environment:

1. Create the desired hostname in the appropriate DNS zone.
2. In the Azure Web App's **Custom domains** settings, add and verify the hostname. Use the verification record and target values Azure provides for that app; those values are specific to the app and domain.
3. Create the corresponding DNS records at the DNS provider, then complete the hostname binding in Azure.
4. Configure an App Service TLS/SSL certificate for the hostname and verify HTTPS before using it.
5. Set `REDIRECT_URI` and `POST_LOGOUT_REDIRECT_URI` to the final HTTPS URLs and register the sign-in redirect URI in the Entra app registration. They must match the host and paths used by the deployed application.

Do not assume the DNS zone, hostname, verification token, or certificate is provisioned by Terraform in this repository.

## Data retention

Login records are FERPA-sensitive. The `Logins` Cosmos DB container uses the configured `LOGIN_RECORD_TTL`; Cosmos DB TTL is measured in seconds. The `Options` container does not have a configured TTL.

| Environment | Login record TTL |
|---|---:|
| PRD | 7,776,000 seconds (90 days) |
| QAT | 86,400 seconds (1 day) |
| ADT | 3,600 seconds (1 hour) |

Ensure each deployment environment's `LOGIN_RECORD_TTL` value agrees with the applicable retention policy.
