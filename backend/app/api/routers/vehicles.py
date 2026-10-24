from typing import Optional
from math import ceil
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_active_admin
from app.models.user import User
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehiclePaginationResponse,
)
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=VehiclePaginationResponse)
def get_vehicles(
    search: Optional[str] = Query(None, description="Search query across make, model, category"),
    make: Optional[str] = Query(None, description="Filter by make"),
    model: Optional[str] = Query(None, description="Filter by model"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    sort_by: str = Query("created_at", description="Field to sort by (created_at, price, year, quantity, make)"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """Retrieves paginated and filtered list of vehicles."""
    items, total = VehicleService.list_vehicles(
        db=db,
        search=search,
        make=make,
        model=model,
        category=category,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    total_pages = ceil(total / page_size) if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/search", response_model=VehiclePaginationResponse)
def search_vehicles(
    q: Optional[str] = Query(None, description="Search keyword"),
    category: Optional[str] = Query(None, description="Category filter"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Dedicated search endpoint across make, model, and category."""
    items, total = VehicleService.list_vehicles(
        db=db,
        search=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        page=page,
        page_size=page_size,
    )
    total_pages = ceil(total / page_size) if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_details(vehicle_id: int, db: Session = Depends(get_db)):
    """Retrieves single vehicle details by ID."""
    return VehicleService.get_vehicle_by_id(db, vehicle_id)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new vehicle record (Authenticated users)."""
    return VehicleService.create_vehicle(db, vehicle_in)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates vehicle specifications and inventory count (Authenticated users)."""
    return VehicleService.update_vehicle(db, vehicle_id, vehicle_in)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    admin_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """Deletes a vehicle record from inventory (Admin only)."""
    VehicleService.delete_vehicle(db, vehicle_id)
    return None
