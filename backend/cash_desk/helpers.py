from __future__ import annotations

import requests
from fastapi import HTTPException

from config.settings import settings

from .schemas import CashDeskTransactionCreateIn


def sync_transaction_to_supervisor(
    payload: CashDeskTransactionCreateIn, token: str
) -> None:
    supervisor_url = settings.SUPERVISOR_URL.strip()
    if not supervisor_url:
        return

    try:
        response = requests.post(
            f"{supervisor_url}/transactions",
            json={**payload.model_dump(mode="json"), "token": token},
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to synchronize transaction with supervisor",
        ) from exc
