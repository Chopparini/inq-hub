from fastapi import HTTPException, status
from sqlalchemy import Integer, func, select, text
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Client, Product, Quote, QuoteItem
from app.schemas.quote import QuoteDetail, QuoteIn, QuoteItemOut, QuoteListItem

FIRST_NUMBER = 1001


def list_quotes(db: Session) -> list[QuoteListItem]:
    quotes = db.scalars(
        select(Quote)
        .options(joinedload(Quote.client), selectinload(Quote.items))
        .order_by(Quote.id.desc())
    ).all()
    return [
        QuoteListItem(
            id=q.id,
            number=q.number,
            client_id=q.client_id,
            client_name=q.client.name,
            status=q.status,
            quote_date=q.quote_date,
            valid_until=q.valid_until,
            items_count=len(q.items),
            total_value=sum((i.quantity * i.unit_price for i in q.items), start=0),
        )
        for q in quotes
    ]


def get_quote(db: Session, quote_id: int) -> Quote:
    quote = db.get(Quote, quote_id)
    if quote is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Wycena o id {quote_id} nie istnieje")
    return quote


def create_quote(db: Session, data: QuoteIn) -> Quote:
    _check_client(db, data.client_id)
    products = _get_products(db, [i.product_id for i in data.items])

    quote = Quote(
        number=_next_number(db),
        client_id=data.client_id,
        status=data.status,
        valid_until=data.valid_until,
        notes=data.notes,
        items=[
            QuoteItem(
                product_id=i.product_id,
                quantity=i.quantity,
                unit_price=i.unit_price or products[i.product_id].base_price,
                notes=i.notes,
            )
            for i in data.items
        ],
    )
    if data.quote_date:
        quote.quote_date = data.quote_date
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


def update_quote(db: Session, quote_id: int, data: QuoteIn) -> Quote:
    quote = get_quote(db, quote_id)
    _check_client(db, data.client_id)
    products = _get_products(db, [i.product_id for i in data.items])

    quote.client_id = data.client_id
    quote.status = data.status
    quote.valid_until = data.valid_until
    quote.notes = data.notes
    if data.quote_date:
        quote.quote_date = data.quote_date

    # Istniejące pozycje aktualizujemy w miejscu – usunięcie i ponowne dodanie
    # tego samego produktu łamałoby UNIQUE (quote_id, product_id)
    existing = {i.product_id: i for i in quote.items}
    items = []
    for i in data.items:
        item = existing.get(i.product_id)
        if item is None:
            item = QuoteItem(product_id=i.product_id, unit_price=products[i.product_id].base_price)
        if i.unit_price:
            item.unit_price = i.unit_price
        item.quantity = i.quantity
        item.notes = i.notes
        items.append(item)
    quote.items = items

    # Zmiana samych pozycji nie aktualizuje wiersza quotes, więc ustawiamy ręcznie
    quote.updated_at = func.now()
    db.commit()
    db.refresh(quote)
    return quote


def delete_quote(db: Session, quote_id: int) -> None:
    db.delete(get_quote(db, quote_id))
    db.commit()


def to_detail(quote: Quote) -> QuoteDetail:
    items = [
        QuoteItemOut(
            id=i.id,
            product_id=i.product_id,
            product_name=i.product.name,
            quantity=i.quantity,
            unit_price=i.unit_price,
            notes=i.notes,
            line_total=i.quantity * i.unit_price,
        )
        for i in quote.items
    ]
    return QuoteDetail(
        id=quote.id,
        number=quote.number,
        client_id=quote.client_id,
        client_name=quote.client.name,
        status=quote.status,
        quote_date=quote.quote_date,
        valid_until=quote.valid_until,
        notes=quote.notes,
        created_at=quote.created_at,
        updated_at=quote.updated_at,
        items=items,
        total_value=sum((i.line_total for i in items), start=0),
    )


def _next_number(db: Session) -> str:
    # Blokada do końca transakcji – dwa równoczesne POST-y nie dostaną tego samego numeru
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext('quotes.number'))"))
    last = db.scalar(
        select(func.max(func.substring(Quote.number, 5).cast(Integer)))
        .where(Quote.number.regexp_match(r"^WYC-[0-9]+$"))
    )
    return f"WYC-{(last or FIRST_NUMBER - 1) + 1}"


def _check_client(db: Session, client_id: int) -> None:
    if db.get(Client, client_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Klient o id {client_id} nie istnieje")


def _get_products(db: Session, product_ids: list[int]) -> dict[int, Product]:
    products = {p.id: p for p in db.scalars(select(Product).where(Product.id.in_(product_ids)))}
    missing = sorted(set(product_ids) - products.keys())
    if missing:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Produkty o id {', '.join(map(str, missing))} nie istnieją",
        )
    return products
