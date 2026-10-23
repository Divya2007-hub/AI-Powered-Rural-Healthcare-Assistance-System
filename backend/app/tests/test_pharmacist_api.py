import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

PHARMACIST_EMAIL = "pharmacist@sevacare.demo"
PHARMACIST_PASSWORD = "Pharmacist123"


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


def pharmacist_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": PHARMACIST_EMAIL, "password": PHARMACIST_PASSWORD},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def patient_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Patient",
            "email": f"patient_{uuid.uuid4().hex[:10]}@example.com",
            "password": "StrongPass123",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_portal_requires_pharmacist_role(client: TestClient) -> None:
    assert client.get("/api/v1/pharmacist/stock").status_code == 401
    assert client.get("/api/v1/pharmacist/stock", headers=patient_headers(client)).status_code == 403


def test_pharmacist_login_reports_role(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me", headers=pharmacist_headers(client))

    assert response.status_code == 200
    assert response.json()["role"] == "pharmacist"


def test_list_stock_for_own_facility(client: TestClient) -> None:
    response = client.get("/api/v1/pharmacist/stock", headers=pharmacist_headers(client))

    assert response.status_code == 200
    body = response.json()
    assert body["facility_name"] == "Seva Pharmacy"
    assert body["count"] == len(body["medicines"])
    assert body["count"] >= 3


def test_create_update_and_delete_stock(client: TestClient) -> None:
    headers = pharmacist_headers(client)
    initial = client.get("/api/v1/pharmacist/stock", headers=headers).json()["count"]

    created = client.post(
        "/api/v1/pharmacist/stock",
        json={
            "medicine_name": "Cetirizine 10mg",
            "category": "Allergy",
            "in_stock": True,
            "quantity": 40,
            "unit": "strips",
            "price": 25.0,
        },
        headers=headers,
    )
    assert created.status_code == 201
    stock_id = created.json()["id"]

    after_create = client.get("/api/v1/pharmacist/stock", headers=headers).json()
    assert after_create["count"] == initial + 1

    updated = client.patch(
        f"/api/v1/pharmacist/stock/{stock_id}",
        json={"in_stock": False, "quantity": 0, "price": 30.0},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["in_stock"] is False
    assert updated.json()["quantity"] == 0
    assert updated.json()["price"] == 30.0

    assert client.delete(f"/api/v1/pharmacist/stock/{stock_id}", headers=headers).status_code == 204
    after_delete = client.get("/api/v1/pharmacist/stock", headers=headers).json()
    assert after_delete["count"] == initial


def test_cannot_modify_another_facility_stock(client: TestClient) -> None:
    headers = pharmacist_headers(client)
    availability = client.get(
        "/api/v1/medicines/availability",
        params={"medicine": "Iron and Folic Acid"},
    ).json()
    other_facility_item = next(
        item for item in availability["medicines"] if item["facility_name"] != "Seva Pharmacy"
    )

    response = client.patch(
        f"/api/v1/pharmacist/stock/{other_facility_item['id']}",
        json={"quantity": 1},
        headers=headers,
    )

    assert response.status_code == 404


def test_stock_validation(client: TestClient) -> None:
    headers = pharmacist_headers(client)

    empty_name = client.post(
        "/api/v1/pharmacist/stock",
        json={"medicine_name": "", "price": 10},
        headers=headers,
    )
    assert empty_name.status_code == 422

    negative_price = client.post(
        "/api/v1/pharmacist/stock",
        json={"medicine_name": "Test Medicine", "price": -1},
        headers=headers,
    )
    assert negative_price.status_code == 422
