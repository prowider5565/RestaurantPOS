from __future__ import annotations

from pydantic import BaseModel, Field


class LoginSchema(BaseModel):
    username: str
    password: str


class PasswordUpdateIn(BaseModel):
    password: str = Field(min_length=1, max_length=255)


class UsernameUpdateIn(BaseModel):
    username: str = Field(min_length=1, max_length=120)


class AdminCredentialsUpdateIn(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=120)
    password: str | None = Field(default=None, min_length=1, max_length=255)
