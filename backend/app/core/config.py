from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Ustawienia aplikacji czytane ze zmiennych środowiskowych lub pliku backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Brak wartości domyślnej celowo – bez DATABASE_URL aplikacja nie wystartuje (zero haseł w kodzie)
    database_url: str

    # Adresy frontendu, które mogą wołać API z przeglądarki (CORS)
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8080"]


settings = Settings()
