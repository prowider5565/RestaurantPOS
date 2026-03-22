from fastapi import APIRouter, Response

from cheque.helpers import generate_cheque_content, get_requisite_data, print_cheque
from cheque.schemas import PrintChequeRequest, RequisiteSchema

router = APIRouter(prefix="/cheque", tags=["printer"])

@router.post("/print")
async def print_cheque_handler(payload: PrintChequeRequest):
    content = generate_cheque_content(
        order_data=payload.order_data,
        program_name=payload.program_name,
    )
    print_cheque(content)
    return Response(status_code=204)

