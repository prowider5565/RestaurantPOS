from __future__ import annotations

import requests
from fastapi import HTTPException

from config.settings import settings

from .schemas import OrderCreate
from .schemas import OrderTableCreate


def sync_order_to_supervisor(payload: OrderCreate) -> None:
    supervisor_url = settings.SUPERVISOR_URL.strip()
    if not supervisor_url:
        print("Supervisor URL is not configured. Skipping order synchronization.")
        return

    try:
        response = requests.post(
            f"{supervisor_url}/orders",
            json=payload.model_dump(mode="json"),
            timeout=30,
        )
        # response.raise_for_status()
        print("Status code:", response.status_code)
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to synchronize order with supervisor",
        ) from exc


def sync_order_table_to_supervisor(payload: OrderTableCreate) -> None:
    supervisor_url = settings.SUPERVISOR_URL.strip()
    if not supervisor_url:
        return

    try:
        response = requests.post(
            f"{supervisor_url}/orders/tables",
            json=payload.model_dump(mode="json"),
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to synchronize order table with supervisor",
        ) from exc
