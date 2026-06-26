from __future__ import annotations

from datetime import datetime, timedelta

import bcrypt
from fastapi.exceptions import HTTPException
from jose import JWTError, jwt

from config.database import SessionLocal
from config.settings import settings
from users.models import User


def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
        return str(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(status_code=401, detail="Invalid token")

    return parts[1].strip()


def get_user_by_id(user_id: int | str) -> User | None:
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        return None

    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == uid).first()
    finally:
        db.close()


def hash_password(password: str) -> str:
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False



def authenticate_user(username: str, password: str) -> User | None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not bool(getattr(user, "is_active", True)):
            return None
        if not verify_password(password, user.password):
            return None
        return get_user_by_id(user.id)
    finally:
        db.close()



