from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from config.database import Base
from orders.types import OrderStatus


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
    user_id = Column(Integer, ForeignKey("users.id"))
    items = relationship(
        "OrderItem",
        back_populates="order",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    user = relationship("User", back_populates="orders")



class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
