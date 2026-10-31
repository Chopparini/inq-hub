import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.error import ErrorResponse, FieldError

logger = logging.getLogger(__name__)

FIELD_MESSAGES = {
    "missing": "To pole jest wymagane",
    "int_type": "Wartość musi być liczbą całkowitą",
    "int_parsing": "Wartość musi być liczbą całkowitą",
    "int_from_float": "Wartość musi być liczbą całkowitą",
    "greater_than": "Wartość musi być większa od {gt}",
    "decimal_type": "Wartość musi być liczbą",
    "decimal_parsing": "Wartość musi być liczbą",
    "decimal_max_digits": "Liczba może mieć najwyżej {max_digits} cyfr",
    "decimal_max_places": "Liczba może mieć najwyżej {decimal_places} miejsca po przecinku",
    "date_type": "Niepoprawna data, oczekiwany format RRRR-MM-DD",
    "date_parsing": "Niepoprawna data, oczekiwany format RRRR-MM-DD",
    "date_from_datetime_parsing": "Niepoprawna data, oczekiwany format RRRR-MM-DD",
    "date_from_datetime_inexact": "Niepoprawna data, oczekiwany format RRRR-MM-DD",
    "enum": "Niedozwolona wartość, dozwolone: {expected}",
    "too_short": "Lista musi zawierać co najmniej {min_length} element",
    "list_type": "Wartość musi być listą",
    "model_type": "Niepoprawny format danych",
    "string_type": "Wartość musi być tekstem",
}

HTTP_MESSAGES = {
    "Not Found": "Nie znaleziono zasobu",
    "Method Not Allowed": "Niedozwolona metoda HTTP",
}


def _error(status_code: int, body: ErrorResponse) -> JSONResponse:
    return JSONResponse(status_code=status_code, content=body.model_dump(exclude_none=True))


def _message(e: dict) -> str:
    if e["type"] == "value_error":
        return e["msg"].removeprefix("Value error, ")
    template = FIELD_MESSAGES.get(e["type"], "Niepoprawna wartość")
    return template.format(**e.get("ctx", {})).replace(" or ", " lub ")


def _field_error(e: dict) -> FieldError:
    if e["type"] == "json_invalid":
        return FieldError(field=None, message="Niepoprawny format JSON")
    path = [str(p) for p in e["loc"] if p not in ("body", "path", "query")]
    return FieldError(field=".".join(path) or None, message=_message(e))



async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [_field_error(e) for e in exc.errors()]
    return _error(status.HTTP_400_BAD_REQUEST, ErrorResponse(detail="Niepoprawne dane wejściowe", errors=errors))


async def integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
    logger.warning("IntegrityError: %s", exc.orig)
    return _error(status.HTTP_400_BAD_REQUEST, ErrorResponse(detail="Dane naruszają ograniczenia bazy danych"))


async def http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": HTTP_MESSAGES.get(exc.detail, exc.detail)},
        headers=exc.headers,
    )


async def catch_unexpected_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Nieobsłużony błąd: %s %s", request.method, request.url.path)
        return _error(status.HTTP_500_INTERNAL_SERVER_ERROR, ErrorResponse(detail="Wewnętrzny błąd serwera"))


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_error)
    app.add_exception_handler(RequestValidationError, validation_error)
    app.add_exception_handler(IntegrityError, integrity_error)
    app.middleware("http")(catch_unexpected_errors)
    _hide_422_in_docs(app)


def _hide_422_in_docs(app: FastAPI) -> None:
    # FastAPI dopisuje 422 do każdego endpointu, a my zwracamy 400
    default_openapi = app.openapi

    def openapi() -> dict:
        if app.openapi_schema is None:
            for path in default_openapi()["paths"].values():
                for operation in path.values():
                    operation["responses"].pop("422", None)
        return app.openapi_schema

    app.openapi = openapi
