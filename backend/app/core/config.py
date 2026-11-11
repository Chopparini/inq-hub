from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Ustawienia aplikacji czytane ze zmiennych środowiskowych lub pliku backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Brak wartości domyślnej celowo – bez DATABASE_URL aplikacja nie wystartuje (zero haseł w kodzie)
    database_url: str

    #auth token, sesja
    secret_key: str
    access_token_expire_minutes: int = 60
    password_min_length: int = 8


    #adresy frontendu po przecinku (CORS)
    allowed_origins: str = "http://localhost:5173,http://localhost:8080"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()]

    #id commita, z którego zbudowano obraz
    git_sha: str = "lokalna" #placeholder



settings = Settings()
