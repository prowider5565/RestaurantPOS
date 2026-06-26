from fastapi import APIRouter, Response

from cheque.helpers.printer import open_drawer

router = APIRouter(prefix="/cheque", tags=["printer"])

@router.post("/open-drawer")
async def open_drawer_handler():
    open_drawer()
    return Response(status_code=204)
