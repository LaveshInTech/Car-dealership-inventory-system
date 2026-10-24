from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from fastapi import HTTPException, status
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


class VehicleService:
    @staticmethod
    def list_vehicles(
        db: Session,
        search: Optional[str] = None,
        make: Optional[str] = None,
        model: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 12,
    ) -> Tuple[List[Vehicle], int]:
        query = db.query(Vehicle)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Vehicle.make.ilike(search_term),
                    Vehicle.model.ilike(search_term),
                    Vehicle.category.ilike(search_term),
                    Vehicle.color.ilike(search_term),
                    Vehicle.description.ilike(search_term),
                )
            )

        if make:
            query = query.filter(Vehicle.make.ilike(f"%{make.strip()}%"))
        if model:
            query = query.filter(Vehicle.model.ilike(f"%{model.strip()}%"))
        if category:
            query = query.filter(Vehicle.category.ilike(f"%{category.strip()}%"))
        if min_price is not None:
            query = query.filter(Vehicle.price >= min_price)
        if max_price is not None:
            query = query.filter(Vehicle.price <= max_price)

        total = query.count()

        # Sorting logic
        sort_column = getattr(Vehicle, sort_by, Vehicle.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total

    @staticmethod
    def get_vehicle_by_id(db: Session, vehicle_id: int) -> Vehicle:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with id {vehicle_id} not found."
            )
        return vehicle

    @staticmethod
    def create_vehicle(db: Session, vehicle_in: VehicleCreate) -> Vehicle:
        if vehicle_in.price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle price must be greater than zero."
            )
        if vehicle_in.quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle quantity cannot be negative."
            )

        vehicle = Vehicle(**vehicle_in.model_dump())
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
        return vehicle

    @staticmethod
    def update_vehicle(db: Session, vehicle_id: int, vehicle_in: VehicleUpdate) -> Vehicle:
        vehicle = VehicleService.get_vehicle_by_id(db, vehicle_id)
        update_data = vehicle_in.model_dump(exclude_unset=True)

        if "price" in update_data and update_data["price"] is not None and update_data["price"] <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle price must be greater than zero."
            )
        if "quantity" in update_data and update_data["quantity"] is not None and update_data["quantity"] < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle quantity cannot be negative."
            )

        for field, value in update_data.items():
            setattr(vehicle, field, value)

        db.commit()
        db.refresh(vehicle)
        return vehicle

    @staticmethod
    def delete_vehicle(db: Session, vehicle_id: int) -> None:
        vehicle = VehicleService.get_vehicle_by_id(db, vehicle_id)
        db.delete(vehicle)
        db.commit()
