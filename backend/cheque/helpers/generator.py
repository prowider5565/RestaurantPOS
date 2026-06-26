from __future__ import annotations

from datetime import datetime
from typing import Any

from config.settings import settings
from config.timezone import now_tashkent


def wrap_text(text: str, max_width: int) -> list[str]:
    words = text.split(" ")
    lines: list[str] = []
    current_line = ""

    for word in words:
        if len(word) > max_width:
            if current_line:
                lines.append(current_line)
                current_line = ""
            for index in range(0, len(word), max_width):
                chunk = word[index : index + max_width]
                if len(chunk) == max_width or index + max_width < len(word):
                    lines.append(chunk)
                else:
                    current_line = chunk
            continue

        if len(current_line + word) <= max_width:
            current_line += ("" if not current_line else " ") + word
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return lines if lines else [""]


def center_text(text: str, width: int) -> str:
    padding = max(0, width - len(text))
    left_pad = padding // 2
    right_pad = padding - left_pad
    return (" " * left_pad) + text + (" " * right_pad)


def _to_number(value: Any, fallback: float = 0.0) -> float:
    try:
        if value is None:
            return fallback
        return float(value)
    except (TypeError, ValueError):
        return fallback


def generate_receipt(
    order_data: dict[str, Any], program_name: str = "Restoran Cheki"
) -> str:
    escpos_bold_on = "\x1bE\x01"
    escpos_bold_off = "\x1bE\x00"
    escpos_double_size_on = "\x1d!\x11"
    escpos_default_size = "\x1d!\x00"
    vertical = "\u2502"
    horizontal = "\u2500"
    strong_horizontal = "\u2550"
    table_width = 48
    id_width = 3
    name_width = 20
    qty_width = 4
    price_width = 8
    subtotal_width = 7

    program_name = (program_name or "").strip() or "Restoran Cheki"
    user = order_data.get("user") or {}
    items = order_data.get("items") or []

    lines: list[str] = []

    def build_row(cols: list[str]) -> str:
        return (
            vertical
            + cols[0].ljust(id_width)
            + vertical
            + cols[1].ljust(name_width)
            + vertical
            + cols[2].ljust(qty_width)
            + vertical
            + cols[3].ljust(price_width)
            + vertical
            + cols[4].ljust(subtotal_width)
            + vertical
        )

    def format_number_plain(n: float) -> str:
        return str(round(n))

    def top_separator() -> str:
        return "\u250c" + (horizontal * (table_width - 2)) + "\u2510"

    def separator() -> str:
        return "\u251c" + (horizontal * (table_width - 2)) + "\u2524"

    def strong_bottom_separator() -> str:
        return "\u255a" + (strong_horizontal * (table_width - 2)) + "\u255d"

    def table_separator() -> str:
        return (
            "\u251c"
            + (horizontal * id_width)
            + "\u253c"
            + (horizontal * name_width)
            + "\u253c"
            + (horizontal * qty_width)
            + "\u253c"
            + (horizontal * price_width)
            + "\u253c"
            + (horizontal * subtotal_width)
            + "\u2524"
        )

    def safe_line(text: str) -> str:
        return (
            text[:table_width] if len(text) > table_width else text.ljust(table_width)
        )

    def framed_line(text: str) -> str:
        return vertical + center_text(text, table_width - 2) + vertical

    def build_double_size_summary_line(label: str, value: str) -> str:
        effective_width = table_width // 2
        content_width = effective_width
        combined = f"{label} {value}"
        if len(combined) > content_width:
            return combined[:content_width]
        return label.ljust(content_width - len(value)) + value

    def push_right(label: str, value: str) -> None:
        if not value:
            return
        combined = f"{label} {value}"
        if len(combined) <= table_width:
            lines.append(label.ljust(table_width - len(value)) + value)
            return
        for line in wrap_text(combined, table_width):
            lines.append(line)

    today = now_tashkent().strftime("%d.%m.%Y")
    username = str(user.get("username") or "")
    position = str(user.get("position") or "-")
    payment_type = str(order_data.get("payment_type") or "-")

    lines.append(safe_line("Sana: ".ljust(table_width - len(today)) + today))
    lines.append(safe_line("Ism: ".ljust(table_width - len(username)) + username))
    lines.append(safe_line("Lavozimi: ".ljust(table_width - len(position)) + position))
    lines.append(
        safe_line("To'lov turi: ".ljust(table_width - len(payment_type)) + payment_type)
    )
    lines.append("")
    lines.append(top_separator())
    lines.append(framed_line(program_name))
    lines.append(separator())

    created_at = order_data.get("created_at")
    date_str = ""
    if isinstance(created_at, str):
        try:
            created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            date_str = created_dt.strftime("%d.%m.%Y, %H:%M")
        except ValueError:
            date_str = ""
    if date_str:
        lines.append(framed_line(date_str))
        lines.append(separator())

    lines.append(build_row(["ID", "Nomi", "Soni", "Narx", "Jami"]))
    lines.append(table_separator())

    total_amount = 0.0
    for idx, item in enumerate(items):
        quantity = item["quantity"]
        price = item["price"]
        subtotal = item["subtotal"]
        total_amount += subtotal

        name_lines = wrap_text(item["name"], name_width)
        lines.append(
            build_row(
                [
                    str(idx + 1),
                    name_lines[0],
                    str(int(round(quantity))),
                    format_number_plain(price),
                    format_number_plain(subtotal),
                ]
            )
        )
        for name_line in name_lines[1:]:
            lines.append(build_row(["", name_line, "", "", ""]))

    original_total = round(_to_number(order_data.get("total_price"), total_amount))
    discount_amount = max(0.0, _to_number(order_data.get("discount_amount"), 0.0))
    final_total = max(0.0, original_total - discount_amount)

    lines.append(strong_bottom_separator())
    lines.append(
        escpos_bold_on
        + escpos_double_size_on
        + build_double_size_summary_line(
            "Jami:", f"{format_number_plain(final_total)} so'm"
        )
        + escpos_default_size
        + escpos_bold_off
    )
    lines.append("")
    push_right("STIR:", settings.STIR)
    push_right("Telefon:", settings.PHONE_NUMBER)
    push_right("Reestr Raqami:", settings.REGISTRY_NUMBER)
    if settings.ADDRESS:
        for line in wrap_text(settings.ADDRESS, table_width):
            lines.append(line)

    lines.append("")
    lines.append("")
    lines.append(center_text("Tashrifingizdan mamnunmiz!", table_width))

    return "\n".join(lines)
