from fastapi.exceptions import HTTPException
from jose import JWTError, jwt
from datetime import datetime, timedelta

from config.settings import settings


def verify_token(token: str):

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401)

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )

    return encoded_jwt
