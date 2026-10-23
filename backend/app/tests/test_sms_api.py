import pytest
from fastapi.testclient import TestClient

from app.integrations.sms import get_sms_provider
from app.main import create_app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


@pytest.fixture(autouse=True)
def clear_outbox():
    get_sms_provider().clear()
    yield
    get_sms_provider().clear()


def test_inbound_sms_returns_triage_reply(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sms/inbound",
        json={"from": "+91-90000-00000", "body": "fever, cough"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["urgency_code"] == "consult"
    assert body["emergency"] is False
    assert body["language"] == "en"
    assert "Medical Consultation Recommended" in body["reply"]
    assert len(body["reply"]) <= 480

    outbox = client.get("/api/v1/sms/outbox").json()
    assert outbox["count"] == 1
    assert outbox["messages"][0]["to"] == "+91-90000-00000"
    assert outbox["messages"][0]["body"] == body["reply"]


def test_inbound_sms_emergency_is_urgent(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sms/inbound",
        json={"from": "+91-90000-00000", "body": "chest pain"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["urgency_code"] == "urgent"
    assert body["emergency"] is True
    assert "Urgent Care Required" in body["reply"]
    assert "Chest pain or pressure" in body["reply"]


def test_inbound_sms_supports_language_prefix(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sms/inbound",
        json={"from": "+91-90000-00000", "body": "hi: fever, cough"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "hi"
    assert "परामर्श" in body["reply"]


def test_inbound_sms_uses_request_language(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sms/inbound",
        json={"from": "+91-90000-00000", "body": "fever", "language": "kn"},
    )

    assert response.status_code == 200
    assert response.json()["language"] == "kn"


def test_unsupported_language_falls_back_to_english(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sms/inbound",
        json={"from": "+91-90000-00000", "body": "fever", "language": "fr"},
    )

    assert response.status_code == 200
    assert response.json()["language"] == "en"


def test_empty_sms_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sms/inbound",
        json={"from": "+91-90000-00000", "body": ""},
    )

    assert response.status_code == 422


def test_language_prefix_without_symptoms_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sms/inbound",
        json={"from": "+91-90000-00000", "body": "hi:"},
    )

    assert response.status_code == 422


def test_missing_sender_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sms/inbound",
        json={"body": "fever"},
    )

    assert response.status_code == 422


def test_outbox_accumulates_messages(client: TestClient) -> None:
    for _ in range(2):
        client.post(
            "/api/v1/sms/inbound",
            json={"from": "+91-90000-00000", "body": "fever"},
        )

    outbox = client.get("/api/v1/sms/outbox").json()
    assert outbox["count"] == 2
