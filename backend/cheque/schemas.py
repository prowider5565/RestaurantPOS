from pydantic import BaseModel, Field


class PrintPayload(BaseModel):
    content: str = Field(min_length=1)
    cut: bool = True
