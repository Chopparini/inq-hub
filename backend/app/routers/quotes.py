from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.error import ErrorResponse
from app.schemas.quote import QuoteDetail, QuoteIn, QuoteListItem
from app.services import quotes as service

router = APIRouter(
    prefix="/quotes",
    tags=["quotes"],
    responses={500: {"model": ErrorResponse, "description": "Wewnętrzny błąd serwera"}},
)

BAD_REQUEST = {400: {"model": ErrorResponse, "description": "Niepoprawne dane"}}
NOT_FOUND = {404: {"model": ErrorResponse, "description": "Wycena nie istnieje"}}


@router.get("", summary="Lista wycen")
def list_quotes(db: Session = Depends(get_db)) -> list[QuoteListItem]:
    return service.list_quotes(db)


@router.get("/{quote_id}", summary="Szczegóły wyceny z pozycjami", responses=BAD_REQUEST | NOT_FOUND)
def get_quote(quote_id: int, db: Session = Depends(get_db)) -> QuoteDetail:
    return service.to_detail(service.get_quote(db, quote_id))


@router.post("", status_code=status.HTTP_201_CREATED, summary="Utworzenie wyceny", responses=BAD_REQUEST)
def create_quote(data: QuoteIn, db: Session = Depends(get_db)) -> QuoteDetail:
    return service.to_detail(service.create_quote(db, data))


@router.put("/{quote_id}", summary="Aktualizacja wyceny i jej pozycji", responses=BAD_REQUEST | NOT_FOUND)
def update_quote(quote_id: int, data: QuoteIn, db: Session = Depends(get_db)) -> QuoteDetail:
    return service.to_detail(service.update_quote(db, quote_id, data))


@router.delete(
    "/{quote_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Usunięcie wyceny",
    responses=BAD_REQUEST | NOT_FOUND,
)
def delete_quote(quote_id: int, db: Session = Depends(get_db)) -> None:
    service.delete_quote(db, quote_id)
