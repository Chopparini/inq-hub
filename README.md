# inq-hub
Inq-Hub - System zarzadzania wycenami firmy sprzedażowej.

## Zespół
Nazwa: Hanka&Kartony 

Skład:  

1. PM/Backend: Paulina Piotrowska 95505  

2. Frontend: Olena Hakman 78207 

3. DBA/DevOps: Kornel Kopa 95162 

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
- Python 3.12+
- PostgreSQL 16 (lokalnie w Dockerze)
- [Node.js](https://nodejs.org/) 20+ (razem z npm)
> Na Linux/WSL najprościej zainstalować Node przez [nvm](https://github.com/nvm-sh/nvm): `nvm install --lts`

### Baza danych (Docker)

Z głównego katalogu repo:

```bash
cp .env.example .env   # uzupełnij POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
docker compose up -d
```

Plik `.env` jest w `.gitignore` – nie commituj go.
Przy pierwszym starcie Postgres sam wykonuje `docs/database/schema.sql` i `test_data.sql`.

```bash
docker compose down      # zatrzymanie, dane zostają
docker compose down -v   # zatrzymanie i usunięcie danych (przy zmianie schematu)
```


### Backend

Wymaga działającej lokalnie bazy danych.

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # uzupełnij DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000/api, Swagger: http://localhost:8000/docs

### Backend w Dockerze

```bash
cd backend
docker build -t inq-hub-backend .
docker run --rm -p 8000:8000 -e "DATABASE_URL=postgresql+psycopg://USER:HASLO@host.docker.internal:5432/inqhub" inq-hub-backend
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Aplikacja: http://localhost:5173

### Frontend w Dockerze

```bash
cd frontend
docker build -t inq-hub-frontend --build-arg VITE_API_BASE_URL=http://localhost:8000/api .
docker run -d -p 8080:80 --name inq-hub-frontend inq-hub-frontend
```

Aplikacja: http://localhost:8080

Zatrzymanie i usunięcie kontenera:
```bash
docker stop inq-hub-frontend && docker rm inq-hub-frontend
```



## Funkcjonalności

- Rejestracja i logowanie
- Zapis i przeglądanie wycen/ofert 

## API

- Swagger (testowanie): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI, np. do importu w Postmanie: http://localhost:8000/openapi.json

| Metoda | Ścieżka | Opis | Statusy |
|---|---|---|---|
| GET | `/health` | stan serwera i połączenia z bazą | 200, 500 |
| GET | `/quotes` | lista wycen z klientem i sumą | 200, 500 |
| GET | `/quotes/{id}` | szczegóły wyceny z pozycjami | 200, 400, 404, 500 |
| POST | `/quotes` | utworzenie wyceny, numer nadaje serwer | 201, 400, 500 |
| PUT | `/quotes/{id}` | zastąpienie nagłówka i pozycji wyceny | 200, 400, 404, 500 |
| DELETE | `/quotes/{id}` | usunięcie wyceny z pozycjami | 204, 400, 404, 500 |
| GET | `/clients` | lista klientów do formularza | 200, 500 |
| GET | `/products` | lista aktywnych produktów do formularza | 200, 500 |

### Postman

```bash
curl -X POST http://localhost:8000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{"clientId": 2, "items": [{"productId": 1, "quantity": 500}]}'
```


## Struktura projektu

```
inq-hub/
├── backend/
│   ├── app/
│   │   ├── core/                  # konfiguracja, połączenie z bazą, obsługa błędów
│   │   ├── models/                # modele bazy danych
│   │   ├── routers/               # endpointy API
│   │   ├── schemas/               # walidacja danych
│   │   ├── services/              # logika biznesowa
│   │   └── main.py                # aplikacja FastAPI
│   ├── tests/
│   └── requirements.txt
├── docs/
│   ├── database/                  # schemat bazy i dane testowe
│   └── mockups/                   # makiety stron
├── frontend/
│   └── src/
│       ├── api/                   # komunikacja z backendem
│       ├── components/            # komponenty wielokrotnego użytku
│       ├── pages/                 # widoki/strony
│       └── types/                 # typy danych
├── shared/
├── terraform/                     # infrastruktura Azure
├── docker-compose.yml             # lokalna baza danych
└── README.md
```

## Architektura

```mermaid
flowchart LR
    U[Przeglądarka użytkownika]
    subgraph VNET[vnet-projekt 10.0.0.0/16 – Azure]
        subgraph WEB[snet-web 10.0.1.0/24 – publiczna]
            N[Nginx + React]
        end
        subgraph APP[snet-app 10.0.2.0/24 – prywatna]
            A[FastAPI :8000]
        end
        subgraph DB[snet-db 10.0.3.0/24 – prywatna]
            P[(PostgreSQL :5432)]
        end
    end
    U -- HTTP/HTTPS 80/443 --> N
    N -- REST /api :8000 --> A
    A -- SQL :5432 --> P
```

## Branche

- `master` – stabilna wersja
- `development` – bieżąca praca, tu trafiają zmiany przed mergem do `master`
