from __future__ import annotations

import re
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
if sys.path and Path(sys.path[0]).resolve() == SCRIPTS_DIR:
    sys.path.pop(0)

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from config.database import SessionLocal
from products.models import Product, ProductCategory


CYRILLIC_PATTERN = re.compile(r"[\u0400-\u04FF]")

TRANSLITERATION_MAP = {
    "\u0410": "A",
    "\u0430": "a",
    "\u0411": "B",
    "\u0431": "b",
    "\u0412": "V",
    "\u0432": "v",
    "\u0413": "G",
    "\u0433": "g",
    "\u0492": "G'",
    "\u0493": "g'",
    "\u0414": "D",
    "\u0434": "d",
    "\u0415": "E",
    "\u0435": "e",
    "\u0401": "Yo",
    "\u0451": "yo",
    "\u0416": "J",
    "\u0436": "j",
    "\u0417": "Z",
    "\u0437": "z",
    "\u0418": "I",
    "\u0438": "i",
    "\u0419": "Y",
    "\u0439": "y",
    "\u041a": "K",
    "\u043a": "k",
    "\u049a": "Q",
    "\u049b": "q",
    "\u041b": "L",
    "\u043b": "l",
    "\u041c": "M",
    "\u043c": "m",
    "\u041d": "N",
    "\u043d": "n",
    "\u041e": "O",
    "\u043e": "o",
    "\u041f": "P",
    "\u043f": "p",
    "\u0420": "R",
    "\u0440": "r",
    "\u0421": "S",
    "\u0441": "s",
    "\u0422": "T",
    "\u0442": "t",
    "\u0423": "U",
    "\u0443": "u",
    "\u040e": "O'",
    "\u045e": "o'",
    "\u0424": "F",
    "\u0444": "f",
    "\u0425": "X",
    "\u0445": "x",
    "\u04b2": "H",
    "\u04b3": "h",
    "\u0426": "Ts",
    "\u0446": "ts",
    "\u0427": "Ch",
    "\u0447": "ch",
    "\u0428": "Sh",
    "\u0448": "sh",
    "\u0429": "Sh",
    "\u0449": "sh",
    "\u042a": "'",
    "\u044a": "'",
    "\u042b": "I",
    "\u044b": "i",
    "\u042c": "",
    "\u044c": "",
    "\u042d": "E",
    "\u044d": "e",
    "\u042e": "Yu",
    "\u044e": "yu",
    "\u042f": "Ya",
    "\u044f": "ya",
}


def transliterate_text(value: str) -> str:
    return "".join(TRANSLITERATION_MAP.get(char, char) for char in value)


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def to_latin(value: str | None) -> str | None:
    if value is None:
        return None
    if not CYRILLIC_PATTERN.search(value):
        return value
    return normalize_spaces(transliterate_text(value))


def update_names() -> None:
    db = SessionLocal()
    try:
        category_updates = 0
        product_updates = 0

        categories = db.query(ProductCategory).order_by(ProductCategory.id.asc()).all()
        for category in categories:
            current_name = category.name or ""
            next_name = to_latin(current_name)
            if not next_name or next_name == current_name:
                continue

            print(f"Category #{category.id}: {current_name} -> {next_name}")
            category.name = next_name
            category_updates += 1

        products = db.query(Product).order_by(Product.id.asc()).all()
        for product in products:
            current_name = product.name or ""
            next_name = to_latin(current_name)
            if not next_name or next_name == current_name:
                continue

            print(f"Product #{product.id}: {current_name} -> {next_name}")
            product.name = next_name
            product_updates += 1

        db.commit()
        print(
            f"Done. Updated categories: {category_updates}, "
            f"updated products: {product_updates}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    update_names()
