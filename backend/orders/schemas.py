from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi_pagination import Page
from pydantic import BaseModel, ConfigDict, Field

from products.types import ProductMeasure

from .types import OrderStatus


class OrderItemCreate(BaseModel):
    product: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    total: float = Field(gt=0)
    discounted_total: float = Field(ge=0)
    user_id: int
    order_table_id: int
    waiter_fee: bool
    payment_type: Optional[str] = None
    # status: OrderStatus = OrderStatus.PENDING
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


class UserSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    position: str | None = None


class OrderTableCreate(BaseModel):
    table_number: int = Field(gt=0)
    table_color: str = Field(min_length=1, max_length=50)


class OrderTableOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_number: int
    table_color: str


class OrderItemDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product: ProductSummaryOut
    quantity: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_price: float
    payment_type: str | None = None
    waiter_fee: bool
    waitress_wage: float
    discount_amount: int | None = 0
    # status: OrderStatus
    created_at: datetime
    user: UserSummaryOut | None = None
    order_table: OrderTableOut | None = None
    items: list[OrderItemDetailOut]


class OrderHistoryRowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_price: float
    payment_type: str | None = None
    waiter_fee: bool
    waitress_wage: float
    discount_amount: int | None = 0
    # status: OrderStatus
    created_at: datetime
    user: UserSummaryOut | None = None
    order_table: OrderTableOut | None = None
    items: list[OrderItemOut]


class OrderHistoryOverviewOut(BaseModel):
    total_orders: int
    total_sum: float
    total_net_sum: float
    total_discount_sum: float
    total_waiter_fee_sum: float


class OrderHistoryResponseOut(BaseModel):
    overview: OrderHistoryOverviewOut
    page: Page[OrderHistoryRowOut]


class FoodAnalyticsRowOut(BaseModel):
    product_id: int
    food_name: str
    total_sold_price: float
    times_sold: int


class FoodAnalyticsResponseOut(BaseModel):
    items: list[FoodAnalyticsRowOut]
