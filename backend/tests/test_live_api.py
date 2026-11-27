import os

import httpx
import pytest

BASE_URL = os.getenv("LIVE_APP_URL")
USER = os.getenv("LIVE_USER", "handlowy")
PASSWORD = os.getenv("LIVE_PASSWORD", "demo123")

pytestmark = pytest.mark.skipif(not BASE_URL, reason="brak LIVE_APP_URL")


@pytest.fixture(scope="module")
def api():
    with httpx.Client(base_url=f"{BASE_URL}/api", timeout=30) as client:
        yield client


@pytest.fixture(scope="module")
def token(api):
    response = api.post("/auth/login", data={"username": USER, "password": PASSWORD})
    return response.json()["access_token"]


def test_health_up(api):
    response = api.get("/health")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert response.json()["status"] == "UP"


def test_login_returns_token(api):
    response = api.post("/auth/login", data={"username": USER, "password": PASSWORD})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert isinstance(response.json()["access_token"], str)


def test_login_wrong_password_returns_401(api):
    response = api.post("/auth/login", data={"username": USER, "password": "zle-haslo"})
    assert response.status_code == 401
    assert "detail" in response.json()


def test_quotes_list_with_token(api, token):
    response = api.get("/quotes", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert isinstance(response.json(), list)


def test_quotes_without_token_returns_401(api):
    response = api.get("/quotes")
    assert response.status_code == 401


def test_create_and_delete_quote(api, token):
    auth = {"Authorization": f"Bearer {token}"}
    client_id = api.get("/clients", headers=auth).json()[0]["id"]
    product_id = api.get("/products", headers=auth).json()[0]["id"]

    response = api.post(
        "/quotes",
        headers=auth,
        json={"clientId": client_id, "notes": "Test API", "items": [{"productId": product_id, "quantity": 100}]},
    )
    assert response.status_code == 201
    assert response.headers["content-type"] == "application/json"
    quote = response.json()
    assert isinstance(quote["id"], int)
    assert quote["number"].startswith("WYC-")

    assert api.delete(f"/quotes/{quote['id']}", headers=auth).status_code == 204