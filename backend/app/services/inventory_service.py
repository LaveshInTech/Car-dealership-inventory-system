from typing import Optional, List, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
from app.models.vehicle import Vehicle
from app.models.transaction import InventoryTransaction
from app.models.user import User


class InventoryService:
    @staticmethod
    def purchase_vehicle(
        db: Session,
        vehicle_id: int,
        user: User,
        units: int = 1,
        notes: Optional[str] = None
    ) -> InventoryTransaction:
        if units <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase units must be greater than zero."
            )

        try:
            # Attempt row-level locking if supported by dialect (e.g. Postgres)
            bind = db.get_bind()
            if bind and bind.dialect.name == "postgresql":
                vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).with_for_update().first()
            else:
                vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

            if not vehicle:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Vehicle with id {vehicle_id} not found."
                )

            if vehicle.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Vehicle '{vehicle.make} {vehicle.model}' is currently out of stock."
                )

            if vehicle.quantity < units:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Requested {units} units, but only {vehicle.quantity} "
                        f"units of '{vehicle.make} {vehicle.model}' are available in stock."
                    )
                )

            # Atomic decrement
            vehicle.quantity -= units
            unit_price = float(vehicle.price)
            total_amount = float(unit_price * units)

            transaction = InventoryTransaction(
                vehicle_id=vehicle.id,
                user_id=user.id,
                transaction_type="PURCHASE",
                quantity_change=-units,
                unit_price=unit_price,
                total_amount=total_amount,
                notes=notes or f"Customer purchase of {units} unit(s) by {user.full_name} ({user.email}).",
            )
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            db.refresh(vehicle)
            return transaction

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transaction processing failed: {str(e)}"
            )

    @staticmethod
    def restock_vehicle(
        db: Session,
        vehicle_id: int,
        admin_user: User,
        units: int,
        notes: Optional[str] = None
    ) -> InventoryTransaction:
        if units <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Restock units must be greater than zero."
            )

        try:
            bind = db.get_bind()
            if bind and bind.dialect.name == "postgresql":
                vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).with_for_update().first()
            else:
                vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

            if not vehicle:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Vehicle with id {vehicle_id} not found."
                )

            # Atomic increment
            vehicle.quantity += units
            unit_price = float(vehicle.price)
            total_amount = float(unit_price * units)

            transaction = InventoryTransaction(
                vehicle_id=vehicle.id,
                user_id=admin_user.id,
                transaction_type="RESTOCK",
                quantity_change=units,
                unit_price=unit_price,
                total_amount=total_amount,
                notes=notes or f"Inventory restocked by admin {admin_user.full_name} (+{units} units).",
            )
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            db.refresh(vehicle)
            return transaction

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Restock failed: {str(e)}"
            )

    @staticmethod
    def list_transactions(
        db: Session,
        vehicle_id: Optional[int] = None,
        user_id: Optional[int] = None,
        transaction_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[InventoryTransaction], int]:
        query = db.query(InventoryTransaction)
        if vehicle_id:
            query = query.filter(InventoryTransaction.vehicle_id == vehicle_id)
        if user_id:
            query = query.filter(InventoryTransaction.user_id == user_id)
        if transaction_type:
            query = query.filter(InventoryTransaction.transaction_type == transaction_type.upper())

        total = query.count()
        items = query.order_by(desc(InventoryTransaction.created_at)).offset(offset).limit(limit).all()
        return items, total
