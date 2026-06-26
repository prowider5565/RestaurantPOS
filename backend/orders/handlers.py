from __future__ import annotations
from datetime import date, datetime, time

from fastapi_pagination import Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from orders.helpers import apply_filters

from .models import Order, OrderItem
from products.models import Product

from .schemas import (
    OrderHistoryOverviewOut,
    OrderHistoryResponseOut,
)


def get_order_history(
    db: Session,
    from_date: date | None,
    to_date: date | None,
    params: Params,
    exclude_debt_from_total_sum: bool = False,
):
    total_sum_query = apply_filters(
        db.query(func.coalesce(func.sum(Order.paid_amount), 0.0)).select_from(Order), from_date, to_date
    )
    if exclude_debt_from_total_sum:
        total_sum_query = total_sum_query.filter(Order.is_debt.is_(False))
    total_sum = float(total_sum_query.scalar() or 0.0)

    discount_sum_query = apply_filters(
        db.query(
            func.coalesce(func.sum(func.coalesce(Order.discount_amount, 0)), 0)
        ).select_from(Order), from_date, to_date
    )
    total_discount_sum = float(discount_sum_query.scalar() or 0.0)

    net_sum_query = apply_filters(
        db.query(
            func.coalesce(
                func.sum(Order.total_price - func.coalesce(Order.discount_amount, 0)),
                0.0,
            )
        ).select_from(Order), from_date, to_date
    )
    total_net_sum = float(net_sum_query.scalar() or 0.0)

    query = apply_filters(
        db.query(Order).options(
            selectinload(Order.items),
            selectinload(Order.user),
        ), from_date, to_date
    ).order_by(Order.created_at.desc())
    page = paginate(db, query, params)

    overview = OrderHistoryOverviewOut(
        total_orders=int(page.total),
        total_sum=total_sum,
        total_net_sum=total_net_sum,
        total_discount_sum=total_discount_sum,
    )
    return OrderHistoryResponseOut(overview=overview, page=page)


def get_my_order_history(
    db: Session,
    user_id: int,
    params: Params,
    from_date: date | None = None,
    to_date: date | None = None,
    exclude_debt_from_total_sum: bool = False,
) -> OrderHistoryResponseOut:
    total_sum_query = apply_filters(
        db.query(func.coalesce(func.sum(Order.paid_amount), 0.0)).select_from(Order), from_date, to_date
    )
    if exclude_debt_from_total_sum:
        total_sum_query = total_sum_query.filter(Order.is_debt.is_(False))
    total_sum = float(total_sum_query.scalar() or 0.0)

    discount_sum_query = apply_filters(
        db.query(
            func.coalesce(func.sum(func.coalesce(Order.discount_amount, 0)), 0)
        ).select_from(Order), from_date, to_date
    )
    total_discount_sum = float(discount_sum_query.scalar() or 0.0)

    net_sum_query = apply_filters(
        db.query(
            func.coalesce(
                func.sum(Order.total_price - func.coalesce(Order.discount_amount, 0)),
                0.0,
            )
        ).select_from(Order), from_date, to_date
    )
    total_net_sum = float(net_sum_query.scalar() or 0.0)

    query = apply_filters(
        db.query(Order).options(
            selectinload(Order.items),
            selectinload(Order.user),
        ), from_date, to_date
    ).order_by(Order.created_at.desc())
    page = paginate(db, query, params)

    overview = OrderHistoryOverviewOut(
        total_orders=int(page.total),
        total_sum=total_sum,
        total_net_sum=total_net_sum,
        total_discount_sum=total_discount_sum,
    )
    return OrderHistoryResponseOut(overview=overview, page=page)
