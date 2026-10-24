variable "resource_group_name" {
  description = "Nazwa grupy zasobów"
  type        = string
  default     = "rg-wsb-projekt"
}

variable "location" {
  description = "Region wdrożenia Azure"
  type        = string
  default     = "swedencentral"
}

variable "vnet_cidr" {
  description = "Pula adresów dla głównej sieci VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}