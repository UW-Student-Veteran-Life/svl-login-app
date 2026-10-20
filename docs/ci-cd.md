# CI/CD

This guide documents the continuous integration and deployment workflows currently defined in this repository. The source of truth for workflow behavior is the YAML under `.github/workflows/`; update this guide when those workflows change.

## At a glance

| Workflow | Trigger | Purpose | Changes Azure resources? |
|---|---|---|---|
| **Build and Validate** | Push to any branch | Install app dependencies, run the app test suite, and validate Terraform | No |
| **Deploy** | Manual `workflow_dispatch` | Plan, apply, or destroy Terraform infrastructure; an Apply can also deploy the Node.js app | Yes, for Apply and Destroy |

There is no pull-request trigger in the current Build and Validate workflow. A pull request receives these checks only after a push to its source branch runs the workflow; the workflow itself does not declare a `pull_request` event.

## Build and Validate

Workflow file: [`.github/workflows/app-svl.build.yml`](../.github/workflows/app-svl.build.yml)

### Trigger and runtime

- Runs on every push to every branch (`**`); it is not configured for tags, pull-request events, or a schedule.
- Runs as one job on `ubuntu-latest`.
- Checks out the repository and uses Node.js `24.x` and Terraform `1.16.5`.
- Does not select a GitHub Environment or use the Azure deployment credentials.

### Steps

1. Checks out the pushed revision.
2. Sets up Node.js 24.
3. Runs the app commands from the repository root:

   ```sh
   npm --prefix src install
   npm --prefix src run build --if-present
   npm --prefix src test
   ```

   The package is in `src/`. Its test script runs Node's built-in test runner. The current package does not define a `build` script, so `--if-present` skips that command when absent.
4. Installs Terraform `1.16.5`.
5. Runs `terraform init --backend=false`, which initializes the configuration without accessing the configured remote state backend.
6. Runs `terraform validate`.

The workflow is a validation/check workflow only: it does not run `terraform plan` or `apply`, publish the application, or deploy infrastructure.

## Deploy

Workflow file: [`.github/workflows/app-svl.deploy.yml`](../.github/workflows/app-svl.deploy.yml)

### Start a run

In GitHub, open **Actions → Deploy → Run workflow** and choose:

| Input | Values | Default | Effect |
|---|---|---|---|
| `environment` | `ADT`, `QAT`, `PRD` | `ADT` | Selects the GitHub Environment and the target Terraform state/resources |
| `operation` | `plan`, `apply`, `destroy` | `apply` | Selects one Terraform operation |
| `infrastructure_only` | Boolean | `false` | On Apply, skips Node setup, npm install, and Web App deployment when enabled |

The workflow lowercases the selected environment for resource names and the Terraform state key. For example, `ADT` becomes `adt`, state key `svl.adt.tfstate`, and Web App name `app-svl-adt-westus2`.

Every operation runs in the selected GitHub Environment. Configure required reviewers and other protection rules on each environment in repository settings to control access; the workflow itself does not define the reviewer list. Environment protection may hold a run before its job starts.

### Plan

A Plan run:

1. Checks out the repository and sets up Terraform `1.16.5`.
2. Authenticates to Azure using the selected GitHub Environment's deployment credentials.
3. Initializes Terraform with the selected environment's remote state key.
4. Runs `terraform plan -input=false -out=tfplan`.
5. Uploads the binary plan as an artifact named `terraform-plan`, with a one-day retention period.

Plan does not apply the changes. The artifact is for inspection and is **not** consumed by a later Apply run. Each Apply generates and executes its own plan through `terraform apply -auto-approve`, so review a Plan run and ensure the state/environment have not changed before applying.

Terraform plan files can contain sensitive values. Restrict access to the repository and workflow runs, and do not copy plan files into public or broadly accessible locations.

### Apply

An Apply run initializes the selected environment's remote state and runs `terraform apply -auto-approve`. It does not apply a previously uploaded Plan artifact.

Unless `infrastructure_only` is `true`, the workflow then:

1. Sets up Node.js `24.x`.
2. Runs `npm install` in `src/`.
3. Deploys the `src` directory to the environment's Azure Linux Web App using `azure/webapps-deploy@v3`.

The app name pattern is `app-svl-<lowercase-environment>-westus2`. The workflow deploys the source directory; Build and Validate is a separate workflow and is not declared as a prerequisite or dependency of Deploy. Operators should confirm the intended revision has passed validation before starting a production deployment.

When `infrastructure_only` is `true`, Terraform Apply still runs, but the app deployment steps are skipped. This option has no effect on Plan or Destroy.

### Destroy

A Destroy run executes `terraform destroy -auto-approve` for `ADT` and `QAT`. The workflow explicitly rejects `PRD` destruction. The Terraform database and container resources also have `prevent_destroy` lifecycle protection; such protected resources cause Terraform to refuse their destruction.

Destroy does not run the Node.js setup or deploy the application. Treat it as a potentially data-impacting operation and verify the selected environment and plan before running it.

## GitHub Environment configuration

Create/configure GitHub Environments named exactly `ADT`, `QAT`, and `PRD`. Populate each environment with the credentials and values appropriate to that environment. Plan, Apply, and Destroy all require the Azure deployment credentials because all three authenticate to Azure and initialize the remote backend.

### Required secrets and variables

