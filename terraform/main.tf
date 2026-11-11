terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Konfiguracja zdalnego stanu (Remote State) zapobiegająca konfliktom w zespole
  backend "azurerm" {
    resource_group_name  = "rg-terraform-storage"    # Nazwa grupy zasobów dla stanu (utworzona wcześniej)
    storage_account_name = "terraformstoragecalchub" # UWAGA: Ta nazwa musi być unikalna w całym Azure!
    container_name       = "tfstate"                 # Nazwa kontenera
    key                  = "prod.terraform.tfstate"  # Nazwa pliku stanu
  }
}

provider "azurerm" {
  features {}
}


# GRUPA ZASOBÓW I SIEĆ GŁÓWNA (Wymaganie E2)


# Grupa zasobów
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

# Główna sieć VNet
resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-projekt"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  address_space       = var.vnet_cidr
}


# PODSIECI (Wymaganie E3: Izolacja podsieci)


# Publiczna podsieć dla React (Web)
resource "azurerm_subnet" "snet_web" {
  name                 = "snet-web"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Prywatna podsieć dla FastAPI (App)
resource "azurerm_subnet" "snet_app" {
  name                 = "snet-app"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/24"]
  delegation {
    name = "containerapp-delegation"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Prywatna podsieć dla PostgreSQL (DB) z delegacją
resource "azurerm_subnet" "snet_db" {
  name                 = "snet-db"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.3.0/24"]
  delegation {
    name = "fs-delegation"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}


# ZAPORY SIECIOWE - NSG (Wymaganie E4)


# 1. NSG dla warstwy Web (Publiczna)
# Warstwa web z założenia publiczna - otwarte porty 80 i 443
#trivy:ignore:AZU-0047
resource "azurerm_network_security_group" "nsg_web" {
  name                = "nsg-web"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "Allow_HTTP_HTTPS_Internet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }
}

# 2. NSG dla warstwy App (Prywatna)
resource "azurerm_network_security_group" "nsg_app" {
  name                = "nsg-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  security_rule {
    name                       = "Allow_HTTPS_Inbound_ContainerApps"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow_TCP_Infrastructure_Subnet"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_ranges    = ["10250", "30000-32767"]
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow_TCP_8000_From_Web"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8000"
    source_address_prefix      = "10.0.1.0/24"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Deny_All_VirtualNetwork"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }
}

# 3. NSG dla warstwy DB (Prywatna)
resource "azurerm_network_security_group" "nsg_db" {
  name                = "nsg-db"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "Allow_TCP_5432_From_App"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "10.0.2.0/24"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Deny_All_VirtualNetwork"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }
}


# PRZYPISANIE NSG DO PODSIECI


resource "azurerm_subnet_network_security_group_association" "web_assoc" {
  subnet_id                 = azurerm_subnet.snet_web.id
  network_security_group_id = azurerm_network_security_group.nsg_web.id
}

resource "azurerm_subnet_network_security_group_association" "app_assoc" {
  subnet_id                 = azurerm_subnet.snet_app.id
  network_security_group_id = azurerm_network_security_group.nsg_app.id
}

resource "azurerm_subnet_network_security_group_association" "db_assoc" {
  subnet_id                 = azurerm_subnet.snet_db.id
  network_security_group_id = azurerm_network_security_group.nsg_db.id
}


# FRONTEND: STATIC WEB APPS (Obsługiwany region, np. westeurope)


resource "azurerm_static_web_app" "frontend" {
  name                = "swa-inqhub-frontend"
  resource_group_name = azurerm_resource_group.rg.name
  location            = "centralus" # swedencentral nie obsługuje Static Web Apps
  sku_tier            = "Free"
  sku_size            = "Free"
}


# BACKEND: CONTAINER APPS ENVIRONMENT & CONTAINER APP


resource "azurerm_container_app_environment" "cae" {
  name                           = "cae-inqhub"
  location                       = azurerm_resource_group.rg.location
  resource_group_name            = azurerm_resource_group.rg.name
  infrastructure_subnet_id       = azurerm_subnet.snet_app.id
  internal_load_balancer_enabled = false
  lifecycle {
    ignore_changes = [infrastructure_resource_group_name, workload_profile]
  }
}

resource "azurerm_container_app" "backend" {
  name                         = "ca-inqhub-backend"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"
  workload_profile_name = "Consumption"

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "backend"
      image  = "mcr.microsoft.com/k8se/quickstart:latest"
      cpu    = "0.25"
      memory = "0.5Gi"

      # Zmienne środowiskowe mapujące sekrety oraz adres frontendu
      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "SECRET_KEY"
        secret_name = "jwt-secret"
      }

      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://${azurerm_static_web_app.frontend.default_host_name}"
      }
    }
  }

  ingress {
    external_enabled           = true
    target_port                = 8000
    transport                  = "auto"
    allow_insecure_connections = false

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "jwt-secret"
    value = var.jwt_secret
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image
    ]
  }
}


