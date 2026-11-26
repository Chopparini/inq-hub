from fastapi.testclient import TestClient
from app.core.security import get_current_user
from sqlalchemy.exc import OperationalError

from app.core.database import get_db
from app.main import app

client = TestClient(app)


def test_root_redirects_to_docs():
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"


def test_me_without_token_returns_401():
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Nieprawidłowy lub wygasły token"


def test_create_client_without_token_returns_401():
    response = client.post("/api/clients", json={"name": "Firma"})
    assert response.status_code == 401


def test_invalid_quote_returns_400_with_field_errors():
    app.dependency_overrides[get_current_user] = lambda: None
    try:
        response = client.post("/api/quotes", json={"items": []})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 400
    body = response.json()
    assert body["detail"] == "Niepoprawne dane wejściowe"
    assert any(error["field"] == "clientId" for error in body["errors"])


def test_version_returns_local_by_default():
    response = client.get("/api/version")
    assert response.status_code == 200
    assert response.json() == {"version": "lokalna"}


def test_quotes_without_token_returns_401():
    response = client.get("/api/quotes")
    assert response.status_code == 401


class FakeDb:
    def __init__(self, error=None):
        self.error = error

    def execute(self, _statement):
        if self.error:
            raise self.error


def get_health(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        return client.get("/api/health")
    finally:
        app.dependency_overrides.clear()


def test_health_up_when_database_responds():
    response = get_health(FakeDb())
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "UP"
    assert body["database"] == "CONNECTED"
    assert "timestamp" in body


def test_health_down_when_database_fails():
    error = OperationalError("SELECT 1", {}, Exception("brak bazy"))
    response = get_health(FakeDb(error))
    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "DOWN"
    assert body["database"] == "DISCONNECTED"
    assert "brak bazy" not in response.text