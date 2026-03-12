from pathlib import Path

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi_pagination import add_pagination

from config.database import Base, engine
from config.settings import settings
from orders.models import Order, OrderItem  # noqa: F401
from orders.router import router as orders_router
from products.models import Product, ProductCategory  # noqa: F401
from products.categories_router import router as product_categories_router
from products.router import router as products_router


app = FastAPI()
MEDIA_ROOT = Path(settings.media_storage_path).resolve()
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(products_router)
app.include_router(product_categories_router)
app.include_router(orders_router)
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
