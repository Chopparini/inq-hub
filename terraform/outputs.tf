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
  description = "Adres URL frontendu Static Web Apps"
  value       = "https://${azurerm_static_web_app.frontend.default_host_name}"
}

output "backend_url" {
  description = "Adres URL backendu Container App z prefiksem /api"
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}/api"
}

output "static_web_app_api_token" {
  description = "Klucz wdrożeniowy dla Static Web Apps do GitHub Secrets"
  value       = azurerm_static_web_app.frontend.api_key
  sensitive   = true
}
