from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token
from app.models.user import User


def test_register_user_success(client: TestClient):
    payload = {
        "email": "newbuyer@example.com",
        "full_name": "New Buyer",
        "password": "SecurePassword2026!",
        "role": "USER",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newbuyer@example.com"
    assert data["full_name"] == "New Buyer"
    assert data["role"] == "USER"
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_duplicate_email_fails(client: TestClient, regular_user: User):
    payload = {
        "email": regular_user.email,
        "full_name": "Duplicate User",
        "password": "Password12345!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_password_is_securely_hashed(client: TestClient, db_session: Session):
    plain_password = "SecretPasswordToHash123!"
    payload = {
        "email": "hashcheck@example.com",
        "full_name": "Hash Check",
        "password": plain_password,
    }
    client.post("/api/auth/register", json=payload)
    user = db_session.query(User).filter(User.email == "hashcheck@example.com").first()
    assert user is not None
    assert user.hashed_password != plain_password
    assert user.hashed_password.startswith("$argon2id$")
    assert verify_password(plain_password, user.hashed_password) is True


def test_login_success(client: TestClient, regular_user: User):
    payload = {
        "email": regular_user.email,
        "password": "CustomerPass123!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == regular_user.email
    assert data["user"]["role"] == "USER"


def test_login_invalid_password_fails(client: TestClient, regular_user: User):
    payload = {
        "email": regular_user.email,
        "password": "WrongPassword!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_email_fails(client: TestClient):
    payload = {
        "email": "doesnotexist@example.com",
        "password": "SomePassword123!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401


def test_get_current_user_profile(client: TestClient, regular_user: User, user_token: str):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == regular_user.email
    assert data["full_name"] == regular_user.full_name
    assert data["role"] == "USER"


def test_unauthenticated_request_fails(client: TestClient):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_expired_token_fails(client: TestClient, regular_user: User):
    # Create an already expired token (-10 minutes)
    expired_token = create_access_token(
        subject=regular_user.email,
        role=regular_user.role,
        expires_delta=timedelta(minutes=-10)
    )
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401
