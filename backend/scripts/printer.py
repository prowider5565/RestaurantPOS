import win32print


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


print_cheque("Hello, this is a test cheque.\nThank you for your business!")