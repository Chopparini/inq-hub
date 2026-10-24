terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  # Konfiguracja zdalnego stanu (Remote State) zapobiegająca konfliktom w zespole
  backend "azurerm" {
    resource_group_name  = "rg-terraform-storage"       # Nazwa grupy zasobów dla stanu (utworzona wcześniej)
    storage_account_name = "terraformstoragecalchub"    # UWAGA: Ta nazwa musi być unikalna w całym Azure!
    container_name       = "tfstate"                  # Nazwa kontenera
    key                  = "prod.terraform.tfstate"   # Nazwa pliku stanu
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
    name                       = "Allow_TCP_8000_From_Web"
    priority                   = 100
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