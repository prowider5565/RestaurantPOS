from sqlalchemy import Column, DateTime, Integer, ForeignKey, func, Enum, String
from sqlalchemy.orm import relationship

from cash_desk.types import TransactionType
from config.database import Base


class CashDesk(Base):
    __tablename__ = "cash_desk"

    id = Column(Integer, primary_key=True, index=True)

    amount = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    transaction_type = Column(Enum(TransactionType), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())

    user = relationship("User", back_populates="cash_desk")
