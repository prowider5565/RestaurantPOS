from __future__ import annotations

import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
if sys.path and Path(sys.path[0]).resolve() == SCRIPTS_DIR:
    sys.path.pop(0)

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from config.database import Base, SessionLocal, engine
from users.helpers import hash_password
from users.models import User
from orders.models import Order, OrderItem # noqa: F401


def seed_users() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        password_hash = hash_password("123123123")

        users: list[User] = [
            User(username="admin", is_admin=True, is_active=True, password=password_hash)
        ]
        users.extend(
            User(username=f"user{i}", is_admin=False, is_active=True, password=password_hash)
            for i in range(1, 16)
        )

        created = 0
        for u in users:
            exists = db.query(User).filter(User.username == u.username).first()
            if exists:
                continue
            db.add(u)
            created += 1

        db.commit()
        print(f"Seeded users. Created: {created}, Total desired: {len(users)}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
