from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.schemas.client import ClientIn, ClientOut
from app.schemas.error import ErrorResponse
from app.services import clients as service

router = APIRouter(
    prefix="/clients",
    tags=["clients"],
    responses={500: {"model": ErrorResponse, "description": "Wewnętrzny błąd serwera"}},
)

BAD_REQUEST = {400: {"model": ErrorResponse, "description": "Niepoprawne dane"}}
NOT_FOUND = {404: {"model": ErrorResponse, "description": "Klient nie istnieje"}}
ADMIN_ONLY = {
    401: {"model": ErrorResponse, "description": "Brak lub nieważny token"},
    403: {"model": ErrorResponse, "description": "Wymagana rola admin"},
}


@router.get("", summary="Lista klientów")
def list_clients(db: Session = Depends(get_db)) -> list[ClientOut]:
    return service.list_clients(db)


@router.get("/{client_id}", summary="Szczegóły klienta", responses=BAD_REQUEST | NOT_FOUND)
def get_client(client_id: int, db: Session = Depends(get_db)) -> ClientOut:
    return service.get_client(db, client_id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Dodanie klienta",
    dependencies=[Depends(require_admin)],
    responses=BAD_REQUEST | ADMIN_ONLY,
)
def create_client(data: ClientIn, db: Session = Depends(get_db)) -> ClientOut:
    return service.create_client(db, data)


@router.put(
    "/{client_id}",
    summary="Edycja klienta",
    dependencies=[Depends(require_admin)],
    responses=BAD_REQUEST | NOT_FOUND | ADMIN_ONLY,
)
def update_client(client_id: int, data: ClientIn, db: Session = Depends(get_db)) -> ClientOut:
    return service.update_client(db, client_id, data)


@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Usunięcie klienta",
    dependencies=[Depends(require_admin)],
    responses=BAD_REQUEST | NOT_FOUND | ADMIN_ONLY,
)
def delete_client(client_id: int, db: Session = Depends(get_db)) -> None:
    service.delete_client(db, client_id)
