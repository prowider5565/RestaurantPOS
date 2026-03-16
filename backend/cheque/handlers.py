from fastapi import APIRouter

from cheque.schemas import RequisiteSchema
from cheque.helpers import get_requisite_data

router = APIRouter(prefix="/cheque", tags=["printer"])


@router.get("/requisites", response_model=RequisiteSchema)
async def get_requisites():
    return get_requisite_data()
