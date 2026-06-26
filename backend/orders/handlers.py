from __future__ import annotations
from datetime import date, datetime, time

from fastapi import HTTPException
from fastapi_pagination import Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from .models import Order, OrderItem
from products.models import Product

from .schemas import (
    FoodAnalyticsResponseOut,
    FoodAnalyticsRowOut,
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
    def apply_filters(q):
        if from_date is not None:
            q = q.filter(Order.created_at >= datetime.combine(from_date, time.min))
        if to_date is not None:
            q = q.filter(Order.created_at <= datetime.combine(to_date, time.max))
        return q

    total_sum_query = apply_filters(
        db.query(func.coalesce(func.sum(Order.paid_amount), 0.0)).select_from(Order)
    )
    if exclude_debt_from_total_sum:
        total_sum_query = total_sum_query.filter(Order.is_debt.is_(False))
    total_sum = float(total_sum_query.scalar() or 0.0)

    discount_sum_query = apply_filters(
        db.query(
            func.coalesce(func.sum(func.coalesce(Order.discount_amount, 0)), 0)
        ).select_from(Order)
    )
    total_discount_sum = float(discount_sum_query.scalar() or 0.0)

    net_sum_query = apply_filters(
        db.query(
            func.coalesce(
                func.sum(Order.total_price - func.coalesce(Order.discount_amount, 0)),
                0.0,
            )
        ).select_from(Order)
    )
    total_net_sum = float(net_sum_query.scalar() or 0.0)

    query = apply_filters(
        db.query(Order).options(
            selectinload(Order.items),
            selectinload(Order.user),
        )
    ).order_by(Order.created_at.desc())
    page = paginate(db, query, params)

    overview = OrderHistoryOverviewOut(
        total_orders=int(page.total),
        total_sum=total_sum,
        total_net_sum=total_net_sum,
        total_discount_sum=total_discount_sum,
    )
    return OrderHistoryResponseOut(overview=overview, page=page)


def get_food_sales_analytics(
    db: Session, from_date: date | None, to_date: date | None
) -> FoodAnalyticsResponseOut:
    query = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("food_name"),
            func.coalesce(func.sum(OrderItem.quantity * Product.price), 0.0).label(
                "total_sold_price"
            ),
            func.coalesce(func.sum(OrderItem.quantity), 0).label("times_sold"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
    )

    if from_date is not None:
        query = query.filter(Order.created_at >= datetime.combine(from_date, time.min))
    if to_date is not None:
        query = query.filter(Order.created_at <= datetime.combine(to_date, time.max))

    rows = (
        query.group_by(Product.id, Product.name)
        .order_by(
            func.coalesce(func.sum(OrderItem.quantity * Product.price), 0.0).desc(),
            Product.name.asc(),
        )
        .all()
    )

    return FoodAnalyticsResponseOut(
        items=[
            FoodAnalyticsRowOut(
                product_id=int(row.product_id),
                food_name=str(row.food_name),
                total_sold_price=float(row.total_sold_price or 0.0),
                times_sold=int(row.times_sold or 0),
            )
            for row in rows
        ]
    )


def get_my_order_history(
    db: Session,
    user_id: int,
    params: Params,
    from_date: date | None = None,
    to_date: date | None = None,
    exclude_debt_from_total_sum: bool = False,
) -> OrderHistoryResponseOut:
    def apply_filters(q):
        if from_date is not None:
            q = q.filter(Order.created_at >= datetime.combine(from_date, time.min))
        if to_date is not None:
            q = q.filter(Order.created_at <= datetime.combine(to_date, time.max))
        return q

    total_sum_query = apply_filters(
        db.query(func.coalesce(func.sum(Order.paid_amount), 0.0)).select_from(Order)
    )
    if exclude_debt_from_total_sum:
        total_sum_query = total_sum_query.filter(Order.is_debt.is_(False))
    total_sum = float(total_sum_query.scalar() or 0.0)

    discount_sum_query = apply_filters(
        db.query(
            func.coalesce(func.sum(func.coalesce(Order.discount_amount, 0)), 0)
        ).select_from(Order)
    )
    total_discount_sum = float(discount_sum_query.scalar() or 0.0)

    net_sum_query = apply_filters(
        db.query(
            func.coalesce(
                func.sum(Order.total_price - func.coalesce(Order.discount_amount, 0)),
                0.0,
            )
        ).select_from(Order)
    )
    total_net_sum = float(net_sum_query.scalar() or 0.0)

    query = apply_filters(
        db.query(Order).options(
            selectinload(Order.items),
            selectinload(Order.user),
        )
    ).order_by(Order.created_at.desc())
    page = paginate(db, query, params)

    overview = OrderHistoryOverviewOut(
        total_orders=int(page.total),
        total_sum=total_sum,
        total_net_sum=total_net_sum,
        total_discount_sum=total_discount_sum,
    )
    return OrderHistoryResponseOut(overview=overview, page=page)


def get_order_or_404(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def delete_order(db: Session, order_id: int) -> None:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()


def pay_debt(db: Session, amount: int, order_id: int) -> None:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if not order.is_debt:
        raise HTTPException(status_code=400, detail="Order is not a debt")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    final_total = int((order.total_price or 0) - (order.discount_amount or 0))
    next_paid_amount = min(final_total, int(order.paid_amount or 0) + amount)
    order.paid_amount = next_paid_amount
    if next_paid_amount >= final_total:
        order.is_debt = False

    db.commit()
    db.refresh(order)
    return order
