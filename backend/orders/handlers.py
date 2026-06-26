import asyncio
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi_pagination import Params
from sqlalchemy.orm import Session, selectinload

from cheque.helpers.generator import generate_receipt
from cheque.helpers.printer import print_cheque
from config.database import get_db
from config.settings import settings
from misc.decorators import require_delete_password
from orders.models import Order, OrderItem
from products.models import Product
from users.dependencies import get_current_user
from users.models import User

from .helpers import _history_query
from .schemas import OrderCreate, OrderHistoryResponseOut, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order_api(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    total_price = int(max(0, round(payload.total)))
    final_total = int(max(0, min(round(payload.discounted_total), total_price)))
    discount_amount = max(0, total_price - final_total)
    paid_amount = int(max(0, round(payload.paid_amount or 0)))

    if paid_amount > final_total:
        paid_amount = final_total
    is_debt = bool(payload.is_debt)
    if not is_debt:
        paid_amount = final_total
    elif paid_amount >= final_total:
        is_debt = False

    product_ids = [i.product for i in payload.items]
    products = {
        p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()
    }

    missing = [pid for pid in product_ids if pid not in products]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Products not found: {missing}",
        )

    order = Order(
        total_price=total_price,
        discount_amount=discount_amount,
        user_id=payload.user_id,
        payment_type=payload.payment_type,
        paid_amount=paid_amount,
        is_debt=is_debt,
    )
    db.add(order)
    db.flush()

    receipt_items = []
    for i in payload.items:
        product = products[i.product]
        db.add(OrderItem(order=order, product=product, quantity=i.quantity))
        receipt_items.append(
            {
                "name": product.name,
                "price": product.price,
                "quantity": i.quantity,
                "subtotal": product.price * i.quantity,
            }
        )

    db.commit()

    receipt_content = {
        "total_price": total_price,
        "discount_amount": discount_amount,
        "user": {
            "username": current_user.username,
            "position": current_user.position,
        },
        "payment_type": payload.payment_type,
        "items": receipt_items,
    }
    generated = generate_receipt(
        order_data=receipt_content, program_name=settings.COMPANY_NAME
    )
    await asyncio.to_thread(print_cheque, generated)

    db.refresh(order)
    return order


@router.get("/history", response_model=OrderHistoryResponseOut)
def get_order_history_api(
    preset: str | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    params: Params = Depends(),
    db: Session = Depends(get_db),
) -> OrderHistoryResponseOut:
    return _history_query(db, preset, from_date, to_date, params=params)


@router.get("/my-history", response_model=OrderHistoryResponseOut)
def get_my_order_history_api(
    preset: str | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    params: Params = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderHistoryResponseOut:
    return _history_query(
        db, preset, from_date, to_date, user_id=current_user.id, params=params
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order_api(order_id: int, db: Session = Depends(get_db)) -> OrderOut:
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


@router.delete("/delete/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_delete_password
async def delete_order_api(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()
