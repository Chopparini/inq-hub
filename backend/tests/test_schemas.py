from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas.auth import UserRegister
from app.schemas.client import ClientIn
from app.schemas.quote import QuoteIn


def test_register_rejects_invalid_email():
    with pytest.raises(ValidationError):
        UserRegister(username="jan", email="zly-email", password="tajne1234")


def test_client_empty_fields_become_none():
    client = ClientIn(name="Firma", nip="", postal_code="  ")
    assert client.nip is None
    assert client.postal_code is None


def test_client_rejects_invalid_nip():
    with pytest.raises(ValidationError):
        ClientIn(name="Firma", nip="123")


def test_quote_rejects_valid_until_before_quote_date():
    with pytest.raises(ValidationError):
        QuoteIn(
            client_id=1,
            quote_date=date(2026, 11, 10),
            valid_until=date(2026, 11, 1),
            items=[{"product_id": 1, "quantity": 10}],
        )


def test_quote_rejects_duplicate_products():
    with pytest.raises(ValidationError):
        QuoteIn(
            client_id=1,
            items=[{"product_id": 1, "quantity": 10}, {"product_id": 1, "quantity": 5}],
        )
