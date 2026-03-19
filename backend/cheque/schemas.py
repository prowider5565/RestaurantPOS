from typing import Any

from pydantic import BaseModel, Field


class RequisiteSchema(BaseModel):
    company_name: str
    stir: int
    registry_number: int
    phone_number: str
    address: str


class PrintChequeRequest(BaseModel):
    order_data: dict[str, Any] = Field(default_factory=dict)
    program_name: str = "Restoran Cheki"
