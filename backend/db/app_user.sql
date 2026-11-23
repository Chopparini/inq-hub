-- Użytkownik aplikacji dla lokalnej bazy: tylko operacje na danych, bez zmian schematu
CREATE ROLE inqhub_app LOGIN PASSWORD 'demo123';
GRANT CONNECT ON DATABASE inqhub TO inqhub_app;
GRANT USAGE ON SCHEMA public TO inqhub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO inqhub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO inqhub_app;
