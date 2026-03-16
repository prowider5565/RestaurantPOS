from datetime import datetime
import usb.core
from escpos.printer import Usb

from config.settings import settings


def generate_receipt(order_data: dict) -> str:
    """
    Generate receipt content from order data.
    order_data should contain:
    - id: order id
    - total_price: total amount
    - created_at: creation timestamp
    - items: list of order items with product details
    """
    lines = []

    # Header
    lines.append("=" * 32)
    lines.append("RESTAURANT POS RECEIPT".center(32))
    lines.append("=" * 32)

    # Order info
    order_id = order_data.get("id", "N/A")
    lines.append(f"Order ID: {order_id}")

    # Date and time
    created_at = order_data.get("created_at", "")
    if created_at:
        try:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            lines.append(f"Date: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
        except:
            lines.append(f"Date: {created_at}")

    lines.append("-" * 32)

    # Items section
    lines.append("ITEMS:")
    items = order_data.get("items", [])

    for item in items:
        product = item.get("product", {})
        qty = item.get("quantity", 0)
        price = product.get("price", 0)
        name = product.get("name", "Unknown")
        item_total = qty * price

        # Format: Name Qty x Price = Total
        name_short = name[:20] if len(name) > 20 else name
        lines.append(f"{name_short}")
        lines.append(f"  {qty}x {price:,.0f} = {item_total:,.0f}")

    lines.append("-" * 32)

    # Total
    total = order_data.get("total_price", 0)
    lines.append("TOTAL".ljust(20) + f"{total:,.0f} so'm")

    lines.append("=" * 32)
    lines.append("Thank you for your order!".center(32))
    lines.append("=" * 32)

    return "\n".join(lines)


def detect_usb_printer():
    """
    Detect the first USB ESC/POS compatible printer.
    Returns a configured escpos printer object.
    """

    devices = usb.core.find(find_all=True)

    for device in devices:
        vendor_id = device.idVendor
        product_id = device.idProduct

        try:
            printer = Usb(vendor_id, product_id)
            return printer
        except Exception:
            # Skip devices that are not ESC/POS printers
            continue

    raise RuntimeError("No compatible USB printer detected")


def print_with_detected_printer(content: str, cut: bool = True):
    """
    Detect printer and print content.
    """

    printer = detect_usb_printer()

    try:
        text = content.strip() + "\n"
        printer.text(text)

        if cut:
            printer.cut()

    finally:
        try:
            printer.close()
        except Exception:
            pass


def get_requisite_data():
    """
    Return static requisite data for the restaurant.
    In a real application, this could be fetched from a database or config file.
    """
    return {
        "company_name": settings.COMPANY_NAME,
        "address": settings.ADDRESS,
        "phone_number": settings.PHONE_NUMBER,
        "stir": settings.STIR,
        "registry_number": settings.REGISTRY_NUMBER,
    }
