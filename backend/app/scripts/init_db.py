import os
import sys
from pathlib import Path

from sqlalchemy import text

from app.core.database import engine
from app.core.security import hash_password

DB_DIR = Path(__file__).resolve().parents[2] / "db"


def main() -> None:
    admin_password = os.environ.get("ADMIN_PASSWORD")
    sales_password = os.environ.get("SALES_PASSWORD")
    if not (admin_password and sales_password):
        sys.exit("Brak ADMIN_PASSWORD lub SALES_PASSWORD, baza bez zmian")

    with engine.begin() as conn:
        if conn.execute(text("SELECT to_regclass('public.users')")).scalar():
            print("Baza już zainicjalizowana, nic nie zmieniam")
            return

        conn.exec_driver_sql((DB_DIR / "schema.sql").read_text(encoding="utf-8"))
        conn.execute(
            text(
                "INSERT INTO users (username, first_name, last_name, email, hashed_password, role) VALUES "
                "('admin', NULL, NULL, 'admin@hanka-kartony.pl', :admin_h, 'admin'), "
                "('handlowy', 'Olena', 'Hakman', 'handlowy@hanka-kartony.pl', :sales_h, 'sales')"
            ),
            {"admin_h": hash_password(admin_password), "sales_h": hash_password(sales_password)},
        )
        conn.exec_driver_sql((DB_DIR / "seed.sql").read_text(encoding="utf-8"))

    print("Baza zainicjalizowana")


if __name__ == "__main__":
    main()
