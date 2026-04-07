from __future__ import annotations

from datetime import datetime
from typing import Any


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
    order_data: dict[str, Any],
    requisites: dict[str, Any] | None = None,
    program_name: str = "Restoran Cheki",
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

    requisites = requisites or {}
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

    def build_plain_summary_line(label: str, value: str) -> str:
        combined = f"{label} {value}"
        if len(combined) <= table_width:
            return label.ljust(table_width - len(value)) + value
        return combined[:table_width].ljust(table_width)

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

    today = datetime.now().strftime("%d.%m.%Y")
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
    for item in items:
        product = item.get("product") or {}
        quantity = _to_number(item.get("quantity"), 0.0)
        price = _to_number(product.get("price"), 0.0)
        subtotal = quantity * price
        total_amount += subtotal

        name_lines = wrap_text(str(product.get("name") or ""), name_width)
        lines.append(
            build_row(
                [
                    str(product.get("id") or ""),
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
    waiter_fee_enabled = bool(order_data.get("waiter_fee"))
    waitress_wage = round(
        _to_number(
            order_data.get("waitress_wage"),
            (original_total * 0.1) if waiter_fee_enabled else 0.0,
        )
    )
    discount_amount = max(0.0, _to_number(order_data.get("discount_amount"), 0.0))
    final_total = max(0.0, original_total - discount_amount) + waitress_wage

    lines.append(strong_bottom_separator())
    if waiter_fee_enabled:
        lines.append(
            build_plain_summary_line(
                "Ofitsiant xizmati:", f"{format_number_plain(waitress_wage)} so'm"
            )
        )
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

    company_name = str(requisites.get("company_name") or "").strip()
    address = str(requisites.get("address") or "").strip()
    phone = str(requisites.get("phone_number") or "").strip()
    stir = str(requisites.get("STIR") or requisites.get("stir") or "").strip()
    registry = str(requisites.get("registry_number") or "").strip()

    if company_name:
        for line in wrap_text(company_name, table_width):
            lines.append(line.rjust(table_width))

    push_right("STIR:", stir)
    push_right("Telefon:", phone)
    push_right("Reestr Raqami:", registry)

    if address:
        for line in wrap_text(address, table_width):
            lines.append(line)

    lines.append("")
    lines.append("")
    lines.append(center_text("Tashrifingizdan mamnunmiz!", table_width))

    return "\n".join(lines)


if __name__ == "__main__":

    program_name = "Parhez Plyus"

    requisites = {
        "company_name": "PARHEZ PLYUS MCHJ",
        "address": "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 12",
        "phone_number": "+998 90 123 45 67",
        "STIR": "309876543",
        "registry_number": "AA-456789",
    }

    order_data = {
        "id": 1024,
        "total_price": 128000,
        "waitress_wage": 12800,
        "discount_amount": 10000,
        "created_at": "2026-03-19T14:35:22",
        "user": {
            "id": 7,
            "username": "Dilshod",
            "position": "Kassir",
        },
        "order_table": {
            "id": 3,
            "table_number": 12,
            "table_color": "#FFE5B4",
        },
        "items": [
            {
                "product": {"id": 11, "name": "Chicken Burger", "price": 32000},
                "quantity": 2,
            },
            {
                "product": {"id": 18, "name": "Coca Cola 1L", "price": 14000},
                "quantity": 1,
            },
            {
                "product": {"id": 25, "name": "Greek Salad", "price": 50000},
                "quantity": 1,
            },
        ],
    }

    receipt_text = generate_receipt(
        order_data, requisites=requisites, program_name=program_name
    )
    print(receipt_text)
