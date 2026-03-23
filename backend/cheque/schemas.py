from typing import Any, Optional

from pydantic import BaseModel, Field


class RequisiteSchema(BaseModel):
    company_name: str
    stir: Optional[int] = None
    registry_number: Optional[int] = None
    phone_number: str
    address: str


class PrintChequeRequest(BaseModel):
    order_data: dict[str, Any] = Field(default_factory=dict)
    program_name: str = "Restoran Cheki"
