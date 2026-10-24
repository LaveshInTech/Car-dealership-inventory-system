from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class VehicleBase(BaseModel):
    make: str = Field(..., min_length=1, max_length=64)
    model: str = Field(..., min_length=1, max_length=64)
    category: str = Field(..., min_length=1, max_length=64)
    price: float = Field(..., gt=0, description="Vehicle unit price in USD")
    quantity: int = Field(0, ge=0, description="Available stock quantity")
    vin: Optional[str] = Field(None, max_length=32)
    year: Optional[int] = Field(None, ge=1900, le=2030)
    color: Optional[str] = Field(None, max_length=32)
    mileage: Optional[int] = Field(0, ge=0)
    fuel_type: Optional[str] = Field(None, max_length=32)
    transmission: Optional[str] = Field(None, max_length=32)
    description: Optional[str] = None
    image_url: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    make: Optional[str] = Field(None, min_length=1, max_length=64)
    model: Optional[str] = Field(None, min_length=1, max_length=64)
    category: Optional[str] = Field(None, min_length=1, max_length=64)
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    vin: Optional[str] = Field(None, max_length=32)
    year: Optional[int] = Field(None, ge=1900, le=2030)
    color: Optional[str] = Field(None, max_length=32)
    mileage: Optional[int] = Field(None, ge=0)
    fuel_type: Optional[str] = Field(None, max_length=32)
    transmission: Optional[str] = Field(None, max_length=32)
    description: Optional[str] = None
    image_url: Optional[str] = None


class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VehiclePaginationResponse(BaseModel):
    items: List[VehicleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
