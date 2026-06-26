from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from cash_desk.models import CashDesk
from cash_desk.schemas import (
    CashDeskSummaryOut,
    CashDeskTransactionCreateIn,
    CashDeskTransactionOut,
    DeleteOut,
)
from cash_desk.types import TransactionType
from config.database import get_db
from misc.decorators import require_delete_password
from orders.models import Order
from users.dependencies import get_current_user
from users.models import User

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

        return (
            datetime.combine(start_date, time.min),
            datetime.combine(end_date, time.max),
        )

    start_date = from_date or to_date or date.today()
    end_date = to_date or from_date or start_date
    return datetime.combine(start_date, time.min), datetime.combine(end_date, time.max)


def _apply_date_filters(query, model, start, end):
    if start is not None:
        query = query.filter(model.created_at >= start)
    if end is not None:
        query = query.filter(model.created_at <= end)
    return query


@router.post("/transactions")
def create_transaction_api(
    payload: CashDeskTransactionCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    tx = CashDesk(
        amount=payload.amount,
        user_id=current_user.id,
        transaction_type=payload.transaction_type,
    )
    db.add(tx)
    db.commit()
    db.flush()
    return Response(status_code=204)


@router.delete("/transactions/{transaction_id}", response_model=DeleteOut)
@require_delete_password
def delete_transaction_api(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeleteOut:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Ruxsat etilmaydi")

    tx = db.query(CashDesk).filter(CashDesk.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return DeleteOut(message="O'chirildi")


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
    q = _apply_date_filters(
        db.query(CashDesk).options(selectinload(CashDesk.user)), CashDesk, start, end
    )
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

    # Period totals: CashDesk IN/OUT from start to end (no cashout_at filter)
    period_row = (
        _apply_date_filters(
            db.query(
                func.coalesce(
                    func.sum(
                        case(
                            (
                                CashDesk.transaction_type == TransactionType.IN,
                                CashDesk.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("misc_income"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                CashDesk.transaction_type == TransactionType.OUT,
                                CashDesk.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("expense"),
            ),
            CashDesk,
            start,
            end,
        )
    ).one()

    # Cumulative totals: orders + cashdesk from max(start, cashout_at) to end
    cumulative_start = cashout_at if cashout_at is not None else start

    cum_order_row = (
        _apply_date_filters(
            db.query(
                func.coalesce(
                    func.sum(
                        case(
                            (Order.payment_type == "Naqd", Order.paid_amount),
                            else_=0,
                        )
                    ),
                    0,
                ).label("cash_order"),
                func.coalesce(
                    func.sum(
                        case(
                            (Order.payment_type == "Karta", Order.paid_amount),
                            else_=0,
                        )
                    ),
                    0,
                ).label("card_order"),
            ),
            Order,
            cumulative_start,
            end,
        )
    ).one()

    cum_cashdesk_row = (
        _apply_date_filters(
            db.query(
                func.coalesce(
                    func.sum(
                        case(
                            (
                                CashDesk.transaction_type == TransactionType.IN,
                                CashDesk.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("misc_income"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                CashDesk.transaction_type == TransactionType.OUT,
                                CashDesk.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("expense"),
            ),
            CashDesk,
            cumulative_start,
            end,
        )
    ).one()

    total_order_income = cum_order_row.cash_order + cum_order_row.card_order
    current_cash_amount = (
        cum_order_row.cash_order
        + cum_cashdesk_row.misc_income
        - cum_cashdesk_row.expense
    )
    current_card_amount = cum_order_row.card_order

    return CashDeskSummaryOut(
        current_amount=current_cash_amount + current_card_amount,
        current_cash_amount=current_cash_amount,
        current_card_amount=current_card_amount,
        total_order_income=total_order_income,
        total_misc_income=float(period_row.misc_income),
        total_expense=float(period_row.expense),
    )
