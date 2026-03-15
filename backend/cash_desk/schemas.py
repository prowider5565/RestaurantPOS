from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from cash_desk.types import TransactionType


class CashDeskTransactionCreateIn(BaseModel):
    amount: int = Field(ge=1)
    transaction_type: TransactionType


class CashDeskSummaryOut(BaseModel):
    current_amount: float
    total_order_income: float
    total_misc_income: float
    total_expense: float


class CashDeskUserOut(BaseModel):
    id: int
    username: str
    position: str | None = None

    class Config:
        from_attributes = True


class CashDeskTransactionOut(BaseModel):
    id: int
    amount: int
    transaction_type: TransactionType
    user_id: int
    user: CashDeskUserOut
    created_at: datetime

    class Config:
        from_attributes = True


class DeleteOut(BaseModel):
    message: str
