from sqlalchemy import Column, DateTime, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship

from cash_desk.types import TransactionType
from config.database import Base
from config.timezone import now_tashkent


class CashDesk(Base):
    __tablename__ = "cash_desk"

    id = Column(Integer, primary_key=True, index=True)

    amount = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    transaction_type = Column(Enum(TransactionType), nullable=False)
    created_at = Column(DateTime, nullable=False, default=now_tashkent)

    user = relationship("User", back_populates="cash_desk")
