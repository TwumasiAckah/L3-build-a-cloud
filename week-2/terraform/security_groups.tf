# Create a security group for the k8s cluster
resource "openstack_networking_secgroup_v2" "k8s_sec_group" {
  name        = "k8s_sec_group"
  description = "k8s Cluster Security Group"
}

# Allow SSH
resource "openstack_networking_secgroup_rule_v2" "ssh" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 22
  port_range_max    = 22
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.k8s_sec_group.id
}

# Allow Kubernetes API
resource "openstack_networking_secgroup_rule_v2" "k8s_api" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 6443
  port_range_max    = 6443
  remote_ip_prefix  = "192.168.233.0/24"
  security_group_id = openstack_networking_secgroup_v2.k8s_sec_group.id
}

# Allow ICMP (Ping)
resource "openstack_networking_secgroup_rule_v2" "allow_ping" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "icmp"
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.k8s_sec_group.id
}

# Allow Internal Traffic
resource "openstack_networking_secgroup_rule_v2" "sg_rule_internal" {
	direction = "ingress"
	ethertype = "IPv4"
	protocol = "tcp"
	remote_group_id = openstack_networking_secgroup_v2.k8s_sec_group.id
	security_group_id = openstack_networking_secgroup_v2.k8s_sec_group.id
}