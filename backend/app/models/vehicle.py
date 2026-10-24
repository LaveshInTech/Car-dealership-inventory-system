from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vin = Column(String(32), unique=True, index=True, nullable=True)
    make = Column(String(64), index=True, nullable=False)
    model = Column(String(64), index=True, nullable=False)
    category = Column(String(64), index=True, nullable=False)  # Sedan, SUV, Truck, Coupe, Electric, Luxury, etc.
    year = Column(Integer, nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    color = Column(String(32), nullable=True)
    mileage = Column(Integer, default=0, nullable=True)
    fuel_type = Column(String(32), nullable=True)  # Gas, Electric, Hybrid, Diesel
    transmission = Column(String(32), nullable=True)  # Automatic, Manual
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    transactions = relationship("InventoryTransaction", back_populates="vehicle", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("quantity >= 0", name="check_positive_quantity"),
        CheckConstraint("price > 0", name="check_positive_price"),
    )

    def __repr__(self) -> str:
        return f"<Vehicle id={self.id} make={self.make} model={self.model} quantity={self.quantity}>"
