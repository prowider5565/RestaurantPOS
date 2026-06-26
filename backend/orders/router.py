from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from datetime import date
from fastapi_pagination import Params

from orders.models import Order, OrderTable
from config.database import get_db
from misc.decorators import require_delete_password
from users.dependencies import get_current_user
from users.models import User

from .handlers import (
    create_order_table,
    delete_order,
    get_food_sales_analytics,
    get_my_order_history,
    get_order_history,
    get_order_or_404,
    list_order_tables,
)
from .schemas import (
    FoodAnalyticsResponseOut,
    OrderCreate,
    OrderHistoryResponseOut,
    OrderOut,
    OrderTableCreate,
    OrderTableOut,
)


router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut)
def create_order_api(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderOut:
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
    return get_order_or_404(db, order.id)


@router.get("/tables", response_model=list[OrderTableOut])
def list_order_tables_api(db: Session = Depends(get_db)) -> list[OrderTableOut]:
    return list_order_tables(db)


@router.post("/tables/create", response_model=OrderTableOut)
def create_order_table_api(
    payload: OrderTableCreate, db: Session = Depends(get_db)
) -> OrderTableOut:
    return create_order_table(db, payload)


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
