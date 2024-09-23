terraform {
    required_version = "1.9.6"

    backend "azurerm" {
      resource_group_name   = "rg-svl-global-westus2"
      storage_account_name  = "sttfsvlstateglobal"
      container_name        = "tf-state"
      key                   = "svl.tfstate"
    }
}

provider "azurerm" {
    features { }
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "group" {
    name        = var.resource_group_name
    location    = var.location
}

resource "azurerm_key_vault" "vault" {
  name                      = var.key_vault_name
  resource_group_name       = azurerm_resource_group.group.location
  location                  = azurerm_resource_group.group.location
  tenant_id                 = data.azurerm_client_config.current.tenant_id

  sku_name                  = "standard"
  enable_rbac_authorization = true
}

resource "azurerm_key_vault_secret" "azure_client_id" {
  name         = "AZURE-CLIENT-ID"
  key_vault_id = azurerm_key_vault.vault.id
  value        = var.app_client_id
}

resource "azurerm_key_vault_secret" "azure_client_secret" {
  name         = "AZURE-CLIENT-SECRET"
  key_vault_id = azurerm_key_vault.vault.id
  value        = var.app_client_secret
}

resource "azurerm_key_vault_secret" "azure_tenant_id" {
  name         = "AZURE-TENANT-ID"
  key_vault_id = azurerm_key_vault.vault.id
  value        = data.azurerm_client_config.current.tenant_id
}

resource "azurerm_key_vault_secret" "api_root" {
  name         = "API-ROOT"
  key_vault_id = azurerm_key_vault.vault.id
  value        = data.azurerm_client_config.current.tenant_id
}

resource "azurerm_key_vault_secret" "app_session_secret" {
  name         = "APP-SESSION-SECRET"
  key_vault_id = azurerm_key_vault.vault.id
  value        = var.app_session_secret
}

resource "azurerm_cosmosdb_account" "cosmos" {
  name                = var.db_name
  resource_group_name = azurerm_resource_group.group.location
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

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_cosmosdb_sql_container" "options" {
  name                = "Options"
  resource_group_name = azurerm_resource_group.group.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.database.name
  partition_key_paths = ["/id"]

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_service_plan" "plan" {
  name                = var.app_plan_name
  resource_group_name = azurerm_resource_group.group.name
  location            = azurerm_resource_group.group.location
  os_type             = "Linux"
  sku_name            = var.app_plan_sku
}

resource "azurerm_linux_web_app" "app" {
  name                = var.app_service_name
  resource_group_name = azurerm_resource_group.group.name
  location            = azurerm_resource_group.group.location
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    # If app plan sku is Free, F1, D1, or Shared, turn off always_on
    always_on = contains(["Free", "F1", "D1", "Shared"], azurerm_service_plan.plan.sku_name) ? false : true

    application_stack {
      node_version = "20-lts"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "API_ROOT": "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.vault.name};SecretName=API_ROOT)",
    "AZURE_CLIENT_ID": "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.vault.name};SecretName=AZURE_CLIENT_ID)",
    "AZURE_CLIENT_SECRET": "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.vault.name};SecretName=AZURE_SECRET_ID)",
    "AZURE_TENANT_ID": "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.vault.name};SecretName=AZURE_TENANT_ID)",
    "CLOUD_INSTANCE": "https://login.microsoftonline.com/",
    "GRAPH_API_ENDPOINT": "https://graph.microsoft.com/",
    "POST_LOGOUT_REDIRECT_URI": var.app_post_logout_redirect,
    "REDIRECT_URI": "http://localhost:8080/auth/redirect",
    "VAULT_URI": var.app_redirect_uri
  }
}

resource "azurerm_role_assignment" "app_secrets" {
  scope                 = azurerm_key_vault.vault.id
  role_definition_name  = "Key Vault Secrets Officer"
  principal_id          = azurerm_linux_web_app.app.id
}