variable "arm_client_id" {
  default   = "#{{ARM_CLIENT_ID}}"
  sensitive = true
}

variable "arm_client_secret" {
  default   = "#{{ARM_CLIENT_SECRET}}"
  sensitive = true
}

variable "app_client_id" {
  default   = "#{{APP_CLIENT_ID}}"
  sensitive = true
}

variable "app_post_logout_redirect" {
  default = "#{{POST_LOGOUT_REDIRECT_URI}}"
}

variable "app_redirect_uri" {
  default = "#{{REDIRECT_URI}}"
}

variable "app_session_secret" {
  default   = "#{{APP_SESSION_SECRET}}"
  sensitive = true
}

variable "api_root" {
  default   = "#{{API_ROOT}}"
}

variable "app_client_secret" {
  default     = "#{{APP_CLIENT_SECRET}}"
  sensitive   = true
}

variable "app_plan_name" {
  default = "#{{APP_PLAN_NAME}}"
}

variable "app_plan_sku" {
  default = "#{{APP_PLAN_SKU}}"
}

variable "app_service_name" {
  default = "#{{APP_SERVICE_NAME}}"
}

variable "azure_sub_id" {
  default = "#{{AZURE_SUB_ID}}"
}

variable "azure_tenant_id" {
  default   = "#{{AZURE_TENANT_ID}}"
  sensitive = true
}

variable "db_name" {
  default = "#{{DB_NAME}}"
}

variable "key_vault_name" {
  default = "#{{VAULT_NAME}}"
}

variable "resource_group_location" {
  default = "#{{RESOURCE_GROUP_LOCATION}}"
}

variable "resource_group_name" {
  default = "#{{RESOURCE_GROUP_NAME}}"
}