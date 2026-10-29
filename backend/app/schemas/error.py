from pydantic import BaseModel


class FieldError(BaseModel):
    field: str | None
    message: str


class ErrorResponse(BaseModel):
    detail: str
    errors: list[FieldError] | None = None
