from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Client
from app.schemas.client import ClientOption


def list_clients(db: Session) -> list[ClientOption]:
    clients = db.scalars(select(Client).order_by(Client.name)).all()
    return [ClientOption(id=c.id, name=c.name) for c in clients]
