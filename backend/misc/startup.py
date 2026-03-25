from fastapi import FastAPI
from contextlib import asynccontextmanager

from config.database import Base, SessionLocal, engine
from misc.notiifcation import show_startup_notification
from users.helpers import hash_password
from users.models import User


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    show_startup_notification()
    db = SessionLocal()

    try:
        admin = db.query(User).filter(User.is_admin == True).first()

        if not admin:
            default_admin = User(
                username="admin",
                password=hash_password("123123123"),
                is_admin=True,
                is_active=True,
                position="Administrator",
            )

            db.add(default_admin)
            db.commit()

    finally:
        db.close()

    yield
