variable "image_name" { default = "Ubuntu" }
variable "flavor_name" { default = "m1.small" }

variable "public_key"  {
  type = string
}

variable "worker_count" {
  default = 1
}