# BAZA DANYCH POSTGRESQL W PODSIECI PRYWATNEJ (Blok 5 – E4)
#
# Azure Database for PostgreSQL Flexible Server wpięty w podsieć snet-db
# (delegacja już istnieje w main.tf). Dostęp tylko z wnętrza VNet –
# nsg-db wpuszcza ruch na 5432 wyłącznie z snet-app.


# ZMIENNE (wartości w terraform.tfvars – plik NIE trafia do repo)

variable "db_admin_login" {
  description = "Login administratora serwera PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_admin_password" {
  description = "Hasło administratora serwera PostgreSQL (min. 8 znaków, 3 z 4: małe, wielkie, cyfry, znaki specjalne)"
  type        = string
  sensitive   = true
}


# PRYWATNA STREFA DNS
# Serwer w VNet jest rozwiązywany po nazwie tylko przez prywatny DNS.
# Nazwa strefy MUSI kończyć się na .postgres.database.azure.com

resource "azurerm_private_dns_zone" "postgres" {
  name                = "inqhub.private.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "postgres-vnet-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  resource_group_name   = azurerm_resource_group.rg.name
}


# SERWER POSTGRESQL

resource "azurerm_postgresql_flexible_server" "db" {
  name                = "psql-inqhub"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  version             = "16"

  # Wpięcie w podsieć prywatną – przy delegated_subnet_id serwer nie ma
  # publicznego endpointu (w providerze azurerm 3.x dostęp publiczny
  # wyłącza się automatycznie, nie ustawiamy go ręcznie)
  delegated_subnet_id = azurerm_subnet.snet_db.id
  private_dns_zone_id = azurerm_private_dns_zone.postgres.id

  administrator_login    = var.db_admin_login
  administrator_password = var.db_admin_password

  # Najmniejszy rozmiar – mieści się w darmowej puli Azure Free
  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768

  backup_retention_days = 7

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]

  # Azure sam przydziela strefę dostępności – bez tego każdy plan
  # pokazywałby zmianę tego pola
  lifecycle {
    ignore_changes = [zone]
  }
}


# BAZA APLIKACJI

resource "azurerm_postgresql_flexible_server_database" "inqhub" {
  name      = "inqhub"
  server_id = azurerm_postgresql_flexible_server.db.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}


# OUTPUTY (bez hasła)

output "db_server_fqdn" {
  description = "Adres serwera PostgreSQL (rozwiązywany tylko wewnątrz VNet)"
  value       = azurerm_postgresql_flexible_server.db.fqdn
}

output "db_name" {
  value = azurerm_postgresql_flexible_server_database.inqhub.name
}
