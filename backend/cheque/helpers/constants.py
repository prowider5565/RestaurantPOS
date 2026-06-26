CUT_PAPER = b"\x1d\x56\x00"
LINE_FEEDS_AFTER_PRINT = 8
PRINTER_INIT = b"\x1b@"
DISABLE_MULTIBYTE_MODE = b"\x1c\x2e"

# ESC/POS code page 17 is commonly CP866 on thermal printers.
ESC_POS_CODEPAGE_SEQUENCE = b"\x1b\x74\x11"
TEXT_ENCODING = "cp866"

# Cash drawer open command (pin 2)
OPEN_DRAWER = b"\x1b\x70\x00\x19\xfa"
