output "control_access_ip" {
  value = openstack_compute_instance_v2.control_plane.access_ip_v4
}

output "worker_access_ips" {
  value = openstack_compute_instance_v2.worker_node[*].access_ip_v4
}


output "control_public_ip" {
	value = openstack_networking_floatingip_v2.control_floatip.address
}

output "worker_public_ips" {
  value = openstack_networking_floatingip_v2.worker_floatip[*].address
}
