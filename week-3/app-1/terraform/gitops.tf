# resource "helm_release" "argocd" {
#   name             = "argocd"
#   repository       = "https://argoproj.github.io/argo-helm"
#   chart            = "argo-cd"
#   namespace        = "argocd"
#   create_namespace = true
#   version          = "7.7.0"

#   # Ensure the cluster exists first
#   depends_on = [stackit_ske_cluster.ske_cluster_l3]
# }