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

Aplikacja integruje się bezpośrednio przez REST API z usługą FastAPI oraz bazą PostgreSQL działającą w kontenerze Docker.

---

1. **Pełny cykl operacji CRUD:**
   * **Odczyt listy wycen (`GET /api/quotes`):** Prezentacja zagregowanych danych handlowych w tabeli (numer wyceny nadany przez serwer, nazwa klienta, data wyceny w formacie `dd.mm.rrrr`, liczba pozycji, całkowita wartość zamówienia oraz badge statusu).
   * **Szczegóły wyceny (`GET /api/quotes/{id}`):** Dedykowany widok modalny prezentujący pozycje wyceny wraz z ich parametrami produkcyjnymi.
   * **Tworzenie nowej wyceny (`POST /api/quotes`):** Formularz umożliwiający kalkulację oferty z obsługą wielu pozycji asortymentowych w ramach jednego zamówienia.
   * **Edycja wyceny (`PUT /api/quotes/{id}`):** Możliwość pełnej modyfikacji nagłówka wyceny (klient, status, daty, uwagi) oraz pozycji zamówienia (dodawanie/usuwanie wierszy, zmiana produktów i nakładów).
   * **Usuwanie wyceny (`DELETE /api/quotes/{id}`):** Kaskadowe usunięcie kalkulacji wraz z jej pozycjami z bazy danych z potwierdzeniem operacji.

2. **Dynamiczny formularz pozycji zamówienia:**
   * Możliwość dynamicznego dodawania i usuwania wierszy produktów w ramach jednej wyceny.
   * **Opcjonalna cena jednostkowa:** Pozostawienie pustego pola ceny powoduje, że frontend nie wysyła wartości `unitPrice` (klucz jest pomijany w payloadzie JSON, unikając wysyłania pustego ciągu znaków `""` lub zera), dzięki czemu backend automatycznie przypisuje aktualną cenę bazową z cennika produktów.

3. **Walidacja danych i integralność biznesowa:**
   * **Po stronie klienta:** Blokada wysyłki w przypadku braku wybranego klienta, pustej listy pozycji lub nakładu mniejszego/równego 0.
   * **Walidacja unikalności asortymentu:** System uniemożliwia wybranie tego samego produktu na dwóch różnych pozycjach w obrębie jednej kalkulacji (zgodnie z regułą bazy danych).
   * **Obsługa błędów API (`400 Bad Request`):** Błędy walidacji reguł biznesowych z backendu (np. naruszenie warunku `validUntil >= quoteDate`) są mapowane ze schematu `ErrorResponse` Pydantic i wyświetlane wewnątrz okna formularza bez utraty wprowadzonych danych.

4. **Obsługa asynchronicznych stanów interfejsu (UX):**
   * **Stan ładowania (Loading State):** Animowany szkielet tabeli (*Skeleton Loader*) rezerwujący przestrzeń na dane podczas zapytań `GET`, połączony z blokadą przycisków akcji (`isSubmitting`) zapobiegającą wielokrotnemu klikaniu.
   * **System powiadomień (Toast Notifications):** Informacje zwrotne o pomyślnym wykonaniu operacji zapisu, edycji lub usunięcia z automatycznym wygaszaniem.
   * **Odporność na brak sieci:** W przypadku niedostępności serwera FastAPI tabela przechodzi w dedykowany stan awaryjny z komunikatem *„Brak połączenia z serwerem”* oraz przyciskiem ponowienia próby.

---

### Struktura modułu frontendowego

```text
frontend/
├── src/
│   ├── api/
│   │   └── quotesApi.ts      # Warstwa komunikacji HTTP z REST API (Fetch API, obsługa payloadów camelCase)
│   ├── types/
│   │   └── quote.ts          # Definicje typów TypeScript odzwierciedlające schematy Pydantic (QuoteListItem, QuoteDetail, QuoteIn)
│   ├── App.tsx               # Główny komponent aplikacji: tabela wycen, panel statystyk, modale CRUD i stany UX
│   ├── main.tsx              # Punkt wejściowy aplikacji React
│   └── index.css             # Style globalne oraz konfiguracja dyrektyw Tailwind CSS
├── .env                      # Konfiguracja adresu bazowego API (VITE_API_URL)
├── index.html                # Szablon strony HTML
├── package.json              # Zależności projektu (React, Lucide React, Vite, Tailwind CSS)
├── tailwind.config.js        # Konfiguracja motywu graficznego Tailwind
├── tsconfig.json             # Konfiguracja kompilatora TypeScript
└── vite.config.ts            # Konfiguracja bundlera Vite

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
