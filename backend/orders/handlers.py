from __future__ import annotations
import datetime
from datetime import date, datetime, time

from fastapi import HTTPException
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from .models import Order, OrderItem
from .schemas import OrderCreate, OrderHistoryOverviewOut, OrderHistoryResponseOut


def create_order(db: Session, payload: OrderCreate) -> tuple[Order, list[OrderItem]]:
    # product_ids = [i.product for i in payload.items]
    # existing = set(
    #     r[0] for r in db.query(Product.id).filter(Product.id.in_(product_ids)).all()
    # )
    # missing = [pid for pid in product_ids if pid not in existing]
    # if missing:
    #     raise HTTPException(status_code=400, detail="Invalid product id(s)")

    discounted_total = max(0.0, min(payload.discounted_total, payload.total))
    discount_amount = int(max(0, round(payload.total - discounted_total)))

    order = Order(
        total_price=payload.total,
        discount_amount=discount_amount,
        user_id=payload.user_id
        # status=payload.status,
    )
    db.add(order)
    db.flush()

    items: list[OrderItem] = []
    for i in payload.items:
        item = OrderItem(order_id=order.id, product_id=i.product, quantity=i.quantity)
        db.add(item)
        items.append(item)

    db.commit()
    
    # Refresh and eagerly load relationships
    db.refresh(order, ["user", "items"])
    for item in items:
        db.refresh(item)

    return order, items


def get_order_history(
    db: Session, from_date: date | None, to_date: date | None, params: Params
):
    def apply_filters(q):
        if from_date is not None:
            q = q.filter(Order.created_at >= datetime.combine(from_date, time.min))
        if to_date is not None:
            q = q.filter(Order.created_at <= datetime.combine(to_date, time.max))
        return q

    sum_query = apply_filters(
        db.query(func.coalesce(func.sum(Order.total_price), 0.0)).select_from(Order)
    )
    total_sum = float(sum_query.scalar() or 0.0)

    query = apply_filters(db.query(Order).options(selectinload(Order.items), selectinload(Order.user))).order_by(
        Order.created_at.desc()
    )
    page = paginate(db, query, params)

    overview = OrderHistoryOverviewOut(
        total_orders=int(page.total), total_sum=total_sum
    )
    return OrderHistoryResponseOut(overview=overview, page=page)


def get_my_order_history(db: Session, user_id: int, params: Params) -> OrderHistoryResponseOut:
    sum_query = (
        db.query(func.coalesce(func.sum(Order.total_price), 0.0))
        .select_from(Order)
        .filter(Order.user_id == user_id)
    )
    total_sum = float(sum_query.scalar() or 0.0)

    query = (
        db.query(Order)
        .options(selectinload(Order.items), selectinload(Order.user))
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    page = paginate(db, query, params)

    overview = OrderHistoryOverviewOut(total_orders=int(page.total), total_sum=total_sum)
    return OrderHistoryResponseOut(overview=overview, page=page)


def get_order_or_404(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.user))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
