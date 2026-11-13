from pydantic import BaseModel, ConfigDict, Field, field_validator, StringConstraints
from typing import Annotated

from app.models.enums import UserRole
from app.schemas.quote import CamelModel
from app.schemas.validators import normalize_email
from app.core.config import settings


Name50 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Name100 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class UserRegister(CamelModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "username": "jan.kowalski",
                    "firstName": "Jan",
                    "lastName": "Kowalski",
                    "email": "jan@example.com",
                    "password": "tajne1234",
                }
            ]
        }
    )

    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")
    first_name: Name50
    last_name: Name100
    email: str = Field(max_length=255)
    password: str = Field(min_length=settings.password_min_length, max_length=128)

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return normalize_email(value)


class UserOut(CamelModel):
    id: int
    username: str
    first_name: str | None
    last_name: str | None
    email: str
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
