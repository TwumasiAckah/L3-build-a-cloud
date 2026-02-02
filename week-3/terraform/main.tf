terraform {
    required_providers {
        stackit = {
            source  = "stackitcloud/stackit"
            version = "~> 0.79.0"
        }
        helm = {
            source  = "hashicorp/helm"
            version = "~> 2.9.0"
        }
    }
}

# Authentication: Key flow (using path)
provider "stackit" {
  default_region           = "eu01"
  service_account_key_path = var.service_account_key_path
  private_key_path         = var.private_key_path
}

# Helm provider configuration
provider "helm" {
  kubernetes {
    config_path = "${path.module}/kubeconfig.yaml"
  }
}
