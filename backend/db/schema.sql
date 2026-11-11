-- =====================================================================
-- inq-hub – schemat bazy danych (PostgreSQL 16)
-- Wersja: propozycja do przeglądu (Blok 5 – E4)
-- =====================================================================
-- Kolejność ma znaczenie: najpierw typy (enum), potem tabele bez
-- kluczy obcych, na końcu tabele, które się do nich odwołują.
-- =====================================================================


-- ---------------------------------------------------------------------
-- TYPY WYLICZENIOWE (enum)
-- ---------------------------------------------------------------------

-- Rola użytkownika w systemie
CREATE TYPE user_role AS ENUM (
    'admin',        -- administrator systemu
    'sales'         -- handlowiec przygotowujący wyceny
);

-- Status wyceny
CREATE TYPE quote_status AS ENUM (
    'draft',        -- wersja robocza
    'sent',         -- wysłana do klienta
    'accepted',     -- zaakceptowana przez klienta
    'rejected'      -- odrzucona przez klienta
);

-- Typ kartonu (konstrukcja)
CREATE TYPE box_type AS ENUM (
    'flap',         -- karton klapowy (FEFCO 0201)
    'die_cut',      -- karton fasonowy
    'oversized',    -- karton wielogabarytowy
    'auto_bottom'   -- karton z automatycznym dnem
);

-- Rodzaj fali tektury (grubość warstwy falistej)
-- DO DECYZJI KORNELA: lista i opisy
CREATE TYPE flute_type AS ENUM (
    'B',            -- fala B, ok. 3 mm
    'C',            -- fala C, ok. 4 mm
    'E',            -- fala E (mikrofala), ok. 1,5 mm
    'BC'            -- fala BC, tektura 5-warstwowa, ok. 7 mm
);


-- ---------------------------------------------------------------------
-- UŻYTKOWNICY (logowanie po username)
-- ---------------------------------------------------------------------

CREATE TABLE users (
    id               SERIAL PRIMARY KEY,
    username         VARCHAR(50)  NOT NULL UNIQUE,
    email            VARCHAR(255) NOT NULL UNIQUE,
    hashed_password  VARCHAR(255) NOT NULL,          -- tylko hash, nigdy hasło jawne
    role             user_role    NOT NULL DEFAULT 'sales',
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------
-- KLIENCI
-- ---------------------------------------------------------------------

CREATE TABLE clients (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,          -- nazwa firmy
    nip              VARCHAR(10)  UNIQUE,            -- NIP bez kresek
    email            VARCHAR(255),
    phone            VARCHAR(20),
    contact_person   VARCHAR(100),                   -- osoba kontaktowa
    street           VARCHAR(255),
    postal_code      VARCHAR(6),                     -- format 00-000
    city             VARCHAR(100),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_clients_nip CHECK (nip IS NULL OR nip ~ '^[0-9]{10}$')
);

CREATE INDEX idx_clients_name ON clients (name);


-- ---------------------------------------------------------------------
-- PRODUKTY (katalog kartonów)
-- ---------------------------------------------------------------------

CREATE TABLE products (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255)  NOT NULL,         -- np. "Karton klapowy 400x300x200"
    box_type         box_type      NOT NULL,
    flute            flute_type    NOT NULL,
    length_mm        INTEGER       NOT NULL,
    width_mm         INTEGER       NOT NULL,
    height_mm        INTEGER       NOT NULL,
    base_price       NUMERIC(10,2) NOT NULL,         -- cena katalogowa za sztukę (zł)
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,  -- wycofany produkt zostaje w starych wycenach
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by       INTEGER       REFERENCES users (id),  -- kto ostatnio zmienił (np. cenę)

    CONSTRAINT chk_products_dimensions CHECK (length_mm > 0 AND width_mm > 0 AND height_mm > 0),
    CONSTRAINT chk_products_price      CHECK (base_price > 0)
);


-- ---------------------------------------------------------------------
-- STAN MAGAZYNOWY (1 wiersz na produkt)
-- ---------------------------------------------------------------------

CREATE TABLE stock (
    product_id       INTEGER      PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
    quantity         INTEGER      NOT NULL DEFAULT 0,  -- sztuk na magazynie
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by       INTEGER      REFERENCES users (id),   -- kto ostatnio zmienił stan

    CONSTRAINT chk_stock_quantity CHECK (quantity >= 0)
);


-- ---------------------------------------------------------------------
-- WYCENY (nagłówek)
-- created_by / updated_by mogą być NULL do czasu wprowadzenia logowania
-- ---------------------------------------------------------------------

CREATE TABLE quotes (
    id               SERIAL PRIMARY KEY,
    number           VARCHAR(20)  NOT NULL UNIQUE,   -- numer do wyświetlania, np. "WYC-1024"
    client_id        INTEGER      NOT NULL REFERENCES clients (id),
    created_by       INTEGER      REFERENCES users (id),  -- NULL do czasu wprowadzenia logowania
    status           quote_status NOT NULL DEFAULT 'draft',
    quote_date       DATE         NOT NULL DEFAULT CURRENT_DATE,
    valid_until      DATE,                           -- data ważności oferty
    notes            TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by       INTEGER      REFERENCES users (id),  -- kto ostatnio zmienił

    CONSTRAINT chk_quotes_valid_until CHECK (valid_until IS NULL OR valid_until >= quote_date)
);

CREATE INDEX idx_quotes_client ON quotes (client_id);
CREATE INDEX idx_quotes_status ON quotes (status);


-- ---------------------------------------------------------------------
-- POZYCJE WYCENY (kilka produktów w jednej wycenie)
-- ---------------------------------------------------------------------

CREATE TABLE quote_items (
    id               SERIAL PRIMARY KEY,
    quote_id         INTEGER       NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
    product_id       INTEGER       NOT NULL REFERENCES products (id),
    quantity         INTEGER       NOT NULL,          -- nakład w sztukach
    unit_price       NUMERIC(10,2) NOT NULL,          -- cena w chwili wyceny (kopia, nie odwołanie do cennika!)
    notes            TEXT,                            -- np. nadruk, specjalne wymagania

    CONSTRAINT chk_quote_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_quote_items_price    CHECK (unit_price > 0),
    CONSTRAINT uq_quote_items_product   UNIQUE (quote_id, product_id)
);

CREATE INDEX idx_quote_items_quote ON quote_items (quote_id);
