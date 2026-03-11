from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from fastapi_pagination import Page, Params

from config.database import get_db

from .handlers import create_order, get_order_history
from .schemas import OrderCreate, OrderHistoryRowOut, OrderItemOut, OrderOut


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


@router.get("/history", response_model=Page[OrderHistoryRowOut])
def get_order_history_api(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    params: Params = Depends(),
    db: Session = Depends(get_db),
) -> Page[OrderHistoryRowOut]:
    return get_order_history(db, from_date=from_date, to_date=to_date, params=params)
