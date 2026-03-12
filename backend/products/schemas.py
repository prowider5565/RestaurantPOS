from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from .types import ProductMeasure


class ProductCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class ProductCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    price: float = Field(gt=0)
    image_path: str | None = Field(default=None, max_length=500)
    category_id: int | None = None
    measure: ProductMeasure | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    price: float | None = Field(default=None, gt=0)
    image_path: str | None = Field(default=None, max_length=500)
    category_id: int | None = None
    measure: ProductMeasure | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: float
    image_path: str | None = None
    category_id: int | None = None
    measure: ProductMeasure | None = None
