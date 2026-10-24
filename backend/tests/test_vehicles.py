import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle


def test_get_vehicles_paginated(client: TestClient, sample_vehicle: Vehicle):
    response = client.get("/api/vehicles?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1
    assert data["items"][0]["make"] == "Porsche"


def test_search_vehicles_keyword(client: TestClient, sample_vehicle: Vehicle, db_session: Session):
    # Add a second vehicle
    v2 = Vehicle(
        make="BMW",
        model="M4 Competition",
        category="Coupe",
        price=82000.0,
        quantity=3,
        year=2023,
    )
    db_session.add(v2)
    db_session.commit()

    # Search by BMW
    response = client.get("/api/vehicles/search?q=BMW")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["make"] == "BMW"

    # Search by Porsche
    response = client.get("/api/vehicles/search?q=Porsche")
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["make"] == "Porsche"


def test_filter_by_price_and_category(client: TestClient, sample_vehicle: Vehicle, db_session: Session):
    v2 = Vehicle(
        make="Tesla",
        model="Model 3",
        category="Sedan",
        price=42000.0,
        quantity=6,
        year=2024,
    )
    db_session.add(v2)
    db_session.commit()

    # Filter with max_price 50000
    response = client.get("/api/vehicles?max_price=50000")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["make"] == "Tesla"

    # Filter by category Coupe
    response = client.get("/api/vehicles?category=Coupe")
    assert response.status_code == 200
    for item in response.json()["items"]:
        assert item["category"] == "Coupe"


def test_get_vehicle_by_id_success(client: TestClient, sample_vehicle: Vehicle):
    response = client.get(f"/api/vehicles/{sample_vehicle.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_vehicle.id
    assert data["make"] == "Porsche"
    assert data["price"] == sample_vehicle.price


def test_get_vehicle_by_id_not_found(client: TestClient):
    response = client.get("/api/vehicles/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_create_vehicle_admin_success(client: TestClient, admin_token: str):
    payload = {
        "make": "Audi",
        "model": "R8 V10 Performance",
        "category": "Coupe",
        "price": 210000.0,
        "quantity": 2,
        "year": 2023,
        "fuel_type": "Gasoline",
        "transmission": "Automatic",
        "color": "Daytona Gray",
    }
    response = client.post(
        "/api/vehicles",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["make"] == "Audi"
    assert data["price"] == 210000.0
    assert data["quantity"] == 2
    assert "id" in data


def test_create_vehicle_regular_user_forbidden(client: TestClient, user_token: str):
    payload = {
        "make": "Audi",
        "model": "R8 V10 Performance",
        "category": "Coupe",
        "price": 210000.0,
        "quantity": 2,
    }
    response = client.post(
        "/api/vehicles",
        json=payload,
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403
    assert "Administrator privileges" in response.json()["detail"]


def test_create_vehicle_invalid_price(client: TestClient, admin_token: str):
    payload = {
        "make": "Audi",
        "model": "R8",
        "category": "Coupe",
        "price": -500.0,  # Invalid price
        "quantity": 1,
    }
    response = client.post(
        "/api/vehicles",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422  # Pydantic validation error gt=0


def test_create_vehicle_negative_quantity(client: TestClient, admin_token: str):
    payload = {
        "make": "Audi",
        "model": "R8",
        "category": "Coupe",
        "price": 100000.0,
        "quantity": -2,  # Invalid negative quantity
    }
    response = client.post(
        "/api/vehicles",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422  # Pydantic validation ge=0


def test_update_vehicle_admin_success(client: TestClient, admin_token: str, sample_vehicle: Vehicle):
    payload = {
        "price": 195000.0,
        "color": "Gentian Blue Metallic",
    }
    response = client.put(
        f"/api/vehicles/{sample_vehicle.id}",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["price"] == 195000.0
    assert data["color"] == "Gentian Blue Metallic"
    assert data["make"] == sample_vehicle.make


def test_update_vehicle_regular_user_forbidden(client: TestClient, user_token: str, sample_vehicle: Vehicle):
    payload = {
        "price": 195000.0,
    }
    response = client.put(
        f"/api/vehicles/{sample_vehicle.id}",
        json=payload,
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403
    assert "Administrator privileges" in response.json()["detail"]


def test_delete_vehicle_admin_only(client: TestClient, admin_token: str, sample_vehicle: Vehicle):
    response = client.delete(
        f"/api/vehicles/{sample_vehicle.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/vehicles/{sample_vehicle.id}")
    assert get_res.status_code == 404


def test_delete_vehicle_regular_user_forbidden(client: TestClient, user_token: str, sample_vehicle: Vehicle):
    response = client.delete(
        f"/api/vehicles/{sample_vehicle.id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403
    assert "Administrator privileges" in response.json()["detail"]
