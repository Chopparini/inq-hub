from fastapi.testclient import TestClient

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
    response = client.post("/api/quotes", json={"items": []})
    assert response.status_code == 400
    body = response.json()
    assert body["detail"] == "Niepoprawne dane wejściowe"
    assert any(error["field"] == "clientId" for error in body["errors"])


def test_version_returns_local_by_default():
    response = client.get("/api/version")
    assert response.status_code == 200
    assert response.json() == {"version": "lokalna"}
