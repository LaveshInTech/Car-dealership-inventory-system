from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.vehicle import Vehicle
from app.models.transaction import InventoryTransaction
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryResponse, CategoryDistribution


class DashboardService:
    @staticmethod
    def get_summary(db: Session, current_user: Optional[User] = None) -> DashboardSummaryResponse:
        total_models = db.query(func.count(Vehicle.id)).scalar() or 0
        total_units = db.query(func.sum(Vehicle.quantity)).scalar() or 0

        # Calculate total inventory valuation: sum(quantity * price)
        vehicles = db.query(Vehicle.quantity, Vehicle.price, Vehicle.category).all()
        total_valuation = sum(float(v.quantity * v.price) for v in vehicles)

        out_of_stock_count = db.query(func.count(Vehicle.id)).filter(Vehicle.quantity == 0).scalar() or 0
        low_stock_count = db.query(func.count(Vehicle.id)).filter(Vehicle.quantity > 0, Vehicle.quantity <= 3).scalar() or 0

        # Calculate sales revenue and units sold from PURCHASE transactions
        purchase_txs = (
            db.query(
                func.sum(InventoryTransaction.total_amount),
                func.sum(func.abs(InventoryTransaction.quantity_change))
            )
            .filter(InventoryTransaction.transaction_type == "PURCHASE")
            .first()
        )
        total_sales_revenue = float(purchase_txs[0] or 0.0)
        total_units_sold = int(purchase_txs[1] or 0)

        # Category distribution
        categories_map = {}
        for v in vehicles:
            cat = v.category or "Other"
            if cat not in categories_map:
                categories_map[cat] = {"models": 0, "units": 0, "valuation": 0.0}
            categories_map[cat]["models"] += 1
            categories_map[cat]["units"] += v.quantity
            categories_map[cat]["valuation"] += float(v.quantity * v.price)

        categories_list = [
            CategoryDistribution(
                category=cat,
                models_count=data["models"],
                units_in_stock=data["units"],
                valuation=round(data["valuation"], 2),
            )
            for cat, data in sorted(categories_map.items(), key=lambda x: x[1]["valuation"], reverse=True)
        ]

        recent_vehicles = db.query(Vehicle).order_by(desc(Vehicle.created_at)).limit(5).all()

        tx_query = db.query(InventoryTransaction)
        if current_user and current_user.role != "ADMIN":
            tx_query = tx_query.filter(InventoryTransaction.user_id == current_user.id)
        recent_transactions = tx_query.order_by(desc(InventoryTransaction.created_at)).limit(8).all()

        return DashboardSummaryResponse(
            total_models=total_models,
            total_units=total_units,
            total_valuation=round(total_valuation, 2),
            out_of_stock_count=out_of_stock_count,
            low_stock_count=low_stock_count,
            total_sales_revenue=round(total_sales_revenue, 2),
            total_units_sold=total_units_sold,
            categories=categories_list,
            recent_vehicles=recent_vehicles,
            recent_transactions=recent_transactions,
        )
