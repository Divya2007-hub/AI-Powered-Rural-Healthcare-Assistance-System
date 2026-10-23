import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


def unique_email() -> str:
    return f"user_{uuid.uuid4().hex[:10]}@example.com"


def register(client: TestClient, email: str, password: str = "StrongPass123") -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Asha Devi", "email": email, "password": password},
    )
    assert response.status_code == 201
    return response.json()


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_register_returns_token_and_user(client: TestClient) -> None:
    email = unique_email()
    body = register(client, email)

    assert body["token"]
    assert body["user"]["email"] == email
    assert body["user"]["name"] == "Asha Devi"
    assert body["user"]["language"] == "en"


def test_register_normalizes_email(client: TestClient) -> None:
    email = unique_email()
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Ravi", "email": f"  {email.upper()}  ", "password": "StrongPass123"},
    )

    assert response.status_code == 201
    assert response.json()["user"]["email"] == email


def test_duplicate_email_is_rejected(client: TestClient) -> None:
    email = unique_email()
    register(client, email)

    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Other", "email": email, "password": "StrongPass123"},
    )

    assert response.status_code == 409


def test_short_password_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Asha", "email": unique_email(), "password": "short"},
    )

    assert response.status_code == 422


def test_login_success_and_failure(client: TestClient) -> None:
    email = unique_email()
    register(client, email, password="StrongPass123")

    ok = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass123"},
    )
    assert ok.status_code == 200
    assert ok.json()["token"]

    wrong = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPass123"},
    )
    assert wrong.status_code == 401

    unknown = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email(), "password": "StrongPass123"},
    )
    assert unknown.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/auth/me").status_code == 401

    body = register(client, unique_email())
    response = client.get("/api/v1/auth/me", headers=auth_header(body["token"]))

    assert response.status_code == 200
    assert response.json()["email"] == body["user"]["email"]


def test_update_profile(client: TestClient) -> None:
    body = register(client, unique_email())

    response = client.patch(
        "/api/v1/users/me",
        json={"name": "Asha Rao", "language": "kn"},
        headers=auth_header(body["token"]),
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Asha Rao"
    assert response.json()["language"] == "kn"


def test_logout_invalidates_token(client: TestClient) -> None:
    body = register(client, unique_email())
    headers = auth_header(body["token"])

    assert client.post("/api/v1/auth/logout", headers=headers).status_code == 204
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401
