from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from users.dependencies import get_current_user
from users.helpers import (
    authenticate_user,
    create_access_token,
    hash_password,
)
from users.models import User
from users.schemas import (
    AdminCredentialsUpdateIn,
    AdminCreateUserIn,
    LoginSchema,
    PasswordUpdateIn,
    UsernameUpdateIn,
)


router = APIRouter()


@router.post("/login")
def login(login_payload: LoginSchema):
    user = authenticate_user(login_payload.username, login_payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout")
def logout():
    return {"message": "Logged out"}


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "position": current_user.position,
        "is_admin": current_user.is_admin,
    }


@router.put("/update-password")
def update_password(
    payload: PasswordUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=401)

    user.password = hash_password(payload.password)
    db.commit()
    return {"message": "Password updated"}


@router.put("/update-username")
def update_username(
    payload: UsernameUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    exists = (
        db.query(User)
        .filter(User.username == username, User.id != current_user.id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=401)

    user.username = username
    db.commit()
    return {"message": "Username updated"}


@router.put("/update-password/{user_id}")
def admin_update_password(
    user_id: int,
    payload: PasswordUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privilege required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = hash_password(payload.password)
    db.commit()
    return {"message": "Password updated"}


@router.get("/admin/get-user-list")
async def admin_list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privilege required")

    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "position": u.position,
            "is_admin": u.is_admin,
            "is_active": u.is_active,
        }
        for u in users
    ]


@router.post("/admin/create-user")
def admin_create_user(
    payload: AdminCreateUserIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privilege required")

    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    exists = db.query(User).filter(User.username == username).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=username,
        position=payload.position,
        password=hash_password(payload.password),
        is_admin=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "username": user.username,
        "position": user.position,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
    }


@router.put("/admin/update-user/{user_id}")
def admin_update_user_credentials(
    user_id: int,
    payload: AdminCredentialsUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privilege required")

    if payload.username is None and payload.password is None:
        raise HTTPException(status_code=400, detail="Nothing to update")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.username is not None:
        username = payload.username.strip()
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        exists = (
            db.query(User).filter(User.username == username, User.id != user_id).first()
        )
        if exists:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = username

    if payload.password is not None:
        user.password = hash_password(payload.password)

    db.commit()
    return {"message": "User updated"}


@router.put("/admin/deactivate-user/{user_id}")
def admin_deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privilege required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()
    return {"message": "User deactivated"}


@router.put("/admin/activate-user/{user_id}")
def admin_activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privilege required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    db.commit()
    return {"message": "User activated"}
