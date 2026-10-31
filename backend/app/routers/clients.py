from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.client import ClientOption
from app.schemas.error import ErrorResponse
from app.services import clients as service

router = APIRouter(
    prefix="/clients",
    tags=["clients"],
    responses={500: {"model": ErrorResponse, "description": "Wewnętrzny błąd serwera"}},
)


@router.get("", summary="Lista klientów do wyboru w formularzu")
def list_clients(db: Session = Depends(get_db)) -> list[ClientOption]:
    return service.list_clients(db)
