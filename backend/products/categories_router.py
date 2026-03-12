from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db

from .categories_handlers import create_category, list_categories
from .schemas import ProductCategoryCreate, ProductCategoryOut

router = APIRouter(prefix="/product-categories", tags=["product-categories"])


@router.get("", response_model=list[ProductCategoryOut])
def list_categories_api(db: Session = Depends(get_db)) -> list[ProductCategoryOut]:
    return list_categories(db)


@router.post("", response_model=ProductCategoryOut)
def create_category_api(payload: ProductCategoryCreate, db: Session = Depends(get_db)) -> ProductCategoryOut:
    return create_category(db, payload)

