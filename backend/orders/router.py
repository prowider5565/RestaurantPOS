from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from fastapi_pagination import Params

from config.database import get_db

from .handlers import create_order, get_order_history, get_order_or_404
from .schemas import (
    OrderCreate,
    OrderHistoryResponseOut,
    OrderOut,
)


router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut)
def create_order_api(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderOut:
    order, _ = create_order(db, payload)
    return get_order_or_404(db, order.id)

@router.get("/history", response_model=OrderHistoryResponseOut)
def get_order_history_api(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    params: Params = Depends(),
    db: Session = Depends(get_db),
) -> OrderHistoryResponseOut:
    return get_order_history(db, from_date=from_date, to_date=to_date, params=params)


@router.get("/{order_id}", response_model=OrderOut)
def get_order_api(order_id: int, db: Session = Depends(get_db)) -> OrderOut:
    return get_order_or_404(db, order_id)
