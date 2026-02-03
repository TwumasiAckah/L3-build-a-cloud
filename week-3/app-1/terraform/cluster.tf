resource "stackit_ske_cluster" "ske_cluster_l3" {
  project_id             = var.project_id
  name                   = "l3-cluster"
  kubernetes_version_min = "1.34"

  node_pools = [
    {
      name               = "node-pool"
      machine_type       = "g1a.2d"
      minimum            = 2
      maximum            = 2
      availability_zones = ["eu01-1", "eu01-2"]
      os_version_min     = "4459.2.1"
      os_name            = "flatcar"
      volume_size        = 60
      volume_type        = "storage_premium_perf6"
    }
  ]

    maintenance = {
    enable_kubernetes_version_updates    = true
    enable_machine_image_version_updates = true
    start                                = "01:00:00Z"
    end                                  = "02:00:00Z"
  }
}