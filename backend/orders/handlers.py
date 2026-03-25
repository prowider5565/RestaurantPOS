from __future__ import annotations
import datetime
from datetime import date, datetime, time

from fastapi import HTTPException
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from orders.types import OrderStatus

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


def get_pending_order_for_table(db: Session, table_id: int) -> Order | None:
    return (
        db.query(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
            selectinload(Order.order_table),
        )
        .filter(
            Order.order_table_id == table_id,
            Order.status == OrderStatus.PENDING,
        )
        .order_by(Order.created_at.desc())
        .first()
    )


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
    db.commit()
    db.refresh(order_table)
    return order_table


def create_order(db: Session, payload: OrderCreate) -> tuple[Order, list[OrderItem]]:
    discounted_total = max(0.0, min(payload.discounted_total, payload.total))
    discount_amount = int(max(0, round(payload.total - discounted_total)))
    order_table = (
        db.query(OrderTable).filter(OrderTable.id == payload.order_table_id).first()
    )
    if not order_table:
        raise HTTPException(status_code=400, detail="Invalid order table id")
    if order_table.orders and any(
        o.status == OrderStatus.PENDING for o in order_table.orders
    ):
        raise HTTPException(status_code=400, detail="Ushbu stol band qilingan")

    order = Order(
        total_price=payload.total,
        discount_amount=discount_amount,
        user_id=payload.user_id,
        order_table_id=payload.order_table_id,
        waiter_fee=payload.waiter_fee,
        payment_type=payload.payment_type,
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
    db.refresh(order, ["user", "items", "order_table"])
    for item in items:
        db.refresh(item)

    return order, items


def update_order(db: Session, order_id: int, payload: OrderCreate) -> Order:
    discounted_total = max(0.0, min(payload.discounted_total, payload.total))
    discount_amount = int(max(0, round(payload.total - discounted_total)))
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending orders can be updated")

    order_table = (
        db.query(OrderTable).filter(OrderTable.id == payload.order_table_id).first()
    )
    if not order_table:
        raise HTTPException(status_code=400, detail="Invalid order table id")

    conflicting_order = (
        db.query(Order)
        .filter(
            Order.order_table_id == payload.order_table_id,
            Order.status == OrderStatus.PENDING,
            Order.id != order_id,
        )
        .first()
    )
    if conflicting_order:
        raise HTTPException(status_code=400, detail="Ushbu stol band qilingan")

    order.total_price = payload.total
    order.discount_amount = discount_amount
    order.user_id = payload.user_id
    order.order_table_id = payload.order_table_id
    order.waiter_fee = payload.waiter_fee
    order.payment_type = payload.payment_type

    existing_items = {item.product_id: item for item in order.items}
    next_product_ids = {item.product for item in payload.items}

    for item in payload.items:
        existing = existing_items.get(item.product)
        if existing:
            existing.quantity = item.quantity
            continue

        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product,
                quantity=item.quantity,
            )
        )

    for product_id, item in existing_items.items():
        if product_id in next_product_ids:
            continue
        db.delete(item)

    db.commit()
    return get_order_or_404(db, order.id)


def complete_order(db: Session, order_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending orders can be completed")

    order.status = OrderStatus.COMPLETED
    db.commit()
    return get_order_or_404(db, order.id)


def get_order_history(
    db: Session, from_date: date | None, to_date: date | None, params: Params
):
    def apply_filters(q):
        if from_date is not None:
            q = q.filter(Order.created_at >= datetime.combine(from_date, time.min))
        if to_date is not None:
            q = q.filter(Order.created_at <= datetime.combine(to_date, time.max))
        return q

    total_sum_query = apply_filters(
        db.query(func.coalesce(func.sum(Order.total_price), 0.0)).select_from(Order)
    )
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
) -> OrderHistoryResponseOut:
    def apply_filters(q):
        q = q.filter(Order.user_id == user_id)
        if from_date is not None:
            q = q.filter(Order.created_at >= datetime.combine(from_date, time.min))
        if to_date is not None:
            q = q.filter(Order.created_at <= datetime.combine(to_date, time.max))
        return q

    total_sum_query = apply_filters(
        db.query(func.coalesce(func.sum(Order.total_price), 0.0)).select_from(Order)
    )
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
