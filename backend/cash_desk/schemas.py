from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from cash_desk.types import TransactionType


class CashDeskTransactionCreateIn(BaseModel):
    amount: int = Field(ge=1)
    transaction_type: TransactionType


class CashDeskSummaryOut(BaseModel):
    current_amount: float
    current_cash_amount: float
    current_card_amount: float
    total_order_income: float
    total_misc_income: float
    total_expense: float


class CashDeskUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    position: str | None = None


class CashDeskTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: int
    transaction_type: TransactionType
    user_id: int
    user: CashDeskUserOut
    created_at: datetime


class DeleteOut(BaseModel):
    message: str
