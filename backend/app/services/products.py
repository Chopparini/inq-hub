from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Product
from app.schemas.product import Dimensions, ProductOption


def list_products(db: Session) -> list[ProductOption]:
    products = db.scalars(select(Product).where(Product.is_active).order_by(Product.name)).all()
    return [
        ProductOption(
            id=p.id,
            name=p.name,
            box_type=p.box_type,
            flute=p.flute,
            dimensions=Dimensions(length=p.length_mm, width=p.width_mm, height=p.height_mm),
            base_price=p.base_price,
        )
        for p in products
    ]
