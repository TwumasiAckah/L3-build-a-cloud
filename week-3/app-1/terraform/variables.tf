variable "project_id" {
    description = "Project ID"
    type = string
}

variable "service_account_key_path" {
    description = "Service Account Key Path"
    type = string

  validation {
    condition = fileexists(var.service_account_key_path)
    error_message = "The service account key file was not found."
  }
}

variable "private_key_path" {
  description = "The local path to private key"
  type = string

  validation {
    condition = fileexists(var.private_key_path)
    error_message = "The private key file was not found at the specified path."
  }
}