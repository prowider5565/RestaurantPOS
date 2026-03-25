from __future__ import annotations

import inspect
from functools import wraps

from fastapi import HTTPException, Query

from users.helpers import verify_password


def require_delete_password(func):
    signature = inspect.signature(func)
    parameters = list(signature.parameters.values())

    if "password" not in signature.parameters:
        parameters.append(
            inspect.Parameter(
                "password",
                kind=inspect.Parameter.KEYWORD_ONLY,
                default=Query(..., min_length=1),
                annotation=str,
            )
        )

    @wraps(func)
    async def wrapper(*args, **kwargs):
        current_user = kwargs.get("current_user")
        password = kwargs.pop("password", None)

        if current_user is None:
            raise HTTPException(status_code=500, detail="Current user is required")

        if not password or not verify_password(password, current_user.password):
            raise HTTPException(status_code=403, detail="Invalid password")

        result = func(*args, **kwargs)
        if inspect.isawaitable(result):
            return await result
        return result

    wrapper.__signature__ = signature.replace(parameters=parameters)
    return wrapper