| Name | GitHub setting | Used for |
|---|---|---|
| `ARM_CLIENT_ID` | Secret | Azure service principal login and Terraform `arm_client_id` |
| `ARM_CLIENT_SECRET` | Secret | Azure service principal login and Terraform `arm_client_secret` |
| `AZURE_SUB_ID` | Secret | Azure login subscription ID |
| `AZURE_TENANT_ID` | Secret | Azure login tenant ID |
| `APP_CLIENT_ID` | Secret | Terraform `app_client_id`; stored in Key Vault for the app |
| `APP_CLIENT_SECRET` | Secret | Terraform `app_client_secret`; stored in Key Vault for the app |
| `APP_SESSION_SECRET` | Secret | Terraform `app_session_secret`; stored in Key Vault for the app |
| `POST_LOGOUT_REDIRECT_URI` | Variable | Terraform `app_post_logout_redirect` |
| `REDIRECT_URI` | Variable | Terraform `app_redirect_uri` |
| `API_ROOT` | Variable | Terraform `api_root`; stored in Key Vault for the app |
| `LOGIN_RECORD_TTL` | Variable | Terraform `login_record_ttl`, in seconds |

The workflow maps these settings to Terraform through `TF_VAR_*` environment variables. It also uses the Azure service principal values to log in and sets the standard `ARM_*` variables for the AzureRM provider. The environment name is passed as `env_name` after lowercasing the selected input.

Redirect URIs must match the deployed host and application paths and must be registered with the Microsoft Entra application. Do not put credentials in workflow inputs, source files, or logs. Keep separate credentials and application settings for each environment.

### Runtime secrets not supplied as GitHub inputs

Terraform creates the Key Vault and writes the Entra app credentials, API root, app session secret, and Cosmos DB connection string into it. The web app accesses Key Vault through its system-assigned managed identity. The UW API certificate secret (`svlcardreader-vetlife-washington-edu`) is not created or populated by the Terraform configuration; provision/rotate that PEM-valued secret separately in the environment's vault. The application requires it to call the UW ID Card Reader and Person Search APIs. See the [certificate management guide](./certificate-management.md) for certificate issuance and secure handling.

The app also needs the runtime Key Vault secrets and settings documented in the [README](../README.md#run-locally). A successful infrastructure Apply does not by itself verify that an out-of-band certificate secret, custom DNS, hostname binding, or TLS certificate is configured correctly.

## Terraform and Azure resources

Terraform is defined in the repository root (`main.tf` and `variables.tf`); the workflow does not change directories before Terraform commands. The backend is Azure Storage:

- Resource group: `rg-svl-global-westus2`
- Storage account: `sttfsvlstateglobal`
- Container: `tf-state`
- Environment-specific state key: `svl.<lowercase-environment>.tfstate`

The configured provider is AzureRM `5.10.0`, and Terraform is pinned to `1.16.5`. Resources include an environment resource group, Linux App Service plan and Web App, Key Vault, Cosmos DB account/database/containers, Log Analytics workspace, and Application Insights. Region, resource names, app runtime, and other details are defined in `main.tf`; consult that file for the current resource configuration.

The `Logins` Cosmos DB container uses the environment's `LOGIN_RECORD_TTL` value in seconds. Confirm that it matches the approved retention policy before applying. The `Options` container has no configured TTL. See [Data retention](../README.md#data-retention) for the documented environment values.

Terraform does not configure DNS records, custom hostname bindings, or the App Service TLS certificate. Those remain separate environment operations; see [DNS and custom domains](../README.md#dns-and-custom-domains) and the [certificate management guide](./certificate-management.md).

## Operational checklist

### Before a run

- Confirm the target environment and operation in the workflow form.
- Confirm that the selected GitHub Environment has the correct Azure credentials, app credentials, redirect URIs, API root, and retention TTL.
- For Apply, review a recent Plan run and check its Terraform plan artifact. Remember that Apply creates a fresh plan and can differ from the earlier artifact.
- Confirm the exact revision to deploy has passed Build and Validate, especially for `PRD`.
- For production, verify that the configured redirect URIs match the production HTTPS hostname and Entra registration.
- For Destroy, verify that the target is `ADT` or `QAT` and that any required data-retention/backup decisions have been made.

### After an Apply

- Check that the Deploy job completed both Terraform and (unless infrastructure-only) Web App deployment.
- Verify application health, sign-in and redirect behavior, Key Vault secret resolution, Cosmos DB connectivity, and UW API access in the target environment.
- If changing custom domains or certificates, verify DNS, hostname binding, and HTTPS separately.

### When a workflow fails

- Use the failed GitHub Actions job and step logs to identify the failing operation. Avoid copying secrets or sensitive Terraform output into issues or chat.
- A Build and Validate failure does not itself change infrastructure.
- A Plan failure means no Terraform apply was run by that Plan job.
- An Apply can make infrastructure changes before a later app dependency-install or Web App deployment step fails. Check the Terraform and Azure state before rerunning; reruns are not necessarily a rollback.
- A Destroy may be blocked by Terraform `prevent_destroy` protections or the explicit PRD guard. Do not work around those protections without an approved infrastructure change.

## Workflow maintenance

When changing CI/CD behavior, update this guide alongside the relevant workflow and check that the documentation matches its triggers, inputs, GitHub Environment use, versions, Terraform commands, and deployment package. Keep deployment credentials in GitHub Environment secrets, runtime secrets in Key Vault, and never add secret values or plan files to source control.
