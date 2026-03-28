from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from cash_desk.models import CashDesk
from cash_desk.schemas import (
    CashDeskSummaryOut,
    CashDeskTransactionCreateIn,
    CashDeskTransactionOut,
    DeleteOut,
)
from config.database import get_db
from misc.decorators import require_delete_password
from orders.models import Order
from users.dependencies import get_current_user
from users.models import User
from cash_desk.types import TransactionType


router = APIRouter(prefix="/cash-desk", tags=["cash-desk"])

DatePreset = Literal["daily", "weekly", "monthly", "all"]


def resolve_date_range(
    preset: DatePreset | None,
    from_date: date | None,
    to_date: date | None,
) -> tuple[datetime | None, datetime | None]:
    if preset is not None:
        if preset == "all":
            return None, None

        end_date = date.today()
        start_date = end_date
        if preset == "weekly":
            start_date = end_date.fromordinal(end_date.toordinal() - 6)
        elif preset == "monthly":
            start_date = end_date.fromordinal(end_date.toordinal() - 29)

        return datetime.combine(start_date, time.min), datetime.combine(end_date, time.max)

    start_date = from_date or to_date or date.today()
    end_date = to_date or from_date or start_date
    return datetime.combine(start_date, time.min), datetime.combine(end_date, time.max)


@router.post("/transactions", response_model=CashDeskTransactionOut)
def create_transaction_api(
    payload: CashDeskTransactionCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CashDeskTransactionOut:
    tx = CashDesk(
        amount=payload.amount,
        user_id=current_user.id,
        transaction_type=payload.transaction_type,
    )
    db.add(tx)
    db.commit()
    row = (
        db.query(CashDesk)
        .options(selectinload(CashDesk.user))
        .filter(CashDesk.id == tx.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create transaction")
    return row


@router.delete("/transactions/{transaction_id}", response_model=DeleteOut)
@require_delete_password
def delete_transaction_api(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeleteOut:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privilege required")

    tx = db.query(CashDesk).filter(CashDesk.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return DeleteOut(message="Deleted")


@router.get("/transactions", response_model=Page[CashDeskTransactionOut])
def get_transactions_api(
    preset: DatePreset | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    params: Params = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Page[CashDeskTransactionOut]:
    start, end = resolve_date_range(preset, from_date, to_date)
    q = db.query(CashDesk).options(selectinload(CashDesk.user))
    if start is not None:
        q = q.filter(CashDesk.created_at >= start)
    if end is not None:
        q = q.filter(CashDesk.created_at <= end)
    q = q.order_by(CashDesk.created_at.desc())
    return paginate(db, q, params)


@router.get("/summary", response_model=CashDeskSummaryOut)
def get_cash_desk_summary_api(
    preset: DatePreset | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    cashout_at: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
) -> CashDeskSummaryOut:
    start, end = resolve_date_range(preset, from_date, to_date)
    current_start = cashout_at

    total_order_income_query = db.query(func.coalesce(func.sum(Order.paid_amount), 0.0))
    if start is not None:
        total_order_income_query = total_order_income_query.filter(Order.created_at >= start)
    if end is not None:
        total_order_income_query = total_order_income_query.filter(Order.created_at <= end)
    total_order_income = float(total_order_income_query.scalar() or 0.0)

    total_misc_income_query = db.query(func.coalesce(func.sum(CashDesk.amount), 0)).filter(
        CashDesk.transaction_type == TransactionType.IN
    )
    if start is not None:
        total_misc_income_query = total_misc_income_query.filter(CashDesk.created_at >= start)
    if end is not None:
        total_misc_income_query = total_misc_income_query.filter(CashDesk.created_at <= end)
    total_misc_income = float(total_misc_income_query.scalar() or 0.0)

    total_expense_query = db.query(func.coalesce(func.sum(CashDesk.amount), 0)).filter(
        CashDesk.transaction_type == TransactionType.OUT
    )
    if start is not None:
        total_expense_query = total_expense_query.filter(CashDesk.created_at >= start)
    if end is not None:
        total_expense_query = total_expense_query.filter(CashDesk.created_at <= end)
    total_expense = float(total_expense_query.scalar() or 0.0)

    cumulative_order_income_query = db.query(
        func.coalesce(func.sum(Order.paid_amount), 0.0)
    )
    if end is not None:
        cumulative_order_income_query = cumulative_order_income_query.filter(Order.created_at <= end)
    cumulative_misc_income_query = (
        db.query(func.coalesce(func.sum(CashDesk.amount), 0))
        .filter(CashDesk.transaction_type == TransactionType.IN)
    )
    cumulative_expense_query = (
        db.query(func.coalesce(func.sum(CashDesk.amount), 0))
        .filter(CashDesk.transaction_type == TransactionType.OUT)
    )
    if end is not None:
        cumulative_misc_income_query = cumulative_misc_income_query.filter(CashDesk.created_at <= end)
        cumulative_expense_query = cumulative_expense_query.filter(CashDesk.created_at <= end)

    if current_start is not None:
        cumulative_order_income_query = cumulative_order_income_query.filter(
            Order.created_at >= current_start
        )
        cumulative_misc_income_query = cumulative_misc_income_query.filter(
            CashDesk.created_at >= current_start
        )
        cumulative_expense_query = cumulative_expense_query.filter(
            CashDesk.created_at >= current_start
        )

    cumulative_order_income = float(cumulative_order_income_query.scalar() or 0.0)
    cumulative_misc_income = float(cumulative_misc_income_query.scalar() or 0.0)
    cumulative_expense = float(cumulative_expense_query.scalar() or 0.0)

    current_amount = (
        cumulative_order_income + cumulative_misc_income - cumulative_expense
    )
    return CashDeskSummaryOut(
        current_amount=current_amount,
        total_order_income=total_order_income,
        total_misc_income=total_misc_income,
        total_expense=total_expense,
    )
