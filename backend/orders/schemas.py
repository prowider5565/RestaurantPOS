from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from .types import OrderStatus


class OrderItemCreate(BaseModel):
    product: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    total: float = Field(gt=0)
    status: OrderStatus = OrderStatus.PENDING
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    quantity: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str | None = None
    total_price: float
    status: OrderStatus
    items: list[OrderItemOut]

