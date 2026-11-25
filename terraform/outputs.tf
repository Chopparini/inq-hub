output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "vnet_id" {
  description = "ID głównej sieci VNet"
  value       = azurerm_virtual_network.vnet.id
}

output "subnet_web_id" {
  value = azurerm_subnet.snet_web.id
}

output "subnet_app_id" {
  value = azurerm_subnet.snet_app.id
}

output "subnet_db_id" {
  value = azurerm_subnet.snet_db.id
}

# OUTPUTY (Adresy dla GitHub Actions)


output "frontend_url" {
  description = "Adres URL frontendu (Container App)"
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}