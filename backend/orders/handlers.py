from __future__ import annotations
from datetime import date

from fastapi_pagination import Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from orders.helpers import apply_filters, get_date_range

from .models import Order, OrderItem

from .schemas import (
    OrderHistoryOverviewOut,
    OrderHistoryResponseOut,
)


def _history_query(
    db: Session,
    preset: str | None,
    from_date: date | None,
    to_date: date | None,
    user_id: int | None = None,
    params: Params | None = None,
):
    params = params or Params()
    from_date, to_date = get_date_range(preset, from_date, to_date)
    base = db.query(Order)
    if user_id is not None:
        base = base.filter(Order.user_id == user_id)
    base = apply_filters(base, from_date, to_date)

    stats = base.with_entities(
        func.coalesce(func.sum(Order.paid_amount), 0).label("total_paid_sum"),
        func.coalesce(func.sum(Order.discount_amount), 0).label("total_discount_sum"),
        func.coalesce(
            func.sum(Order.total_price - func.coalesce(Order.discount_amount, 0)), 0
        ).label("total_net_sum"),
    ).first()

    page = paginate(
        db,
        base.options(selectinload(Order.items), selectinload(Order.user)).order_by(
            Order.created_at.desc()
        ),
        params,
    )

    overview = OrderHistoryOverviewOut(
        total_orders=int(page.total),
        total_paid_sum=float(stats.total_paid_sum or 0),
        total_net_sum=float(stats.total_net_sum or 0),
        total_discount_sum=float(stats.total_discount_sum or 0),
    )
    return OrderHistoryResponseOut(overview=overview, page=page)


def get_order_history(
    db: Session,
    preset: str | None,
    from_date: date | None,
    to_date: date | None,
    params: Params,
):
    return _history_query(db, preset, from_date, to_date, params=params)


def get_my_order_history(
    db: Session,
    user_id: int,
    preset: str | None,
    from_date: date | None,
    to_date: date | None,
    params: Params,
):
    return _history_query(
        db, preset, from_date, to_date, user_id=user_id, params=params
    )
