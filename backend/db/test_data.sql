-- =====================================================================
-- inq-hub – konta testowe dla lokalnej bazy (hasło: demo123)
-- Dane startowe (klienci, produkty, wyceny) ładuje seed.sql
-- =====================================================================

INSERT INTO users (username, first_name, last_name, email, hashed_password, role) VALUES
    ('admin',    NULL,    NULL,     'admin@hanka-kartony.pl',    '$argon2id$v=19$m=65536,t=3,p=4$oqbJcKmagvXSc1o7nUB71g$hv+PnUC7sNWWdMdTt5jwIAHQlaY/T4DW/Eao+JATn/U', 'admin'),
    ('handlowy', 'Olena', 'Hakman', 'handlowy@hanka-kartony.pl', '$argon2id$v=19$m=65536,t=3,p=4$aJFBSUARx/erQfE5NbCu+g$4cFP7qkIUjklNhlacbYWgeFNhTLhUhXnlKzlq1eEhII', 'sales');

