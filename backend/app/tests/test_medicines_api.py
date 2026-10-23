import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


def test_list_all_availability_sorted_by_distance(client: TestClient) -> None:
    response = client.get("/api/v1/medicines/availability")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == len(body["medicines"]) == 10
    distances = [item["distance_km"] for item in body["medicines"]]
    assert distances == sorted(distances)


def test_filter_by_medicine_is_case_insensitive(client: TestClient) -> None:
    response = client.get("/api/v1/medicines/availability", params={"medicine": "PARACETAMOL"})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 4
    assert all("paracetamol" in item["medicine_name"].lower() for item in body["medicines"])


def test_filter_by_city(client: TestClient) -> None:
    response = client.get("/api/v1/medicines/availability", params={"city": "Rampur"})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 6
    assert all(item["city"].lower() == "rampur" for item in body["medicines"])


def test_filter_in_stock_false(client: TestClient) -> None:
    response = client.get("/api/v1/medicines/availability", params={"in_stock": "false"})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["medicines"][0]["medicine_name"] == "Amoxicillin 250mg"
    assert body["medicines"][0]["in_stock"] is False


def test_combined_filters(client: TestClient) -> None:
    response = client.get(
        "/api/v1/medicines/availability",
        params={"medicine": "paracetamol", "city": "rampur", "in_stock": "true"},
    )

    assert response.status_code == 200
    assert response.json()["count"] == 2


def test_limit(client: TestClient) -> None:
    response = client.get("/api/v1/medicines/availability", params={"limit": 3})

    assert response.status_code == 200
    assert response.json()["count"] == 3


def test_invalid_limit_is_rejected(client: TestClient) -> None:
    response = client.get("/api/v1/medicines/availability", params={"limit": 0})

    assert response.status_code == 422
