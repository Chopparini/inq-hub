import enum

from sqlalchemy.dialects.postgresql import ENUM


class QuoteStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class BoxType(str, enum.Enum):
    FLAP = "flap"
    DIE_CUT = "die_cut"
    OVERSIZED = "oversized"
    AUTO_BOTTOM = "auto_bottom"


class FluteType(str, enum.Enum):
    B = "B"
    C = "C"
    E = "E"
    BC = "BC"


def pg_enum(enum_cls: type[enum.Enum], name: str) -> ENUM:
    #istnieje już w bazie (schema.sql); zapisujemy wartości, nie nazwy
    return ENUM(
        enum_cls,
        name=name,
        create_type=False,
        values_callable=lambda e: [m.value for m in e],
    )
