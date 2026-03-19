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
from orders.models import Order
from users.dependencies import get_current_user
from users.models import User
from cash_desk.types import TransactionType


router = APIRouter(prefix="/cash-desk", tags=["cash-desk"])

DatePreset = Literal["daily", "weekly", "monthly"]


def resolve_date_range(
    preset: DatePreset | None,
    from_date: date | None,
    to_date: date | None,
) -> tuple[datetime, datetime]:
    if preset is not None:
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
    q = q.filter(CashDesk.created_at >= start)
    q = q.filter(CashDesk.created_at <= end)
    q = q.order_by(CashDesk.created_at.desc())
    return paginate(db, q, params)


@router.get("/summary", response_model=CashDeskSummaryOut)
def get_cash_desk_summary_api(
    preset: DatePreset | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> CashDeskSummaryOut:
    start, end = resolve_date_range(preset, from_date, to_date)

    order_total = float(
        (
            db.query(func.coalesce(func.sum(Order.total_price), 0.0))
            .filter(Order.created_at >= start)
            .filter(Order.created_at <= end)
            .scalar()
        )
        or 0.0
    )

    misc_income = float(
        (
            db.query(func.coalesce(func.sum(CashDesk.amount), 0))
            .filter(CashDesk.transaction_type == TransactionType.IN)
            .filter(CashDesk.created_at >= start)
            .filter(CashDesk.created_at <= end)
            .scalar()
        )
        or 0.0
    )

    expense = float(
        (
            db.query(func.coalesce(func.sum(CashDesk.amount), 0))
            .filter(CashDesk.transaction_type == TransactionType.OUT)
            .filter(CashDesk.created_at >= start)
            .filter(CashDesk.created_at <= end)
            .scalar()
        )
        or 0.0
    )

    current_amount = order_total + misc_income - expense
    return CashDeskSummaryOut(
        current_amount=current_amount,
        total_order_income=order_total,
        total_misc_income=misc_income,
        total_expense=expense,
    )
