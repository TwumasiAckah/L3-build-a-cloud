output "kubeconfig" {
  value     = stackit_ske_kubeconfig.ske_kubeconfig_l3.kube_config
  sensitive = true
}