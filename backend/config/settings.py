from __future__ import annotations

import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


def _backend_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def _expand_vars(value: str) -> str:
    pattern = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")

    def repl(match: re.Match[str]) -> str:
        return os.getenv(match.group(1), "")

    return pattern.sub(repl, value)


def _manual_load_dotenv(
    dotenv_path: Path, *, initial_keys: set[str], loaded_keys: set[str]
) -> None:
    if not dotenv_path.exists():
        return

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if value.startswith('"') and value.endswith('"') and len(value) >= 2:
            value = value[1:-1]
        if value.startswith("'") and value.endswith("'") and len(value) >= 2:
            value = value[1:-1]

        value = _expand_vars(value)

        if not key:
            continue

        # Do not override real environment variables, but allow env-specific files
        # to override values previously loaded from another .env file in this run.
        if key in initial_keys and key not in loaded_keys:
            continue

        os.environ[key] = value
        loaded_keys.add(key)


def _load_env_files(app_env: str) -> None:
    env = (app_env or "dev").lower()
    backend_dir = _backend_dir()

    initial_keys = set(os.environ.keys())
    loaded_keys: set[str] = set()

    _manual_load_dotenv(
        backend_dir / ".env", initial_keys=initial_keys, loaded_keys=loaded_keys
    )
    if env in {"prod", "production"}:
        _manual_load_dotenv(
            backend_dir / ".env.prod",
            initial_keys=initial_keys,
            loaded_keys=loaded_keys,
        )
    else:
        _manual_load_dotenv(
            backend_dir / ".env.dev", initial_keys=initial_keys, loaded_keys=loaded_keys
        )


def _normalize_database_url(value: str | None) -> str:
    v = (value or "").strip()
    if not v:
        return "sqlite:///./sql_app.db"
    if "://" in v:
        return v
    return f"sqlite:///{v}"


@dataclass(frozen=True)
class Settings:
    database_url: str
    media_storage_path: str
    cors_allowed_origins: list[str]


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
        cors_allowed_origins=(
            os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
            if os.getenv("CORS_ALLOWED_ORIGINS")
            else []
        ),
    )


settings = get_settings()
