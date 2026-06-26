from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi_pagination import Page
from pydantic import BaseModel, ConfigDict, Field

from products.types import ProductMeasure




class OrderItemCreate(BaseModel):
    product: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    total: float = Field(gt=0)
    discounted_total: float = Field(ge=0)
    user_id: int
    payment_type: Optional[str] = None
    is_debt: Optional[bool] = False
    items: list[OrderItemCreate] = Field(min_length=1)
    paid_amount: Optional[int] = Field(ge=0)


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


class OrderItemDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product: ProductSummaryOut
    quantity: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_price: float
    discount_amount: int | None = 0
    is_debt: bool
    paid_amount: Optional[int] = 0
    payment_type: Optional[str] = None
    created_at: datetime
    user: UserSummaryOut | None = None
    items: list[OrderItemDetailOut]


class OrderHistoryRowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_price: float
    discount_amount: int | None = 0
    is_debt: bool
    paid_amount: int | None = 0
    payment_type: str | None = None
    created_at: datetime
    user: UserSummaryOut | None = None
    items: list[OrderItemOut]


class OrderHistoryOverviewOut(BaseModel):
    total_orders: int
    total_sum: float
    total_net_sum: float
    total_discount_sum: float


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
