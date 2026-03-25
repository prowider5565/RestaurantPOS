from typing import Any

from pydantic import BaseModel, Field


class PrintChequeRequest(BaseModel):
    order_data: dict[str, Any] = Field(default_factory=dict)
    program_name: str = "Restoran Cheki"
