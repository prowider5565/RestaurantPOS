from __future__ import annotations
import datetime
from datetime import date, datetime, time

from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.orm import Session, selectinload

from .models import Order, OrderItem
from .schemas import OrderCreate


def create_order(db: Session, payload: OrderCreate) -> tuple[Order, list[OrderItem]]:
    # product_ids = [i.product for i in payload.items]
    # existing = set(
    #     r[0] for r in db.query(Product.id).filter(Product.id.in_(product_ids)).all()
    # )
    # missing = [pid for pid in product_ids if pid not in existing]
    # if missing:
    #     raise HTTPException(status_code=400, detail="Invalid product id(s)")

    order = Order(
        total_price=payload.total,
        status=payload.status,
    )
    db.add(order)
    db.flush()

    items: list[OrderItem] = []
    for i in payload.items:
        item = OrderItem(order_id=order.id, product_id=i.product, quantity=i.quantity)
        db.add(item)
        items.append(item)

    db.commit()
    db.refresh(order)
    for item in items:
        db.refresh(item)

    return order, items


def get_order_history(
    db: Session, from_date: date | None, to_date: date | None, params: Params
):
    query = db.query(Order).options(selectinload(Order.items))
    if from_date is not None:
        query = query.filter(Order.created_at >= datetime.combine(from_date, time.min))
    if to_date is not None:
        query = query.filter(Order.created_at <= datetime.combine(to_date, time.max))

    query = query.order_by(Order.created_at.desc())
    return paginate(db, query, params)
