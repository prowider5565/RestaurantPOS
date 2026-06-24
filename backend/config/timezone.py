from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


try:
    TASHKENT_TIMEZONE = ZoneInfo("Asia/Tashkent")
except ZoneInfoNotFoundError:
    TASHKENT_TIMEZONE = timezone(timedelta(hours=5))


def now_tashkent() -> datetime:
    return datetime.now(TASHKENT_TIMEZONE).replace(tzinfo=None)
