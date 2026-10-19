# UW Student Veteran Life Login

This repository contains a kiosk-style web application for recording Student Veteran Life visits. Students can identify themselves with a student number, UW NetID, or Husky Card and select one or more visit reasons. Authorized staff can manage the available reasons and retrieve login records as CSV files.

## Application and infrastructure

- **Web application:** Node.js 24, Express, and static HTML/CSS/JavaScript, hosted by an Azure Linux Web App.
- **Authentication and authorization:** Microsoft Entra ID using MSAL. Staff access to login records and option management requires the `Login.Read` app role.
- **Database:** Azure Cosmos DB for NoSQL, with `SVL` database and `Logins` and `Options` containers.
- **Secrets:** Azure Key Vault stores application credentials, the Cosmos DB connection string, the UW API root, and the UW API certificate secret. The web app uses its managed identity to read secrets.
- **UW services:** UW's ID Card Reader and Person Search APIs resolve card identifiers and retrieve student information. These services require a UW-issued client certificate.

## Run locally

### Prerequisites

- Node.js 24.x and npm
- Access to the application's Azure Key Vault and Cosmos DB
- An Azure identity that can read the required Key Vault secrets (for example, sign in with Azure CLI using `az login`)
- A configured Microsoft Entra application and the UW API certificate described below

From the repository root:

```sh
cd src
npm install
npm start
```

The server listens on port `8080` by default; set `PORT` to override it. Before starting the server, configure the environment variables below. Set these in your shell or local development environment; never commit credentials.

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
- `svlcardreader-vetlife-washington-edu` — base64-encoded PFX client certificate for UW API requests

The local identity needs permission to read these secrets. The Terraform deployment assigns the web app's managed identity a Key Vault role; local identities must be granted access separately.

## Application behavior

- The public kiosk page loads available login reasons from `GET /api/options`.
- Submitting a visit creates a record in `POST /api/logins`. Card swipe identifiers are resolved through the UW ID Card Reader API, then student information is retrieved from the UW Person Search API.
- The admin page is available at `/admin`. Staff can create and delete login reasons and download login records for all students, a date range, or one student number.
- Login-record retrieval is restricted to signed-in users whose Entra token contains the `Login.Read` app role. The admin page requires sign-in.
- Login records include student name, student number, UW NetID, selected reasons, and creation time. They are FERPA-sensitive; exported CSVs require the same care as the records in Cosmos DB.

## UW ID Card Reader and Person Search APIs

Both UW services use certificate-based client authentication. The app uses the same PFX certificate for both:

- The ID Card Reader endpoint `/idcard/v1/card.json` resolves magnetic-stripe and prox/RFID card codes to a registration ID.
- The Person Search endpoint `student/v5/person.json` retrieves student details by registration ID, UW NetID, or student number.
- `API_ROOT` is the service root URL used to construct both API request URLs.

Access to these APIs and certificates is managed by UW IT. Request an appropriate client certificate through the UW [IAM Tools Service](https://iam-tools.u.washington.edu/cs/) and confirm the service URLs and access with UW IT.

### Add or update the API certificate

The runtime expects the **PFX file itself encoded as base64**, not a PEM certificate/key pair. Obtain a PFX containing the certificate and its private key from UW's certificate authority. In PowerShell, encode the file without changing its contents:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\issued-certificate.pfx"))
```

Store the resulting value in Azure Key Vault as a secret named `svlcardreader-vetlife-washington-edu`. Do not put the certificate, private key, or encoded value in source control, build logs, or unprotected files. The application decodes the secret and supplies the PFX to its HTTPS client.

## Azure deployment

The root Terraform configuration provisions the Azure resources, including the resource group, Linux App Service plan and web app, Key Vault, Cosmos DB account/database/containers, and Application Insights. The App Service uses Node.js 24 LTS. The GitHub Actions **Deploy** workflow can be started manually with the `ADT`, `QAT`, or `PRD` environment selected and performs exactly one operation per run: **Plan**, **Apply**, or **Destroy**. A Plan run publishes a one-day Terraform plan artifact and does not change infrastructure. Apply and Destroy runs execute Terraform directly and are gated by approval through the selected GitHub Environment; configure required reviewers on each environment to enforce this approval gate. Apply and Destroy generate a fresh Terraform plan when they run; a plan artifact from a separate Plan run is for inspection only and is not applied. The workflow also supports an infrastructure-only Apply. Destruction is disabled for `PRD`.

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
| `app_plan_sku` | Variable `APP_PLAN_SKU` |
| `env_name` | Variable `ENV_NAME` |
| `global_resource_group_location` | Variable `GLOBAL_RESOURCE_GROUP_LOCATION` |
| `login_record_ttl` | Variable `LOGIN_RECORD_TTL` |
| `resource_group_location` | Variable `RESOURCE_GROUP_LOCATION` |

The workflow also needs Azure deployment credentials (`ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `AZURE_SUB_ID`, and `AZURE_TENANT_ID`). The Terraform state key is selected from `ENV_NAME` during initialization. Keep secret values in GitHub Environments/Secrets or Key Vault, not in the repository. Terraform plan artifacts can contain sensitive infrastructure values; restrict repository and workflow-run access accordingly.

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
