from fastapi import APIRouter, Depends, Response

from users.dependencies import get_current_user
from users.models import User
from cheque.schemas import RequisiteSchema
from cheque.helpers import get_requisite_data, print_cheque

router = APIRouter(prefix="/cheque", tags=["printer"])

@router.post("/print")
async def print_cheque_handler(content: str):
    print_cheque(content)
    return Response(status_code=204)

@router.get("/requisites", response_model=RequisiteSchema)
async def get_requisites():
    return get_requisite_data()
