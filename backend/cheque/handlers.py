from fastapi import APIRouter

from cheque.schemas import PrintPayload, RequisiteSchema
from cheque.helpers import get_requisite_data, print_with_detected_printer

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


@router.get("/requisites", response_model=RequisiteSchema)
async def get_requisites():
    return get_requisite_data()
