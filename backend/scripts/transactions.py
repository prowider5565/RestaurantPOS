from __future__ import annotations

from datetime import datetime
import os

import requests

from backend.cash_desk.models import CashDesk
from config.database import SessionLocal


API_URL = os.getenv("CASH_DESK_API_URL", "http://localhost:8000")
API_TOKEN = os.getenv("CASH_DESK_TOKEN", "")


MOCK_TRANSACTIONS = [
    {"amount": 15000, "transaction_type": "in", "created_at": "2026-01-02 05:00:00"},
    {"amount": 10000, "transaction_type": "out", "created_at": "2026-01-02 05:10:00"},
    {"amount": 32000, "transaction_type": "in", "created_at": "2026-01-15 11:20:00"},
    {"amount": 4500, "transaction_type": "out", "created_at": "2026-01-15 12:05:00"},
    {"amount": 28000, "transaction_type": "in", "created_at": "2026-02-03 09:30:00"},
    {"amount": 9000, "transaction_type": "out", "created_at": "2026-02-03 10:15:00"},
    {"amount": 12000, "transaction_type": "in", "created_at": "2026-02-20 16:40:00"},
    {"amount": 6700, "transaction_type": "out", "created_at": "2026-02-21 08:10:00"},
    {"amount": 22000, "transaction_type": "in", "created_at": "2026-03-10 13:25:00"},
    {"amount": 10704, "transaction_type": "out", "created_at": "2026-03-19 04:37:00"},
    {"amount": 15000, "transaction_type": "in", "created_at": "2026-03-19 04:43:00"},
]


def get_headers() -> dict[str, str]:
    if not API_TOKEN:
        raise RuntimeError("Set CASH_DESK_TOKEN before running this script.")

    return {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json",
    }


def create_transaction(amount: int, transaction_type: str) -> int:
    response = requests.post(
        f"{API_URL}/cash-desk/transactions",
        headers=get_headers(),
        json={
            "amount": amount,
            "transaction_type": transaction_type,
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    return int(payload["id"])


def update_created_at(transaction_id: int, created_at_raw: str) -> None:
    created_at = datetime.strptime(created_at_raw, "%Y-%m-%d %H:%M:%S")

    db = SessionLocal()
    try:
        row = db.query(CashDesk).filter(CashDesk.id == transaction_id).first()
        if not row:
            raise RuntimeError(f"Transaction {transaction_id} not found after create.")

        row.created_at = created_at
        db.add(row)
        db.commit()
    finally:
        db.close()


def main() -> None:
    for item in MOCK_TRANSACTIONS:
        transaction_id = create_transaction(
            amount=item["amount"],
            transaction_type=item["transaction_type"],
        )
        update_created_at(transaction_id, item["created_at"])
        print(
            f"Created transaction #{transaction_id}: "
            f"{item['transaction_type']} {item['amount']} at {item['created_at']}"
        )


if __name__ == "__main__":
    main()
