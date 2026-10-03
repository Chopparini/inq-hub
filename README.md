# inq-hub
System zarzadzania wycenami firmy sprzedażowej.

## Stack

| Warstwa | Technologie |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React,  TypeScript, Tailwind CSS |
| DBA | PostgreSQL - Azure Database for PostgreSQL / MySQL  |

## Deploy

## Uruchomienie lokalne

```bash
git clone https://github.com/Chopparini/inq-hub.git
cd inq-hub
```

### Wymagania
- Python 3.9+
- PostgreSQL

## Funkcjonalności

### Konto użytkownika
- Rejestracja i logowanie
- Zapis i przeglądanie wycen/ofert 

### Testowanie API (Postman / Swagger)


## Struktura projektu

```
inq-hub/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   ├── models/models.py       # modele bazy danych
│   │   ├── routers/               # endpointy API
│   │   ├── schemas/               # walidacja danych
│   │   └── services/       
│   └── tests/
├── frontend/
│   └── src/
├── shared/

```
