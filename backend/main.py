from pathlib import Path
import multiprocessing
import sys

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi_pagination import add_pagination

from misc.startup import lifespan
from config.database import Base, engine
from config.settings import settings
from cash_desk.router import router as cash_desk_router
from orders.router import router as orders_router
from products.categories_router import router as product_categories_router
from products.router import router as products_router
from users.handlers import router as users_router

from cash_desk.models import CashDesk  # noqa: F401
from orders.models import Order, OrderItem  # noqa: F401
from products.models import Product, ProductCategory  # noqa: F401
from users.models import User  # noqa: F401


app = FastAPI(lifespan=lifespan)
MEDIA_ROOT = Path(settings.media_storage_path).resolve()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(product_categories_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(cash_desk_router)

if sys.platform == "win32":
    from cheque.handlers import router as printer_router

    app.include_router(printer_router)
add_pagination(app)


@app.get("/media/{path:path}")
def get_media(path: str):
    target = (MEDIA_ROOT / path).resolve()
    try:
        target.relative_to(MEDIA_ROOT)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid media path") from exc

    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Media not found")

    return FileResponse(str(target))


@app.get("/")
def read_root():
    return {"Hello": "World"}


if __name__ == "__main__":
    multiprocessing.freeze_support()

    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
