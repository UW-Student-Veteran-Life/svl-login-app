variable "arm_client_id" {
  default   = "#{ARM_CLIENT_ID}"
  sensitive = true
}

variable "arm_client_secret" {
  default   = "#{ARM_CLIENT_SECRET}"
  sensitive = true
}

variable "app_client_id" {
  default   = "#{APP_CLIENT_ID}"
  sensitive = true
}

variable "app_post_logout_redirect" {
  default = "#{POST_LOGOUT_REDIRECT_URI}"
}

variable "app_redirect_uri" {
  default = "#{REDIRECT_URI}"
}

variable "app_session_secret" {
  default   = "#{APP_SESSION_SECRET}"
  sensitive = true
}

variable "api_root" {
  default   = "#{API_ROOT}"
}

variable "app_client_secret" {
  default     = "#{APP_CLIENT_SECRET}"
  sensitive   = true
}

variable "app_plan_sku" {
  default = "#{APP_PLAN_SKU}"
}

variable "env_name" {
  default = "#{ENV_NAME}"
}

variable "resource_group_location" {
  default = "#{RESOURCE_GROUP_LOCATION}"
}