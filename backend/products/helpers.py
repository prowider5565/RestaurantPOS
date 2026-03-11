import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from config.settings import settings


def _save_product_image(image: UploadFile) -> str:
    images_dir = Path(settings.media_storage_path) / "products"
    images_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(image.filename or "").suffix.lower()
    filename = f"{uuid4().hex}{suffix}"
    full_path = (images_dir / filename).resolve()

    with full_path.open("wb") as f:
        shutil.copyfileobj(image.file, f)

    return str(full_path)
