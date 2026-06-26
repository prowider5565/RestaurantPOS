import win32print
from .constants import *


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


def open_drawer():
    printer = win32print.GetDefaultPrinter()
    h = win32print.OpenPrinter(printer)

    try:
        win32print.StartDocPrinter(h, 1, ("Open Drawer", None, "RAW"))
        win32print.StartPagePrinter(h)
        win32print.WritePrinter(h, PRINTER_INIT + OPEN_DRAWER)
        win32print.EndPagePrinter(h)
        win32print.EndDocPrinter(h)
    finally:
        win32print.ClosePrinter(h)
