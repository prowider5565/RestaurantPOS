from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from datetime import date
from fastapi_pagination import Params

from products.models import Product
from config.settings import settings
from cheque.helpers.printer import generate_cheque_content, print_cheque
from orders.models import Order, OrderItem
from config.database import get_db
from misc.decorators import require_delete_password
from users.dependencies import get_current_user
from users.models import User

from .handlers import (
    delete_order,
    get_food_sales_analytics,
    get_my_order_history,
    get_order_history,
    get_order_or_404,
)
from .schemas import (
    FoodAnalyticsResponseOut,
    OrderCreate,
    OrderHistoryResponseOut,
    OrderOut,
)


router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut)
def create_order_api(payload: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> OrderOut:
    receipt_content = {}
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

    # Add user details, total price and discount amount in receipt content 
    receipt_content["total_price"] = total_price
    receipt_content["discount_amount"] = discount_amount
    receipt_content["user"] = {"username": current_user.username, "position": current_user.position}
    receipt_content["payment_type"] = payload.payment_type
    # Add items in receipt content
    receipt_content["items"] = []

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
    # Preload products beforehand.
    product_ids = [i.product for i in payload.items]
    products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()}

    for i in payload.items:
        product = products.get(i.product)
        item = OrderItem(order=order, product=product, quantity=i.quantity)
        db.add(item)
        receipt_content["items"].append(
            {
                "name": product.name,
                "price": product.price,
                "quantity": i.quantity,
                "subtotal": product.price * i.quantity
            }
        )
    db.commit()
    generated_receipt_content = generate_cheque_content(
        order_data=receipt_content, 
        program_name=settings.COMPANY_NAME
    )
    print(generated_receipt_content)
    print_cheque(generated_receipt_content)
    return Response(status_code=status.HTTP_201_CREATED) 


@router.get("/history", response_model=OrderHistoryResponseOut)
def get_order_history_api(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    exclude_debt_from_total_sum: bool = Query(default=False),
    params: Params = Depends(),
    db: Session = Depends(get_db),
) -> OrderHistoryResponseOut:
    return get_order_history(
        db,
        from_date=from_date,
        to_date=to_date,
        params=params,
        exclude_debt_from_total_sum=exclude_debt_from_total_sum,
    )


@router.get("/my-history", response_model=OrderHistoryResponseOut)
def get_my_order_history_api(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    exclude_debt_from_total_sum: bool = Query(default=False),
    params: Params = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderHistoryResponseOut:
    return get_my_order_history(
        db,
        user_id=current_user.id,
        params=params,
        from_date=from_date,
        to_date=to_date,
        exclude_debt_from_total_sum=exclude_debt_from_total_sum,
    )


@router.get("/food-analytics", response_model=FoodAnalyticsResponseOut)
def get_food_sales_analytics_api(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> FoodAnalyticsResponseOut:
    return get_food_sales_analytics(db, from_date=from_date, to_date=to_date)


@router.get("/{order_id}", response_model=OrderOut)
def get_order_api(order_id: int, db: Session = Depends(get_db)) -> OrderOut:
    return get_order_or_404(db, order_id)


@router.delete("/delete/{order_id}")
@require_delete_password
async def delete_order_api(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    delete_order(db, order_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
