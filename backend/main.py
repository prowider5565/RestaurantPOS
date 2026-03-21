from pathlib import Path
import subprocess
import multiprocessing
import sys

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi_pagination import add_pagination
from sqlalchemy import inspect, text

from config.database import Base, engine
from config.settings import settings
from cash_desk.models import CashDesk  # noqa: F401
from cash_desk.router import router as cash_desk_router
from orders.models import Order, OrderItem, OrderTable  # noqa: F401
from orders.router import router as orders_router
from products.models import Product, ProductCategory  # noqa: F401
from products.categories_router import router as product_categories_router
from products.router import router as products_router
from users.handlers import router as users_router
from users.models import User  # noqa: F401
from config.database import SessionLocal
from users.helpers import hash_password


def sync_order_table_schema():
    inspector = inspect(engine)
    if not inspector.has_table("orders"):
        return

    columns = {column["name"] for column in inspector.get_columns("orders")}
    if "order_table_id" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE orders ADD COLUMN order_table_id INTEGER"))


def show_startup_notification() -> None:
    if sys.platform != "win32":
        return

    message = "Parhez Plyus Dasturi ishga tushdi!"
    powershell_script = rf"""
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml("<toast><visual><binding template='ToastText02'><text id='1'>Parhez Plyus</text><text id='2'>{message}</text></binding></visual></toast>")
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Parhez Plyus")
$notifier.Show($toast)
"""

    try:
        subprocess.Popen(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-WindowStyle",
                "Hidden",
                "-Command",
                powershell_script,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except OSError:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    sync_order_table_schema()
    show_startup_notification()
    db = SessionLocal()

    try:
        admin = db.query(User).filter(User.is_admin == True).first()

        if not admin:
            default_admin = User(
                username="admin",
                password=hash_password("123123123"),
                is_admin=True,
                is_active=True,
                position="Administrator",
            )

            db.add(default_admin)
            db.commit()

    finally:
        db.close()

    yield


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
