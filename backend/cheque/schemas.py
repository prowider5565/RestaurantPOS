from pydantic import BaseModel, Field


class PrintPayload(BaseModel):
    content: str = Field(min_length=1)
    cut: bool = True


class RequisiteSchema(BaseModel):
    company_name: str
    stir: int
    registry_number: int
    phone_number: str
    address: str
