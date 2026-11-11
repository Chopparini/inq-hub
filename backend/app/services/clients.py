from fastapi import HTTPException, status
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models import Client, Quote
from app.schemas.client import ClientIn


def list_clients(db: Session) -> list[Client]:
    return list(db.scalars(select(Client).order_by(Client.name)))


def get_client(db: Session, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Klient o id {client_id} nie istnieje")
    return client


def create_client(db: Session, data: ClientIn) -> Client:
    _check_nip(db, data.nip)
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def update_client(db: Session, client_id: int, data: ClientIn) -> Client:
    client = get_client(db, client_id)
    _check_nip(db, data.nip, client_id)
    for field, value in data.model_dump().items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


def delete_client(db: Session, client_id: int) -> None:
    client = get_client(db, client_id)
    if db.scalar(select(exists().where(Quote.client_id == client_id))):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nie można usunąć klienta, który ma wyceny")
    db.delete(client)
    db.commit()


def _check_nip(db: Session, nip: str | None, client_id: int | None = None) -> None:
    if nip is None:
        return
    query = select(Client.id).where(Client.nip == nip)
    if client_id is not None:
        query = query.where(Client.id != client_id)
    if db.scalar(query) is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Klient z NIP {nip} już istnieje")
