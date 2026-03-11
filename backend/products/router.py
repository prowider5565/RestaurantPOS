from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from config.database import get_db

from .handlers import create_product, get_product, update_product
from .schemas import ProductCreate, ProductOut, ProductUpdate


router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductOut)
def create_product_api(
    name: str = Form(...),
    price: float = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
) -> ProductOut:
    payload = ProductCreate(name=name, price=price, image_path=None)
    return create_product(db, payload, image=image)


@router.get("/{product_id}", response_model=ProductOut)
def get_product_api(product_id: int, db: Session = Depends(get_db)) -> ProductOut:
    return get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductOut)
def update_product_api(
    product_id: int,
    name: str | None = Form(None),
    price: float | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
) -> ProductOut:
    data = {}
    if name is not None:
        data["name"] = name
    if price is not None:
        data["price"] = price
    payload = ProductUpdate(**data)
    return update_product(db, product_id, payload, image=image)
