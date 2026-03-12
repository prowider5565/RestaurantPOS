from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from products.types import ProductMeasure
from config.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    image_path = Column(String, index=True)
    price = Column(Float, index=True)
    category_id = Column(
        Integer,
        ForeignKey("product_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    measure = Column(ProductMeasure, index=True, nullable=True)
    category = relationship("ProductCategory", back_populates="products")


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    products = relationship("Product", back_populates="category")
