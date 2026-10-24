from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_active_admin
from app.models.user import User
from app.schemas.inventory import (
    PurchaseRequest,
    RestockRequest,
    TransactionResponse,
    TransactionListResponse,
)
from app.services.inventory_service import InventoryService

# Note: /vehicles/{id}/purchase and /vehicles/{id}/restock are mounted here or via prefix
router = APIRouter(tags=["Inventory & Transactions"])


@router.post("/vehicles/{vehicle_id}/purchase", response_model=TransactionResponse)
def purchase_vehicle(
    vehicle_id: int,
    purchase_in: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Processes a vehicle purchase with database transaction & concurrency control."""
    return InventoryService.purchase_vehicle(
        db=db,
        vehicle_id=vehicle_id,
        user=current_user,
        units=purchase_in.units,
        notes=purchase_in.notes,
    )


@router.post("/vehicles/{vehicle_id}/restock", response_model=TransactionResponse)
def restock_vehicle(
    vehicle_id: int,
    restock_in: RestockRequest,
    admin_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """Restocks inventory for a specified vehicle (Admin only)."""
    return InventoryService.restock_vehicle(
        db=db,
        vehicle_id=vehicle_id,
        admin_user=admin_user,
        units=restock_in.units,
        notes=restock_in.notes,
    )


@router.get("/inventory/transactions", response_model=TransactionListResponse)
def get_inventory_transactions(
    vehicle_id: Optional[int] = Query(None, description="Filter transactions by vehicle ID"),
    user_id: Optional[int] = Query(None, description="Filter transactions by user ID"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves audit log of inventory transactions.
    
    Regular users are strictly scoped to their own transaction history.
    Administrators can access all transaction records across the dealership.
    """
    if current_user.role != "ADMIN":
        if user_id is not None and user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view other users' transaction history."
            )
        effective_user_id = current_user.id
    else:
        effective_user_id = user_id

    items, total = InventoryService.list_transactions(
        db=db,
        vehicle_id=vehicle_id,
        user_id=effective_user_id,
        transaction_type=transaction_type,
        limit=limit,
        offset=offset,
    )
    return {
        "items": items,
        "total": total,
    }
