from fastapi import Request

from users.helpers import get_bearer_token, get_user_by_id, verify_token


def get_current_user(request: Request):

    token = get_bearer_token(request.headers.get("Authorization"))

    user_id = verify_token(token)

    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=401)

    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=401)

    return user
