from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import User
from app.schemas.auth import UserRegister

DUMMY_HASH = hash_password("dummy-password")


def register_user(db: Session, data: UserRegister) -> User:
    if db.scalar(select(User).where(User.username == data.username)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nazwa użytkownika jest już zajęta")
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Konto z tym adresem e-mail już istnieje")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, username: str, password: str) -> User:
    user = db.scalar(select(User).where(User.username == username))
    password_ok = verify_password(password, user.hashed_password if user else DUMMY_HASH)
    if user is None or not password_ok or not user.is_active:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Nieprawidłowa nazwa użytkownika lub hasło",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
