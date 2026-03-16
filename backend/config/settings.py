from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from .helpers import _load_env_files, _backend_dir, _normalize_database_url


@dataclass(frozen=True)
class Settings:
    database_url: str
    media_storage_path: str
    cors_allowed_origins: list[str]
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_DAYS: int

    COMPANY_NAME: str
    STIR: int
    REGISTRY_NUMBER: int
    PHONE_NUMBER: str
    ADDRESS: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    app_env = os.getenv("APP_ENV", "dev")
    _load_env_files(app_env)

    media_storage_path = (
        os.getenv("MEDIA_STORAGE_PATH") or os.getenv("FILE_STORAGE_PATH") or "./"
    )
    media_dir = Path(media_storage_path)
    if not media_dir.is_absolute():
        media_dir = (_backend_dir() / media_dir).resolve()
    media_dir.mkdir(parents=True, exist_ok=True)

    return Settings(
        database_url=_normalize_database_url(os.getenv("DATABASE_URL")),
        media_storage_path=str(media_dir),
        SECRET_KEY=os.getenv("SECRET_KEY"),
        ALGORITHM=os.getenv("ALGORITHM"),
        ACCESS_TOKEN_EXPIRE_DAYS=int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", 30)),
        COMPANY_NAME=os.getenv("COMPANY_NAME"),
        STIR=int(os.getenv("STIR")),
        REGISTRY_NUMBER=int(os.getenv("REGISTRY_NUMBER")),
        PHONE_NUMBER=os.getenv("PHONE_NUMBER"),
        ADDRESS=os.getenv("ADDRESS"),
        cors_allowed_origins=(
            os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
            if os.getenv("CORS_ALLOWED_ORIGINS")
            else []
        ),
    )


settings = get_settings()
