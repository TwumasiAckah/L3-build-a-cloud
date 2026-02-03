terraform {
    required_providers {
        stackit = {
            source  = "stackitcloud/stackit"
            version = "~> 0.79.0"
        }
        # helm = {
        #     source  = "hashicorp/helm"
        #     version = "~> 2.9.0"
        # }
    }
}

# Authentication: Key flow (using path)
provider "stackit" {
  default_region           = "eu01"
  service_account_key_path = var.service_account_key_path
  private_key_path         = var.private_key_path
}

# Helm provider configuration
# provider "helm" {
#   kubernetes {
#     config_path = "${path.module}/kubeconfig.yaml"
#   }
# }

# locals {
#   # Parse the raw YAML string into a Terraform object
#   kubeconfig_data = yamldecode(stackit_ske_kubeconfig.ske_kubeconfig_l3.kube_config)
# }

# provider "helm" {
#   kubernetes {
#     # Extract values from the decoded YAML structure
#     host = local.kubeconfig_data.clusters[0].cluster.server

#     client_certificate = base64decode(
#       local.kubeconfig_data.users[0].user.client-certificate-data
#     )
    
#     client_key = base64decode(
#       local.kubeconfig_data.users[0].user.client-key-data
#     )
    
#     cluster_ca_certificate = base64decode(
#       local.kubeconfig_data.clusters[0].cluster.certificate-authority-data
#     )
#   }
# }