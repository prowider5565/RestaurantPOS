from sqlalchemy import Column, Enum, Float, ForeignKey, Integer, String

from config.database import Base
from orders.types import OrderStatus


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(6), unique=True, index=True)
    total_price = Column(Float, default=0.0)
    status = Column(Enum(OrderStatus, name="order_status"), default=OrderStatus.PENDING, nullable=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
