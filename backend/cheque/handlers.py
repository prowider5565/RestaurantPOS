from fastapi import APIRouter, HTTPException

from cheque.schemas import PrintPayload
from cheque.helpers import print_with_detected_printer

router = APIRouter(prefix="/cheque", tags=["printer"])


@router.post("/print")
def print_api(payload: PrintPayload):

    # try:
    print_with_detected_printer(content=payload.content, cut=payload.cut)

    # except RuntimeError as e:
    #     raise HTTPException(status_code=500, detail=str(e))

    # except Exception:
    #     raise HTTPException(status_code=500, detail="Printing failed")

    return {"message": "Printed successfully"}
