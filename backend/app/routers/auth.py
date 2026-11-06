from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.models import User
from app.schemas.auth import Token, UserOut, UserRegister
from app.schemas.error import ErrorResponse
from app.services import auth as service

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={500: {"model": ErrorResponse, "description": "Wewnętrzny błąd serwera"}},
)

BAD_REQUEST = {400: {"model": ErrorResponse, "description": "Niepoprawne dane"}}
UNAUTHORIZED = {401: {"model": ErrorResponse, "description": "Brak lub błędne dane logowania"}}


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Rejestracja", responses=BAD_REQUEST)
def register(data: UserRegister, db: Session = Depends(get_db)) -> UserOut:
    return service.register_user(db, data)


@router.post("/login", summary="Logowanie", responses=BAD_REQUEST | UNAUTHORIZED)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = service.authenticate(db, form.username, form.password)
    return Token(access_token=create_access_token(user.id))


@router.get("/me", summary="Zalogowany użytkownik", responses=UNAUTHORIZED)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return user
