import jwt

from app.core.config import settings
from app.core.security import ALGORITHM, create_access_token, hash_password, verify_password


def test_hash_and_verify_password():
    '''tylko hasło odpowiadajace hashowi przechodzi'''
    hashed = hash_password("tajne123")
    assert hashed != "tajne123"
    assert verify_password("tajne123", hashed)
    assert not verify_password("zle-haslo", hashed)


def test_access_token_contains_user_id():
    '''Czy Token zawiera id użytkownika i datę ważności'''
    token = create_access_token(42)
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    assert payload["sub"] == "42"
    assert "exp" in payload
