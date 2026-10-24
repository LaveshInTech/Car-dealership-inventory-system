import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.transaction import InventoryTransaction

# In-memory SQLite database specifically for test isolation
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Provides a fresh database session for each test function."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient that uses the isolated test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session: Session) -> User:
    """Creates and returns an active admin user."""
    admin = User(
        email="test_admin@apexmotors.com",
        full_name="Test Administrator",
        hashed_password=get_password_hash("AdminPass123!"),
        role="ADMIN",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Returns a valid JWT token for admin user."""
    return create_access_token(subject=admin_user.email, role=admin_user.role)


@pytest.fixture
def regular_user(db_session: Session) -> User:
    """Creates and returns an active regular customer user."""
    user = User(
        email="test_customer@apexmotors.com",
        full_name="Test Customer",
        hashed_password=get_password_hash("CustomerPass123!"),
        role="USER",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def user_token(regular_user: User) -> str:
    """Returns a valid JWT token for customer user."""
    return create_access_token(subject=regular_user.email, role=regular_user.role)


@pytest.fixture
def sample_vehicle(db_session: Session) -> Vehicle:
    """Creates and returns a sample vehicle with 5 units in stock."""
    vehicle = Vehicle(
        vin="WP0AB2A99NS123456",
        make="Porsche",
        model="911 GT3",
        category="Coupe",
        year=2024,
        price=189000.00,
        quantity=5,
        color="Shark Blue",
        mileage=800,
        fuel_type="Gasoline",
        transmission="Automatic",
        description="Naturally aspirated 4.0-liter flat-six with 502 hp.",
        image_url="https://images.unsplash.com/photo-1503376780353-7e6692767b70",
    )
    db_session.add(vehicle)
    db_session.commit()
    db_session.refresh(vehicle)
    return vehicle
