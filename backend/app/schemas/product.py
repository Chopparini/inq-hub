from app.models.enums import BoxType, FluteType
from app.schemas.quote import CamelModel, Dimensions, Money


class ProductOption(CamelModel):
    id: int
    name: str
    box_type: BoxType
    flute: FluteType
    dimensions: Dimensions
    base_price: Money
