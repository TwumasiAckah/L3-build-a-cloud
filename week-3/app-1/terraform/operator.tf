# resource "helm_release" "cnpg_operator" {
#   name             = "cloudnative-pg"
#   repository       = "https://cloudnative-pg.github.io/charts"
#   chart            = "cloudnative-pg"
#   version          = "0.22.1"
#   namespace        = "cnpg-system"
#   create_namespace = true

#   depends_on = [
#     stackit_ske_cluster.ske_cluster_l3
#   ]
# }