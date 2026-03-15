from sqlalchemy import Boolean, Column, Integer, String, text
from sqlalchemy.orm import relationship

from config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    position = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, nullable=False, default=False, server_default=text("0"))
    password = Column(String, nullable=False)

    orders = relationship("Order", back_populates="user")
