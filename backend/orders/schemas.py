from __future__ import annotations

from datetime import datetime

from fastapi_pagination import Page
from pydantic import BaseModel, ConfigDict, Field

from products.types import ProductMeasure

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


class ProductSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: float
    image_path: str | None = None
    category_id: int | None = None
    measure: ProductMeasure | None = None


class OrderItemDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product: ProductSummaryOut
    quantity: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_price: float
    status: OrderStatus
    items: list[OrderItemDetailOut]


class OrderHistoryRowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_price: float
    status: OrderStatus
    created_at: datetime
    items: list[OrderItemOut]


class OrderHistoryOverviewOut(BaseModel):
    total_orders: int
    total_sum: float


class OrderHistoryResponseOut(BaseModel):
    overview: OrderHistoryOverviewOut
    page: Page[OrderHistoryRowOut]
