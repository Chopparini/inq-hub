from pydantic import ConfigDict, Field, field_validator

from app.schemas.quote import CamelModel
from app.schemas.validators import normalize_email


class ClientIn(CamelModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Kartonex Sp. z o.o.",
                    "nip": "1234567890",
                    "email": "biuro@kartonex.pl",
                    "postalCode": "50-001",
                    "city": "Wrocław",
                }
            ]
        }
    )

    name: str = Field(min_length=1, max_length=255)
    nip: str | None = Field(default=None, pattern=r"^[0-9]{10}$")
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    contact_person: str | None = Field(default=None, max_length=100)
    street: str | None = Field(default=None, max_length=255)
    postal_code: str | None = Field(default=None, pattern=r"^[0-9]{2}-[0-9]{3}$")
    city: str | None = Field(default=None, max_length=100)

    @field_validator("*", mode="before")
    @classmethod
    def empty_to_none(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str | None) -> str | None:
        return normalize_email(value) if value else value


class ClientOut(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    nip: str | None
    email: str | None
    phone: str | None
    contact_person: str | None
    street: str | None
    postal_code: str | None
    city: str | None
