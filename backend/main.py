from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config.database import Base, engine
from config.settings import settings
from products.models import Product, ProductCategory  # noqa: F401
from products.router import router as products_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=settings.media_storage_path), name="media")


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(products_router)


@app.get("/")
def read_root():
    return {"Hello": "World"}
