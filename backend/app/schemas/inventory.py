from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.vehicle import VehicleResponse
from app.schemas.user import UserResponse


class PurchaseRequest(BaseModel):
    units: int = Field(1, gt=0, description="Number of units to purchase")
    notes: Optional[str] = Field(None, max_length=500)


class RestockRequest(BaseModel):
    units: int = Field(..., gt=0, description="Number of units to add to inventory")
    notes: Optional[str] = Field(None, max_length=500)


class TransactionResponse(BaseModel):
    id: int
    vehicle_id: int
    user_id: Optional[int]
    transaction_type: str  # "PURCHASE", "RESTOCK", "INITIAL_LOAD"
    quantity_change: int
    unit_price: float
    total_amount: float
    notes: Optional[str]
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
