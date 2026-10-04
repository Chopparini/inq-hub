# Jak wprowadzać zmiany

## 1. Pierwsze pobranie repozytorium (tylko raz)

```bash
git clone git@github.com:Chopparini/inq-hub.git
cd inq-hub
git checkout development
```

## 2. Przed rozpoczęciem każdego zadania

Zawsze zaczynamy od aktualnego `development`:

```bash
git checkout development
git pull
```

⚠️ Pamiętaj o `git pull` – bez tego Twój branch powstanie z nieaktualnego kodu i przy PR mogą pojawić się konflikty.

## 3. Utworzenie własnego brancha

```bash
git checkout -b feature/krotki-opis-zadania
```

Nazewnictwo branchy:

- `feature/...` – nowa funkcjonalność, np. `feature/logowanie-uzytkownika`
- `fix/...` – poprawka błędu, np. `fix/walidacja-hasla`
- `docs/...` – dokumentacja, np. `docs/opis-workflow`

## 4. Praca i commity

```bash
git add .
git commit -m "feat: dodanie endpointu logowania"
```

## 5. Wysłanie brancha na GitHuba

```bash
git push -u origin feature/krotki-opis-zadania
```

## 6. Pull request

1. Na stronie repozytorium kliknij **Compare & pull request**.
2. Sprawdź, czy **base** to `development` (nie `main`!).
3. Dodaj tytuł i krótki opis zmian, w opisie podlinkuj issue, np. `Closes #5`.
4. Poczekaj na review i approval.
5. Po zatwierdzeniu zrób merge i usuń branch (GitHub zaproponuje to automatycznie).

## 7. Po zmergowaniu

```bash
git checkout development
git pull
git branch -d feature/krotki-opis-zadania
```

## Konwencja commitów

Commity piszemy po polsku według Conventional Commits:

```
typ: krótki opis zmiany
```

Opis małą literą, bez kropki na końcu.

| Typ | Kiedy używać | Przykład |
|------------|--------------------------------------------------|----------------------------------------------|
| `feat` | nowa funkcjonalność | `feat: dodanie endpointu logowania` |
| `fix` | poprawka błędu | `fix: poprawienie walidacji hasła` |
| `docs` | dokumentacja (README, CONTRIBUTING, komentarze) | `docs: aktualizacja README` |
| `style` | formatowanie, bez zmiany działania kodu | `style: formatowanie modułów backendu` |
| `refactor` | przebudowa kodu, bez zmiany działania | `refactor: wydzielenie logiki do serwisu` |
| `test` | dodanie lub poprawa testów | `test: dodanie testów rejestracji` |
| `chore` | konfiguracja, zależności, prace porządkowe | `chore: aktualizacja zależności` |

## Zasady

- Nie pushujemy bezpośrednio na `development` ani `main` – zmiany tylko przez PR.
- Merge z `development` do `main` wykonuje PM lub DevOps, przez PR z approvalem.