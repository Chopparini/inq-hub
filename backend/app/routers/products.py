from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.error import ErrorResponse
from app.schemas.product import ProductOption
from app.services import products as service

router = APIRouter(
    prefix="/products",
    tags=["products"],
    responses={500: {"model": ErrorResponse, "description": "Wewnętrzny błąd serwera"}},
)


@router.get("", summary="Lista aktywnych produktów do wyboru w pozycjach")
def list_products(db: Session = Depends(get_db)) -> list[ProductOption]:
    return service.list_products(db)
