from fastapi import Request
from fastapi.exceptions import HTTPException

from users.helpers import verify_token


def get_current_user(request: Request):

    token = get_token_from_cookie(request)

    user_id = verify_token(token)

    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=401)

    return user
