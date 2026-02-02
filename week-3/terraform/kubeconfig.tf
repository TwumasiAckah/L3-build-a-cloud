resource "stackit_ske_kubeconfig" "ske_kubeconfig_l3" {
  project_id   = var.project_id
  cluster_name = stackit_ske_cluster.ske_cluster_l3.name

  refresh        = true
  expiration     = 86400 # 24 hours
  refresh_before = 3600 # 1 hour
}