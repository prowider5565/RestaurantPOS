from __future__ import annotations
import datetime
from datetime import date, datetime, time

from fastapi import HTTPException
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from .helpers import sync_order_table_to_supervisor, sync_order_to_supervisor
from .models import Order, OrderItem, OrderTable
from products.models import Product

from .schemas import (
    FoodAnalyticsResponseOut,
    FoodAnalyticsRowOut,
    OrderCreate,
    OrderHistoryOverviewOut,
    OrderHistoryResponseOut,
    OrderTableCreate,
)


def list_order_tables(db: Session) -> list[OrderTable]:
    return db.query(OrderTable).order_by(OrderTable.table_number.asc()).all()


def create_order_table(db: Session, payload: OrderTableCreate) -> OrderTable:
    table_color = payload.table_color.strip()
    if not table_color:
        raise HTTPException(status_code=400, detail="Table color is required")

    existing = (
        db.query(OrderTable)
        .filter(OrderTable.table_number == payload.table_number)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists")

    order_table = OrderTable(
        table_number=payload.table_number,
        table_color=table_color,
    )
    db.add(order_table)
    sync_order_table_to_supervisor(payload)
    db.commit()
    db.refresh(order_table)
    return order_table


def create_order(db: Session, payload: OrderCreate) -> tuple[Order, list[OrderItem]]:
    total_price = int(max(0, round(payload.total)))
    discounted_total = int(max(0, min(round(payload.discounted_total), total_price)))
    discount_amount = max(0, total_price - discounted_total)
    waitress_wage = int(round(total_price * 0.1)) if payload.waiter_fee else 0
    final_total = discounted_total + waitress_wage
    paid_amount = int(max(0, round(payload.paid_amount or 0)))
    if paid_amount > final_total:
        paid_amount = final_total
    is_debt = bool(payload.is_debt)
    if not is_debt:
        paid_amount = final_total
    elif paid_amount >= final_total:
        is_debt = False

    order_table = (
        db.query(OrderTable).filter(OrderTable.id == payload.order_table_id).first()
    )
    if not order_table:
        raise HTTPException(status_code=400, detail="Invalid order table id")

    order = Order(
        total_price=total_price,
        discount_amount=discount_amount,
        user_id=payload.user_id,
        order_table_id=payload.order_table_id,
        waiter_fee=payload.waiter_fee,
        payment_type=payload.payment_type,
        paid_amount=paid_amount,
        is_debt=is_debt,
    )
    db.add(order)
    db.flush()

    items: list[OrderItem] = []
    for i in payload.items:
        item = OrderItem(order_id=order.id, product_id=i.product, quantity=i.quantity)
        db.add(item)
        items.append(item)

    sync_order_to_supervisor(payload)
    db.commit()

    # Refresh and eagerly load relationships
    db.refresh(order, ["user", "items", "order_table"])
    for item in items:
        db.refresh(item)

    return order, items


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

    waiter_fee_sum_query = apply_filters(
        db.query(
            func.coalesce(
                func.sum(
                    case(
                        (Order.waiter_fee.is_(True), Order.total_price * 0.1),
                        else_=0.0,
                    )
                ),
                0.0,
            )
        ).select_from(Order)
    )
    if exclude_debt_from_total_sum:
        waiter_fee_sum_query = waiter_fee_sum_query.filter(Order.is_debt.is_(False))
    total_waiter_fee_sum = float(waiter_fee_sum_query.scalar() or 0.0)

    query = apply_filters(
        db.query(Order).options(
            selectinload(Order.items),
            selectinload(Order.user),
            selectinload(Order.order_table),
        )
    ).order_by(Order.created_at.desc())
    page = paginate(db, query, params)

    overview = OrderHistoryOverviewOut(
        total_orders=int(page.total),
        total_sum=total_sum,
        total_net_sum=total_net_sum,
        total_discount_sum=total_discount_sum,
        total_waiter_fee_sum=total_waiter_fee_sum,
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

    waiter_fee_sum_query = apply_filters(
        db.query(
            func.coalesce(
                func.sum(
                    case(
                        (Order.waiter_fee.is_(True), Order.total_price * 0.1),
                        else_=0.0,
                    )
                ),
                0.0,
            )
        ).select_from(Order)
    )
    if exclude_debt_from_total_sum:
        waiter_fee_sum_query = waiter_fee_sum_query.filter(Order.is_debt.is_(False))
    total_waiter_fee_sum = float(waiter_fee_sum_query.scalar() or 0.0)

    query = apply_filters(
        db.query(Order).options(
            selectinload(Order.items),
            selectinload(Order.user),
            selectinload(Order.order_table),
        )
    ).order_by(Order.created_at.desc())
    page = paginate(db, query, params)

    overview = OrderHistoryOverviewOut(
        total_orders=int(page.total),
        total_sum=total_sum,
        total_net_sum=total_net_sum,
        total_discount_sum=total_discount_sum,
        total_waiter_fee_sum=total_waiter_fee_sum,
    )
    return OrderHistoryResponseOut(overview=overview, page=page)


def get_order_or_404(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
            selectinload(Order.order_table),
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

    final_total = int((order.total_price or 0) - (order.discount_amount or 0) + (order.waitress_wage or 0))
    next_paid_amount = min(final_total, int(order.paid_amount or 0) + amount)
    order.paid_amount = next_paid_amount
    if next_paid_amount >= final_total:
        order.is_debt = False

    db.commit()
    db.refresh(order)
    return order
