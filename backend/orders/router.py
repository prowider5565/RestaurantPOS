from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db

from .handlers import create_order
from .schemas import OrderCreate, OrderItemOut, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut)
def create_order_api(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderOut:
    order, items = create_order(db, payload)
    return OrderOut(
        id=order.id,
        code=order.code,
        total_price=order.total_price,
        status=order.status,
        items=[
            OrderItemOut(product_id=i.product_id, quantity=i.quantity) for i in items
        ],
    )
