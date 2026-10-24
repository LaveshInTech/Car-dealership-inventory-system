import concurrent.futures
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.models.transaction import InventoryTransaction


def test_purchase_vehicle_success(client: TestClient, user_token: str, sample_vehicle: Vehicle, db_session: Session):
    initial_stock = sample_vehicle.quantity
    payload = {
        "units": 2,
        "notes": "Express delivery requested.",
    }
    response = client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json=payload,
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_type"] == "PURCHASE"
    assert data["quantity_change"] == -2
    assert data["unit_price"] == float(sample_vehicle.price)
    assert data["total_amount"] == float(sample_vehicle.price * 2)

    # Verify database state
    db_session.refresh(sample_vehicle)
    assert sample_vehicle.quantity == initial_stock - 2

    # Verify transaction record exists
    tx = db_session.query(InventoryTransaction).filter(InventoryTransaction.id == data["id"]).first()
    assert tx is not None
    assert tx.quantity_change == -2


def test_purchase_zero_stock_fails(client: TestClient, user_token: str, sample_vehicle: Vehicle, db_session: Session):
    # Set vehicle quantity to 0
    sample_vehicle.quantity = 0
    db_session.commit()

    payload = {"units": 1}
    response = client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json=payload,
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 400
    assert "out of stock" in response.json()["detail"].lower()


def test_purchase_exceeding_stock_fails(client: TestClient, user_token: str, sample_vehicle: Vehicle):
    # sample_vehicle has 5 units; attempt to purchase 10
    payload = {"units": 10}
    response = client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json=payload,
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 400
    assert "only 5 units" in response.json()["detail"].lower() or "insufficient" in response.json()["detail"].lower()


def test_purchase_unauthenticated_fails(client: TestClient, sample_vehicle: Vehicle):
    payload = {"units": 1}
    response = client.post(f"/api/vehicles/{sample_vehicle.id}/purchase", json=payload)
    assert response.status_code == 401


def test_restock_vehicle_admin_success(client: TestClient, admin_token: str, sample_vehicle: Vehicle, db_session: Session):
    initial_stock = sample_vehicle.quantity
    payload = {
        "units": 8,
        "notes": "Direct factory shipment arrival.",
    }
    response = client.post(
        f"/api/vehicles/{sample_vehicle.id}/restock",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_type"] == "RESTOCK"
    assert data["quantity_change"] == 8

    # Verify stock increased
    db_session.refresh(sample_vehicle)
    assert sample_vehicle.quantity == initial_stock + 8


def test_restock_vehicle_regular_user_forbidden(client: TestClient, user_token: str, sample_vehicle: Vehicle):
    payload = {"units": 5}
    response = client.post(
        f"/api/vehicles/{sample_vehicle.id}/restock",
        json=payload,
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403
    assert "Administrator privileges" in response.json()["detail"]


def test_concurrent_purchase_attempts(client: TestClient, user_token: str, sample_vehicle: Vehicle, db_session: Session):
    """Verifies inventory consistency when multiple purchases occur sequentially or concurrently."""
    # sample_vehicle starts with 5 units.
    # We attempt 5 purchases of 1 unit. All 5 should succeed, stock reaches 0.
    # The 6th attempt must fail with 400 out of stock.
    headers = {"Authorization": f"Bearer {user_token}"}
    success_count = 0
    failure_count = 0

    for _ in range(6):
        res = client.post(
            f"/api/vehicles/{sample_vehicle.id}/purchase",
            json={"units": 1},
            headers=headers
        )
        if res.status_code == 200:
            success_count += 1
        elif res.status_code == 400:
            failure_count += 1

    assert success_count == 5
    assert failure_count == 1

    db_session.refresh(sample_vehicle)
    assert sample_vehicle.quantity == 0


def test_inventory_transactions_list(client: TestClient, user_token: str, sample_vehicle: Vehicle):
    # Perform a purchase to generate a transaction
    client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json={"units": 1},
        headers={"Authorization": f"Bearer {user_token}"}
    )

    response = client.get(
        "/api/inventory/transactions",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1
    assert data["items"][0]["transaction_type"] in ["PURCHASE", "RESTOCK"]


def test_purchase_zero_or_negative_units_rejected(client: TestClient, user_token: str, sample_vehicle: Vehicle):
    headers = {"Authorization": f"Bearer {user_token}"}
    
    # 0 units
    res0 = client.post(f"/api/vehicles/{sample_vehicle.id}/purchase", json={"units": 0}, headers=headers)
    assert res0.status_code in [400, 422]

    # Negative units
    res_neg = client.post(f"/api/vehicles/{sample_vehicle.id}/purchase", json={"units": -3}, headers=headers)
    assert res_neg.status_code in [400, 422]


def test_restock_zero_or_negative_units_rejected(client: TestClient, admin_token: str, sample_vehicle: Vehicle):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 0 units
    res0 = client.post(f"/api/vehicles/{sample_vehicle.id}/restock", json={"units": 0}, headers=headers)
    assert res0.status_code in [400, 422]

    # Negative units
    res_neg = client.post(f"/api/vehicles/{sample_vehicle.id}/restock", json={"units": -5}, headers=headers)
    assert res_neg.status_code in [400, 422]


def test_purchase_database_rollback_on_error(client: TestClient, user_token: str, sample_vehicle: Vehicle, db_session: Session, monkeypatch):
    """Verifies database rollback occurs and changes are discarded if an unexpected error occurs during purchase."""
    initial_stock = sample_vehicle.quantity

    # Monkeypatch db.commit to raise an exception simulating unexpected database error
    def mock_commit_error():
        raise RuntimeError("Simulated connection drop or database disk full failure")

    monkeypatch.setattr(db_session, "commit", mock_commit_error)

    response = client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json={"units": 1},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 500
    # Verify sanitized message, no raw exception details exposed
    assert "Simulated connection drop" not in response.json()["detail"]
    assert "Transaction processing failed" in response.json()["detail"]

    # Verify vehicle quantity was not decremented
    db_session.refresh(sample_vehicle)
    assert sample_vehicle.quantity == initial_stock
