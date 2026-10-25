from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, func, true
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import BoxType, FluteType, pg_enum


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    box_type: Mapped[BoxType] = mapped_column(pg_enum(BoxType, "box_type"))
    flute: Mapped[FluteType] = mapped_column(pg_enum(FluteType, "flute_type"))
    length_mm: Mapped[int]
    width_mm: Mapped[int]
    height_mm: Mapped[int]
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(server_default=true())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    # FK do users
    updated_by: Mapped[int | None] = mapped_column(Integer)
