from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from config.database import Base
from orders.types import OrderStatus
from products.models import Product  # noqa: F401


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    total_price = Column(Float, default=0.0)
    # status = Column(
    #     Enum(OrderStatus, name="order_status"),
    #     default=OrderStatus.PENDING,
    #     nullable=False,
    # )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    discount_amount = Column(Integer, nullable=True, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))
    order_table_id = Column(Integer, ForeignKey("order_tables.id"), nullable=False, index=True)
    items = relationship(
        "OrderItem",
        back_populates="order",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    user = relationship("User", back_populates="orders", lazy="selectin")
    order_table = relationship("OrderTable", back_populates="orders", lazy="selectin")

    @property
    def waitress_wage(self) -> float:
        return float(self.total_price or 0.0) * 0.1


class OrderTable(Base):
    __tablename__ = "order_tables"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(Integer, nullable=False, unique=True, index=True)
    table_color = Column(String(50), nullable=False)

    orders = relationship("Order", back_populates="order_table")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
