import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

TRIAGE_PAYLOAD = {
    "symptoms": ["fever", "cough"],
    "duration_days": 2,
    "age_years": 34,
    "language": "en",
}


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


def register(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "History User",
            "email": f"history_{uuid.uuid4().hex[:10]}@example.com",
            "password": "StrongPass123",
        },
    )
    assert response.status_code == 201
    return response.json()


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_history_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/history/triage").status_code == 401


def test_triage_is_saved_only_for_logged_in_users(client: TestClient) -> None:
    body = register(client)
    headers = auth_header(body["token"])

    assert client.post("/api/v1/triage/symptoms", json=TRIAGE_PAYLOAD).status_code == 200
    assert client.get("/api/v1/history/triage", headers=headers).json()["count"] == 0

    saved = client.post("/api/v1/triage/symptoms", json=TRIAGE_PAYLOAD, headers=headers)
    assert saved.status_code == 200

    history = client.get("/api/v1/history/triage", headers=headers)
    assert history.status_code == 200
    payload = history.json()
    assert payload["count"] == 1
    entry = payload["history"][0]
    assert entry["symptoms"] == ["fever", "cough"]
    assert entry["urgency_code"] == "consult"
    assert entry["duration_days"] == 2


def test_delete_history_entry(client: TestClient) -> None:
    body = register(client)
    headers = auth_header(body["token"])
    client.post("/api/v1/triage/symptoms", json=TRIAGE_PAYLOAD, headers=headers)

    entry_id = client.get("/api/v1/history/triage", headers=headers).json()["history"][0]["id"]

    assert client.delete(f"/api/v1/history/triage/{entry_id}", headers=headers).status_code == 204
    assert client.get("/api/v1/history/triage", headers=headers).json()["count"] == 0
    assert client.delete(f"/api/v1/history/triage/{entry_id}", headers=headers).status_code == 404


def test_users_cannot_delete_other_users_history(client: TestClient) -> None:
    first = register(client)
    first_headers = auth_header(first["token"])
    client.post("/api/v1/triage/symptoms", json=TRIAGE_PAYLOAD, headers=first_headers)
    entry_id = client.get("/api/v1/history/triage", headers=first_headers).json()["history"][0]["id"]

    second = register(client)
    second_headers = auth_header(second["token"])

    response = client.delete(f"/api/v1/history/triage/{entry_id}", headers=second_headers)
    assert response.status_code == 404
