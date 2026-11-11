from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import UserRole
from app.schemas.quote import CamelModel
from app.schemas.validators import normalize_email
from app.core.config import settings



class UserRegister(CamelModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"username": "jan.kowalski", "email": "jan@example.com", "password": "tajne1234"}]
        }
    )

    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")
    email: str = Field(max_length=255)
    password: str = Field(min_length=settings.password_min_length, max_length=128)

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return normalize_email(value)



class UserOut(CamelModel):
    id: int
    username: str
    email: str
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
