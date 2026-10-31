-- =====================================================================
-- inq-hub – dane testowe do sprawdzenia schematu
-- Uruchamiać TYLKO na lokalnej bazie testowej, po schema.sql
-- Dane na podstawie frontend/src/api/mockData.json
-- =====================================================================

INSERT INTO users (username, email, hashed_password, role) VALUES
    ('admin',    'admin@hanka-kartony.pl',    'hash-tylko-do-testow', 'admin'),
    ('handlowy', 'handlowy@hanka-kartony.pl', 'hash-tylko-do-testow', 'sales');

INSERT INTO clients (name, nip, email, city) VALUES
    ('Logistyka PL Sp. z o.o.', '5260001234', 'zamowienia@logistykapl.pl', 'Wrocław'),
    ('E-sklep Sp. z o.o.',      '8990005678', 'biuro@esklep.pl',           'Poznań'),
    ('Fabryka Mebli SA',        NULL,         NULL,                        'Opole');

INSERT INTO products (name, box_type, flute, length_mm, width_mm, height_mm, base_price) VALUES
    ('Karton klapowy 400x300x200',         'flap',      'C',  400,  300, 200,  1.45),
    ('Karton fasonowy 250x150x80',         'die_cut',   'E',  250,  150,  80,  0.85),
    ('Karton wielogabarytowy 1200x800x600', 'oversized', 'BC', 1200, 800, 600, 12.30);

INSERT INTO stock (product_id, quantity, updated_by) VALUES
    (1, 15000, 1),
    (2, 40000, 1),
    (3, 800,   1);

-- Wycena z dwiema pozycjami (wielosztuki)
INSERT INTO quotes (number, client_id, created_by, updated_by, status, quote_date, valid_until, notes) VALUES
    ('WYC-1024', 1, 2, 2, 'accepted', '2026-10-14', '2026-11-14', 'Tektura 3-warstwowa szara');

INSERT INTO quote_items (quote_id, product_id, quantity, unit_price) VALUES
    (1, 1, 5000,  1.45),
    (1, 2, 10000, 0.80);   -- rabat względem ceny katalogowej 0.85

-- Podgląd: wycena z sumą
SELECT q.number,
       c.name                              AS klient,
       q.status,
       u.username                          AS zmienil,
       COUNT(i.id)                         AS pozycje,
       SUM(i.quantity * i.unit_price)      AS wartosc_zl
FROM quotes q
JOIN clients c     ON c.id = q.client_id
JOIN quote_items i ON i.quote_id = q.id
LEFT JOIN users u  ON u.id = q.updated_by
GROUP BY q.number, c.name, q.status, u.username;
