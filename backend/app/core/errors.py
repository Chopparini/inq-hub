import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.schemas.error import ErrorResponse, FieldError

logger = logging.getLogger(__name__)


def _error(status_code: int, body: ErrorResponse) -> JSONResponse:
    return JSONResponse(status_code=status_code, content=body.model_dump(exclude_none=True))


def _field_error(e: dict) -> FieldError:
    if e["type"] == "json_invalid":
        return FieldError(field=None, message="Niepoprawny format JSON")
    path = [str(p) for p in e["loc"] if p not in ("body", "path", "query")]
    return FieldError(field=".".join(path) or None, message=e["msg"].removeprefix("Value error, "))


async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [_field_error(e) for e in exc.errors()]
    return _error(status.HTTP_400_BAD_REQUEST, ErrorResponse(detail="Niepoprawne dane wejściowe", errors=errors))


async def integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
    logger.warning("IntegrityError: %s", exc.orig)
    return _error(status.HTTP_400_BAD_REQUEST, ErrorResponse(detail="Dane naruszają ograniczenia bazy danych"))


async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Nieobsłużony błąd: %s %s", request.method, request.url.path)
    return _error(status.HTTP_500_INTERNAL_SERVER_ERROR, ErrorResponse(detail="Wewnętrzny błąd serwera"))


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, validation_error)
    app.add_exception_handler(IntegrityError, integrity_error)
    app.add_exception_handler(Exception, unexpected_error)
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
