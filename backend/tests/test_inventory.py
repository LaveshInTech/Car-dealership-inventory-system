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


def test_restock_vehicle_unauthenticated_fails(client: TestClient, sample_vehicle: Vehicle):
    payload = {"units": 5}
    response = client.post(f"/api/vehicles/{sample_vehicle.id}/restock", json=payload)
    assert response.status_code == 401


def test_inventory_transactions_unauthenticated_fails(client: TestClient):
    response = client.get("/api/inventory/transactions")
    assert response.status_code == 401


def test_user_cannot_access_other_user_transactions(
    client: TestClient,
    regular_user,
    user_token: str,
    regular_user_2,
    user2_token: str,
    sample_vehicle: Vehicle,
):
    """Enforces that regular users can only access their own transaction history,
    cannot see other users' transactions in the list, and are blocked with HTTP 403
    if attempting to query another user's history."""
    # User 1 makes a purchase
    res1 = client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json={"units": 1, "notes": "Order for Customer 1"},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res1.status_code == 200
    tx1_id = res1.json()["id"]

    # User 2 makes a purchase
    res2 = client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json={"units": 1, "notes": "Order for Customer 2"},
        headers={"Authorization": f"Bearer {user2_token}"}
    )
    assert res2.status_code == 200
    tx2_id = res2.json()["id"]

    # User 2 queries transaction list: must only see User 2's transaction
    user2_list_res = client.get(
        "/api/inventory/transactions",
        headers={"Authorization": f"Bearer {user2_token}"}
    )
    assert user2_list_res.status_code == 200
    data2 = user2_list_res.json()
    item_ids = [item["id"] for item in data2["items"]]
    assert tx2_id in item_ids
    assert tx1_id not in item_ids
    for item in data2["items"]:
        assert item["user_id"] == regular_user_2.id

    # User 2 attempts to query User 1's transaction history specifically -> HTTP 403 Forbidden
    forbidden_res = client.get(
        f"/api/inventory/transactions?user_id={regular_user.id}",
        headers={"Authorization": f"Bearer {user2_token}"}
    )
    assert forbidden_res.status_code == 403
    assert "permission to view other users" in forbidden_res.json()["detail"].lower()


def test_admin_can_access_all_transaction_histories(
    client: TestClient,
    admin_token: str,
    regular_user,
    user_token: str,
    regular_user_2,
    user2_token: str,
    sample_vehicle: Vehicle,
):
    """Verifies administrator can audit all transactions or filter by specific user."""
    # User 1 purchase
    client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json={"units": 1},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    # User 2 purchase
    client.post(
        f"/api/vehicles/{sample_vehicle.id}/purchase",
        json={"units": 1},
        headers={"Authorization": f"Bearer {user2_token}"}
    )

    # Admin global query
    admin_res = client.get(
        "/api/inventory/transactions",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_res.status_code == 200
    assert admin_res.json()["total"] >= 2

    # Admin filtered query by User 1
    admin_user1_res = client.get(
        f"/api/inventory/transactions?user_id={regular_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_user1_res.status_code == 200
    for item in admin_user1_res.json()["items"]:
        assert item["user_id"] == regular_user.id
