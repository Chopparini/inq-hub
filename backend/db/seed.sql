-- Dane startowe dla bazy w chmurze (po schema.sql i utworzeniu użytkowników przez init_db)
-- Użytkownicy: 1 = admin, 2 = handlowy

INSERT INTO clients (name, nip, email, city) VALUES
    ('Logistyka PL Sp. z o.o.', '5260001234', 'zamowienia@logistykapl.pl', 'Wrocław'),
    ('E-sklep Sp. z o.o.',      '8990005678', 'biuro@esklep.pl',           'Poznań'),
    ('Fabryka Mebli SA',        NULL,         NULL,                        'Opole'),
    ('BioFood Natural',         '7740009876', 'zakupy@biofood.pl',         'Kraków'),
    ('Polsklep RTV',            '1130004321', 'logistyka@polsklep.pl',     'Warszawa');

INSERT INTO products (name, box_type, flute, length_mm, width_mm, height_mm, base_price) VALUES
    ('Karton klapowy 400x300x200',          'flap',      'C',  400,  300, 200,  1.45),
    ('Karton fasonowy 250x150x80',          'die_cut',   'E',  250,  150,  80,  0.85),
    ('Karton wielogabarytowy 1200x800x600', 'oversized', 'BC', 1200, 800, 600, 12.30),
    ('Karton fasonowy 320x220x110',         'die_cut',   'B',  320,  220, 110,  2.10),
    ('Karton klapowy 600x400x350',          'flap',      'C',  600,  400, 350,  4.80);

INSERT INTO stock (product_id, quantity, updated_by) VALUES
    (1, 15000, 1),
    (2, 40000, 1),
    (3, 800,   1),
    (4, 6000,  1),
    (5, 2500,  1);

INSERT INTO quotes (number, client_id, created_by, updated_by, status, quote_date, valid_until, notes) VALUES
    ('WYC-1020', 5, 2, 2, 'sent',     '2026-10-08', '2026-11-08', 'Standard wysyłkowy, paczkomat gabaryt C'),
    ('WYC-1021', 4, 2, 2, 'accepted', '2026-10-10', '2026-11-10', 'Nadruk flexo jednokolorowy'),
    ('WYC-1022', 3, 2, 2, 'draft',    '2026-10-12', '2026-11-12', 'Tektura 5-warstwowa wzmocniona, klejona'),
    ('WYC-1023', 2, 2, 2, 'sent',     '2026-10-13', '2026-11-13', 'Mikrofala biała z paskiem klejowym'),
    ('WYC-1024', 1, 2, 2, 'accepted', '2026-10-14', '2026-11-14', 'Tektura 3-warstwowa szara'),
    ('WYC-1025', 2, 2, 2, 'rejected', '2026-10-20', '2026-11-20', 'Klient wybrał tańszą ofertę'),
    ('WYC-1026', 1, 2, 2, 'draft',    '2026-11-05', '2026-12-05', NULL);

INSERT INTO quote_items (quote_id, product_id, quantity, unit_price) VALUES
    (1, 5, 1200,  4.80),
    (2, 4, 2500,  2.10),
    (3, 3, 500,   12.30),
    (4, 2, 10000, 0.85),
    (5, 1, 5000,  1.45),
    (5, 2, 10000, 0.80),
    (6, 1, 2000,  1.50),
    (6, 4, 1000,  2.10),
    (7, 5, 300,   4.80);
