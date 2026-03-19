import win32print
from config.settings import settings
from scripts.generator import generate_receipt


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


def print_cheque(text=None):
    printer = win32print.GetDefaultPrinter()
    h = win32print.OpenPrinter(printer)

    try:
        win32print.StartDocPrinter(h, 1, ("Test", None, "RAW"))
        win32print.StartPagePrinter(h)

        data = f"{text}\n\n\n\n\n\n\n\n\x1D\x56\x00"
        win32print.WritePrinter(h, bytes(data, "utf-8"))

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

