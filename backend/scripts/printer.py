import win32print

CUT_PAPER = b"\x1d\x56\x00"
LINE_FEEDS_AFTER_PRINT = 8
PRINTER_INIT = b"\x1b@"
DISABLE_MULTIBYTE_MODE = b"\x1c\x2e"
ESC_POS_CODEPAGE_SEQUENCE = b"\x1b\x74\x11"
TEXT_ENCODING = "cp866"


def print_cheque(text=None):
    printer = win32print.GetDefaultPrinter()
    h = win32print.OpenPrinter(printer)

    try:
        win32print.StartDocPrinter(h, 1, ("Test", None, "RAW"))
        win32print.StartPagePrinter(h)

        receipt_text = str(text or "")
        payload = (
            PRINTER_INIT
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


print_cheque("Hello, this is a test cheque.\nThank you for your business!")
