from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, model_validator
from pydantic.alias_generators import to_camel

from app.models.enums import BoxType, FluteType, QuoteStatus

# Pydantic domyślnie zwraca Decimal w JSON jako tekst ("1.45"); frontend potrzebuje liczby
Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Dimensions(CamelModel):
    length: int
    width: int
    height: int


class QuoteItemIn(CamelModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    notes: str | None = None


class QuoteIn(CamelModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "clientId": 2,
                    "validUntil": "2026-11-30",
                    "notes": "Nadruk jednokolorowy",
                    "items": [
                        {"productId": 1, "quantity": 500},
                        {"productId": 2, "quantity": 1000, "unitPrice": 0.75},
                    ],
                }
            ]
        }
    )

    client_id: int
    status: QuoteStatus = QuoteStatus.DRAFT
    quote_date: date | None = None
    valid_until: date | None = None
    notes: str | None = None
    items: list[QuoteItemIn] = Field(min_length=1)

    @model_validator(mode="after")
    def check_quote(self) -> "QuoteIn":
        if self.valid_until and self.valid_until < (self.quote_date or date.today()):
            raise ValueError("validUntil nie może być wcześniejsze niż quoteDate")
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Produkt może wystąpić w wycenie tylko raz")
        return self


class QuoteItemOut(CamelModel):
    id: int
    product_id: int
    product_name: str
    box_type: BoxType
    flute: FluteType
    dimensions: Dimensions
    quantity: int
    unit_price: Money
    notes: str | None
    line_total: Money


class QuoteListItem(CamelModel):
    id: int
    number: str
    client_id: int
    client_name: str
    status: QuoteStatus
    quote_date: date
    valid_until: date | None
    items_count: int
    total_value: Money


class QuoteDetail(CamelModel):
    id: int
    number: str
    client_id: int
    client_name: str
    status: QuoteStatus
    quote_date: date
    valid_until: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[QuoteItemOut]
    total_value: Money
