from __future__ import annotations

from fastapi import HTTPException
from fastapi import UploadFile
from sqlalchemy.orm import Session

from products.helpers import _save_product_image

from .models import Product
from .schemas import ProductCreate, ProductUpdate


def get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def create_product(
    db: Session, payload: ProductCreate, image: UploadFile | None = None
) -> Product:
    image_path = payload.image_path
    if image is not None:
        image_path = _save_product_image(image)

    product = Product(
        name=payload.name,
        price=payload.price,
        image_path=image_path,
        category_id=payload.category_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product(db: Session, product_id: int) -> Product:
    return get_product_or_404(db, product_id)


def get_products_list(db: Session, category_id: int | None = None) -> list[Product]:
    q = db.query(Product)
    if category_id is None:
        return q.all()
    if category_id == 0:
        return q.filter(Product.category_id.is_(None)).all()
    return q.filter(Product.category_id == category_id).all()


def update_product(
    db: Session,
    product_id: int,
    payload: ProductUpdate,
    image: UploadFile | None = None,
) -> Product:
    product = get_product_or_404(db, product_id)

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(product, key, value)

    if image is not None:
        product.image_path = _save_product_image(image)

    db.commit()
    db.refresh(product)
    return product
