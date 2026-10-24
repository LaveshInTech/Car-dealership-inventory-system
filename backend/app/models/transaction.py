from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    transaction_type = Column(String(32), nullable=False)  # "PURCHASE", "RESTOCK", "INITIAL_LOAD"
    quantity_change = Column(Integer, nullable=False)  # e.g., -1 for purchase, +5 for restock
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    vehicle = relationship("Vehicle", back_populates="transactions")
    user = relationship("User", back_populates="transactions")

    def __repr__(self) -> str:
        return (
            f"<InventoryTransaction id={self.id} vehicle_id={self.vehicle_id} "
            f"type={self.transaction_type} qty={self.quantity_change}>"
        )
