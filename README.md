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
