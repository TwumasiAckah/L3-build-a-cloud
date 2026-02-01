# Get SSH Key from variable and create Key Pair
resource "openstack_compute_keypair_v2" "k8s_keypair" {
  name = "key_for_all"
  public_key = var.public_key
}

# Create Control Plane Node
resource "openstack_compute_instance_v2" "control_plane" {
  name = "control-plane"
  image_name = var.image_name
  flavor_name = "m1.medium"
  key_pair = openstack_compute_keypair_v2.k8s_keypair.name
  security_groups = [openstack_networking_secgroup_v2.k8s_sec_group.name, "default"]

  network {
    uuid = openstack_networking_network_v2.network_1.id
  }

  depends_on = [openstack_networking_router_interface_v2.vm_iface]

  # user_data = file("../cloud-init.yaml")
}

# Create Worker Node
resource "openstack_compute_instance_v2" "worker_node" {
  count = 1
  name = "worker-node-${count.index}"
  image_name = var.image_name
  flavor_name = var.flavor_name
  key_pair = openstack_compute_keypair_v2.k8s_keypair.name
  security_groups = [openstack_networking_secgroup_v2.k8s_sec_group.name, "default"]

  network {
    uuid = openstack_networking_network_v2.network_1.id
  }

  depends_on = [openstack_networking_router_interface_v2.vm_iface]

  # user_data = templatefile(
  #   "../cloud-init.yaml",
  #   {
  #     CONTROL_PLANE_IP = openstack_compute_instance_v2.control_plane.network[0].fixed_ip_v4
  #     hostname = "worker_node"
  #   }
  # )
}

resource "openstack_networking_floatingip_v2" "control_floatip" {
  pool = "public"
}

resource "openstack_compute_floatingip_associate_v2" "control_floatip_associate" {
	floating_ip = openstack_networking_floatingip_v2.control_floatip.address
	instance_id = openstack_compute_instance_v2.control_plane.id
}


resource "openstack_networking_floatingip_v2" "worker_floatip" {
  count = var.worker_count
  pool = "public"
}

resource "openstack_compute_floatingip_associate_v2" "worker_floatip_associate" {
  count = var.worker_count
	floating_ip = openstack_networking_floatingip_v2.worker_floatip[count.index].address
	instance_id = openstack_compute_instance_v2.worker_node[count.index].id
}

