from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from products.models import Product

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

