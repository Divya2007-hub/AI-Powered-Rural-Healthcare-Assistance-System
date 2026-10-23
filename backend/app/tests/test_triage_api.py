from fastapi.testclient import TestClient

from app.main import create_app


def make_client() -> TestClient:
    return TestClient(create_app())


def test_health_endpoint() -> None:
    response = make_client().get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_emergency_symptom_returns_urgent_guidance() -> None:
    response = make_client().post(
        "/api/v1/triage/symptoms",
        json={"symptoms": ["chest pain", "shortness of breath"], "age_years": 40},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["urgency_code"] == "urgent"
    assert body["emergency"] is True
    assert body["red_flags"]
    assert body["disclaimer"]


def test_common_symptom_returns_consultation() -> None:
    response = make_client().post(
        "/api/v1/triage/symptoms",
        json={"symptoms": ["fever", "cough"], "duration_days": 2},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["urgency_code"] == "consult"
    assert body["emergency"] is False


def test_empty_symptoms_are_rejected() -> None:
    response = make_client().post("/api/v1/triage/symptoms", json={"symptoms": []})

    assert response.status_code == 422


def test_blank_symptoms_are_rejected() -> None:
    response = make_client().post("/api/v1/triage/symptoms", json={"symptoms": ["   "]})

    assert response.status_code == 422
