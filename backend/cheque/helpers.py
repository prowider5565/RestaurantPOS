import win32print
from config.settings import settings
from scripts.generator import generate_receipt

CUT_PAPER = b"\x1d\x56\x00"
LINE_FEEDS_AFTER_PRINT = 8
PRINTER_INIT = b"\x1b@"
DISABLE_MULTIBYTE_MODE = b"\x1c\x2e"

# ESC/POS code page 17 is commonly CP866 on thermal printers.
ESC_POS_CODEPAGE_SEQUENCE = b"\x1b\x74\x11"
TEXT_ENCODING = "cp866"

# Cash drawer open command (pin 2)
OPEN_DRAWER = b"\x1b\x70\x00\x19\xfa"


def get_requisite_data():
    return {
        "company_name": settings.COMPANY_NAME,
        "address": settings.ADDRESS,
        "phone_number": settings.PHONE_NUMBER,
        "stir": settings.STIR,
        "registry_number": settings.REGISTRY_NUMBER,
    }


def print_cheque(text=None):
    printer = win32print.GetDefaultPrinter()
    h = win32print.OpenPrinter(printer)

    try:
        win32print.StartDocPrinter(h, 1, ("Test", None, "RAW"))
        win32print.StartPagePrinter(h)

        receipt_text = str(text or "")
        payload = (
            PRINTER_INIT
            + OPEN_DRAWER  # <-- added here
            + DISABLE_MULTIBYTE_MODE
            + ESC_POS_CODEPAGE_SEQUENCE
            + receipt_text.encode(TEXT_ENCODING, errors="replace")
            + (b"\n" * LINE_FEEDS_AFTER_PRINT)
            + CUT_PAPER
        )

        win32print.WritePrinter(h, payload)

        win32print.EndPagePrinter(h)
        win32print.EndDocPrinter(h)
    finally:
        win32print.ClosePrinter(h)


def generate_cheque_content(order_data: dict, program_name: str) -> str:
    requisites = get_requisite_data()
    return generate_receipt(
        order_data=order_data,
        requisites=requisites,
        program_name=program_name,
    )