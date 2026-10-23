import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


def test_list_all_facilities_sorted_by_distance(client: TestClient) -> None:
    response = client.get("/api/v1/facilities/nearby")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == len(body["facilities"]) == 4
    distances = [facility["distance_km"] for facility in body["facilities"]]
    assert distances == sorted(distances)


def test_filter_by_city_is_case_insensitive(client: TestClient) -> None:
    response = client.get("/api/v1/facilities/nearby", params={"city": "rampur"})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert all("rampur" in facility["city"].lower() for facility in body["facilities"])


def test_filter_by_type(client: TestClient) -> None:
    response = client.get("/api/v1/facilities/nearby", params={"type": "Pharmacy"})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["facilities"][0]["name"] == "Seva Pharmacy"


def test_emergency_only_returns_emergency_or_24x7(client: TestClient) -> None:
    response = client.get("/api/v1/facilities/nearby", params={"emergency_only": "true"})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert all(
        facility["emergency_services"] or facility["open_24x7"]
        for facility in body["facilities"]
    )


def test_limit(client: TestClient) -> None:
    response = client.get("/api/v1/facilities/nearby", params={"limit": 1})

    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_invalid_limit_is_rejected(client: TestClient) -> None:
    response = client.get("/api/v1/facilities/nearby", params={"limit": 0})

    assert response.status_code == 422


def test_facilities_are_sorted_by_distance_from_user(client: TestClient) -> None:
    response = client.get(
        "/api/v1/facilities/nearby",
        params={"lat": 26.8467, "lng": 80.9462},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 4
    distances = [facility["distance_km"] for facility in body["facilities"]]
    assert distances == sorted(distances)
    assert body["facilities"][-1]["name"] == "Community Health Centre"
    assert distances[-1] > 100


def test_radius_excludes_far_facilities(client: TestClient) -> None:
    response = client.get(
        "/api/v1/facilities/nearby",
        params={"lat": 26.8467, "lng": 80.9462, "radius_km": 5},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 3
    assert all(facility["distance_km"] <= 5 for facility in body["facilities"])


def test_lat_without_lng_is_rejected(client: TestClient) -> None:
    response = client.get("/api/v1/facilities/nearby", params={"lat": 26.8467})

    assert response.status_code == 422


def test_radius_without_location_is_rejected(client: TestClient) -> None:
    response = client.get("/api/v1/facilities/nearby", params={"radius_km": 5})

    assert response.status_code == 422


def test_invalid_coordinates_are_rejected(client: TestClient) -> None:
    response = client.get(
        "/api/v1/facilities/nearby",
        params={"lat": 200, "lng": 80.9462},
    )

    assert response.status_code == 422
