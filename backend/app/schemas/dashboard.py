from typing import List, Optional
from pydantic import BaseModel
from app.schemas.vehicle import VehicleResponse
from app.schemas.inventory import TransactionResponse


class CategoryDistribution(BaseModel):
    category: str
    models_count: int
    units_in_stock: int
    valuation: float


class DashboardSummaryResponse(BaseModel):
    total_models: int
    total_units: int
    total_valuation: float
    out_of_stock_count: int
    low_stock_count: int
    total_sales_revenue: float
    total_units_sold: int
    categories: List[CategoryDistribution]
    recent_vehicles: List[VehicleResponse]
    recent_transactions: List[TransactionResponse]
