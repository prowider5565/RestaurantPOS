from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import ProductCategory
from .schemas import ProductCategoryCreate


def create_category(db: Session, payload: ProductCategoryCreate) -> ProductCategory:
    category = ProductCategory(name=payload.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_categories(db: Session) -> list[ProductCategory]:
    return db.query(ProductCategory).order_by(ProductCategory.id.asc()).all()


def get_category_or_404(db: Session, category_id: int) -> ProductCategory:
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

