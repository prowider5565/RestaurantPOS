from fastapi import APIRouter, Response

from cheque.helpers.printer import generate_cheque_content, open_drawer, print_cheque
from cheque.schemas import PrintChequeRequest

router = APIRouter(prefix="/cheque", tags=["printer"])

@router.post("/print")
async def print_cheque_handler(payload: PrintChequeRequest):
    content = generate_cheque_content(
        order_data=payload.order_data,
        program_name=payload.program_name,
    )
    print(content)
    print_cheque(content)
    return Response(status_code=204)

@router.post("/open-drawer")
async def open_drawer_handler():
    open_drawer()
    return Response(status_code=204)
