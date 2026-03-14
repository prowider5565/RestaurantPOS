import usb.core
from escpos.printer import Usb


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