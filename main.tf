terraform {
    required_version = "1.9.6"

    backend "azurerm" {
      resource_group_name   = "rg-svl-global-westus2"
      storage_account_name  = "sttfsvlstateglobal"
      container_name        = "tf-state"
      key                   = "svl.#{ENV_NAME}.tfstate"
    }
}

provider "azurerm" {
    features { }
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "group" {
    name        = "rg-svl-${var.env_name}-${var.resource_group_location}"
    location    = var.resource_group_location
}

resource "azurerm_key_vault" "vault" {
  name                      = "kv-svl-${var.env_name}-${azurerm_resource_group.group.location}"
  resource_group_name       = azurerm_resource_group.group.name
  location                  = azurerm_resource_group.group.location
  tenant_id                 = data.azurerm_client_config.current.tenant_id

  sku_name                  = "standard"
  enable_rbac_authorization = true
}

resource "azurerm_role_assignment" "key_vault_admin" {
  scope                 = azurerm_key_vault.vault.id
  role_definition_name  = "Key Vault Administrator"
  principal_id          = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault_secret" "azure_client_id" {
  depends_on   = [ azurerm_role_assignment.key_vault_admin ]
  name         = "APP-CLIENT-ID"
  key_vault_id = azurerm_key_vault.vault.id
  value        = var.app_client_id
}

resource "azurerm_key_vault_secret" "azure_client_secret" {
  depends_on   = [ azurerm_role_assignment.key_vault_admin ]
  name         = "APP-CLIENT-SECRET"
  key_vault_id = azurerm_key_vault.vault.id
  value        = var.app_client_secret
}

resource "azurerm_key_vault_secret" "azure_tenant_id" {
  depends_on   = [ azurerm_role_assignment.key_vault_admin ]
  name         = "AZURE-TENANT-ID"
  key_vault_id = azurerm_key_vault.vault.id
  value        = data.azurerm_client_config.current.tenant_id
}

resource "azurerm_key_vault_secret" "api_root" {
  depends_on   = [ azurerm_role_assignment.key_vault_admin ]
  name         = "API-ROOT"
  key_vault_id = azurerm_key_vault.vault.id
  value        = var.api_root
}

resource "azurerm_key_vault_secret" "app_session_secret" {
  depends_on   = [ azurerm_role_assignment.key_vault_admin ]
  name         = "APP-SESSION-SECRET"
  key_vault_id = azurerm_key_vault.vault.id
  value        = var.app_session_secret
}

resource "azurerm_key_vault_certificate" "uw_cert" {
  depends_on    = [ azurerm_role_assignment.key_vault_admin ]
  name          = "svlcardreader-vetlife-washington-edu"
  key_vault_id  = azurerm_key_vault.vault.id

  certificate {
    contents    = var.uw_cert
  }
}

resource "azurerm_cosmosdb_account" "cosmos" {
  name                = "cosmos-svl-${var.env_name}-${azurerm_resource_group.group.location}"
  resource_group_name = azurerm_resource_group.group.name
  location            = azurerm_resource_group.group.location
  offer_type          = "Standard"

  geo_location {
    location          = "westus"
    failover_priority = 0
  }

  consistency_policy {
    consistency_level = "Session"
    }
}

resource "azurerm_key_vault_secret" "cosmos" {
  key_vault_id  = azurerm_key_vault.vault.id
  name          = "DB-CONN"
  value         = azurerm_cosmosdb_account.cosmos.primary_sql_connection_string
}

resource "azurerm_cosmosdb_sql_database" "database" {
  name                = "SVL"
  resource_group_name = azurerm_resource_group.group.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
}

resource "azurerm_cosmosdb_sql_container" "logins" {
  name                = "Logins"
  resource_group_name = azurerm_resource_group.group.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.database.name
  partition_key_paths = ["/id"]
  default_ttl         = 86400
}

resource "azurerm_cosmosdb_sql_container" "options" {
  name                = "Options"
  resource_group_name = azurerm_resource_group.group.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.database.name
  partition_key_paths = ["/id"]
}

resource "azurerm_application_insights" "logs" {
  name                = "appi-svl-${var.env_name}-${azurerm_resource_group.group.location}"
  location            = azurerm_resource_group.group.location
  resource_group_name = azurerm_resource_group.group.name
  application_type    = "Node.JS"
}

resource "azurerm_service_plan" "plan" {
  name                = "asp-svl-${var.env_name}-${azurerm_resource_group.group.location}"
  resource_group_name = azurerm_resource_group.group.name
  location            = azurerm_resource_group.group.location
  os_type             = "Linux"
  sku_name            = var.app_plan_sku
}

resource "azurerm_linux_web_app" "app" {
  name                = "app-svl-${var.env_name}-${azurerm_resource_group.group.location}"
  resource_group_name = azurerm_resource_group.group.name
  location            = azurerm_resource_group.group.location
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    # If app plan sku is Free, F1, D1, or Shared, turn off always_on
    always_on = contains(["Free", "F1", "D1", "Shared"], azurerm_service_plan.plan.sku_name) ? false : true

    app_command_line = "node /home/site/wwwroot/server.js"

    application_stack {
      node_version = "20-lts"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "API_ROOT": "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.vault.name};SecretName=API-ROOT)",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": azurerm_application_insights.logs.connection_string,
    "MSAL_CLIENT_ID": "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.vault.name};SecretName=APP-CLIENT-ID)",
    "MSAL_CLIENT_SECRET": "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.vault.name};SecretName=APP-CLIENT-SECRET)",
    "MSAL_TENANT_ID": "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.vault.name};SecretName=AZURE-TENANT-ID)",
    "CLOUD_INSTANCE": "https://login.microsoftonline.com/",
    "GRAPH_API_ENDPOINT": "https://graph.microsoft.com/",
    "POST_LOGOUT_REDIRECT_URI": var.app_post_logout_redirect,
    "REDIRECT_URI": var.app_redirect_uri
    "VAULT_URI": azurerm_key_vault.vault.vault_uri
  }
}

resource "azurerm_role_assignment" "app_secrets" {
  scope                 = azurerm_key_vault.vault.id
  role_definition_name  = "Key Vault Secrets Officer"
  principal_id          = azurerm_linux_web_app.app.identity[0].principal_id
}