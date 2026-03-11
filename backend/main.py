from fastapi import FastAPI

from config.database import Base, engine
from products.models import Product, ProductCategory  # noqa: F401
from products.router import router as products_router

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(products_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}
