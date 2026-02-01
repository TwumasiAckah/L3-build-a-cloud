# Get the ID of the available public network in OpenStack
data "openstack_networking_network_v2" "public_network" {
  name = "public"
}

# Create a private network
resource "openstack_networking_network_v2" "network_1" {
  name           = "network_1"
  admin_state_up = "true"
}

# Create a subnet in the private network
resource "openstack_networking_subnet_v2" "subnet_1" {
  name       = "subnet_1"
  network_id = openstack_networking_network_v2.network_1.id
  cidr       = "192.168.233.0/24"
  ip_version = 4
  dns_nameservers = ["8.8.8.8", "1.1.1.1"]
}

# Create a router to connect the private network to the public network
resource "openstack_networking_router_v2" "router_1" {
  name           = "router_1"
  admin_state_up = true
  external_network_id = data.openstack_networking_network_v2.public_network.id
}

# Create a router interface to connect the subnet to the router
resource "openstack_networking_router_interface_v2" "vm_iface" {
  router_id = openstack_networking_router_v2.router_1.id
  subnet_id = openstack_networking_subnet_v2.subnet_1.id
}

