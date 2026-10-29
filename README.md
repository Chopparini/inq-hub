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
- Python 3.9+
- PostgreSQL
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
│   │   ├── models/                # modele bazy danych
│   │   ├── routers/               # endpointy API
│   │   ├── schemas/               # walidacja danych
│   │   └── services/              # logika biznesowa
│   └── tests/
├── docs/
│   └── mockups/                   # makiety stron
├── frontend/
│   └── src/
│       ├── api/                   # komunikacja z backendem
│       ├── components/            # komponenty wielokrotnego użytku
│       ├── pages/                 # widoki/strony
│       └── types/                 # typy danych
├── shared/
└── README.md
```

## Branche

- `master` – stabilna wersja
- `development` – bieżąca praca, tu trafiają zmiany przed mergem do `master`
