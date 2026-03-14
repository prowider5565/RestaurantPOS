from sqlalchemy import Boolean, Column, Integer, String

from config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    position = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    password = Column(String, nullable=False)
 