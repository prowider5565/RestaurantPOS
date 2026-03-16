from pydantic import BaseModel


class RequisiteSchema(BaseModel):
    company_name: str
    stir: int
    registry_number: int
    phone_number: str
    address: str
