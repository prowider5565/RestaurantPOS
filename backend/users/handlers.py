from fastapi import APIRouter, Response, HTTPException

from users.helpers import create_access_token

router = APIRouter()


@router.post("/login")
def login(response: Response, username: str, password: str):

    user = authenticate_user(username, password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=3600,
    )

    return {"message": "Logged in"}
