import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.models.user import User


def test_dashboard_summary_metrics(
    client: TestClient,
    admin_token: str,
    regular_user: User,
    user_token: str,
    db_session: Session
):
    # Add vehicles
    v1 = Vehicle(
        make="Porsche",
        model="911",
        category="Coupe",
        price=120000.0,
        quantity=3,
        year=2024
    )
    v2 = Vehicle(
        make="Tesla",
        model="Model S",
        category="Sedan",
        price=90000.0,
        quantity=0,  # Out of stock
        year=2024
    )
    v3 = Vehicle(
        make="BMW",
        model="M3",
        category="Sedan",
        price=80000.0,
        quantity=2,  # Low stock (<= 3)
        year=2023
    )
    db_session.add_all([v1, v2, v3])
    db_session.commit()
    db_session.refresh(v1)

    # Perform a purchase to generate sales revenue
    client.post(
        f"/api/vehicles/{v1.id}/purchase",
        json={"units": 1},
        headers={"Authorization": f"Bearer {user_token}"}
    )

    response = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total_models"] == 3
    # v1 had 3, bought 1 -> 2 remaining. v2 has 0. v3 has 2. Total units = 4.
    assert data["total_units"] == 4
    # Out of stock count = 1 (v2)
    assert data["out_of_stock_count"] == 1
    # Low stock count: v1 has 2, v3 has 2 -> 2 models with quantity > 0 and <= 3
    assert data["low_stock_count"] == 2

    # Sales metrics
    assert data["total_units_sold"] == 1
    assert data["total_sales_revenue"] == 120000.0

    # Valuation: (2 * 120000) + (0 * 90000) + (2 * 80000) = 240000 + 160000 = 400000
    assert data["total_valuation"] == 400000.0

    # Categories
    categories = {c["category"]: c for c in data["categories"]}
    assert "Coupe" in categories
    assert "Sedan" in categories
    assert categories["Coupe"]["models_count"] == 1
    assert categories["Sedan"]["models_count"] == 2


def test_dashboard_unauthenticated_fails(client: TestClient):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 401
