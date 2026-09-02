"""Verified English/general email & invoice -> JSON pairs.

Mirrors the Roman Urdu few-shot pattern (roman_urdu_examples.py) but for the
default (non-Roman-Urdu) path, which previously had zero examples and was
missing customer fields / dropping order_items on multi-item, formally
structured text (e.g. "Bill To: / Ship To: / Items:" style PDF invoices).
Kept compact for the same reason as the Roman Urdu list: every token here is
paid for on each CPU inference. Grow from real AuditLog corrections over time.
"""

GENERAL_FEW_SHOT_EXAMPLES: list[tuple[str, str]] = [
    (
        "INVOICE #5521\n"
        "Bill To: Sarah Chen (sarah.chen@brightleaf.com)\n"
        "Ship To: 210 Maple Ave, Austin, TX 78701\n"
        "Items:\n"
        "3 x Office Chair (Model OC-9) @ $85.00 each\n"
        "6 x Desk Lamp (LED) @ $22.00 each\n"
        "2 x Filing Cabinet @ $150.00 each\n"
        "Total Amount Due: $687.00",
        '{"customer_name": "Sarah Chen", "customer_email": "sarah.chen@brightleaf.com", '
        '"order_items": [{"description": "Office Chair (Model OC-9)", "quantity": 3, "unit_price": 85}, '
        '{"description": "Desk Lamp (LED)", "quantity": 6, "unit_price": 22}, '
        '{"description": "Filing Cabinet", "quantity": 2, "unit_price": 150}], '
        '"total_amount": 687, "shipping_address": "210 Maple Ave, Austin, TX 78701"}',
    ),
    (
        "Hi, I'd like to order 2 blue notebooks and 5 black pens for our office. "
        "Please deliver to 14 Oak Street, Manchester. My email is james.miller@northgate.co.uk. "
        "Thanks, James",
        '{"customer_name": "James Miller", "customer_email": "james.miller@northgate.co.uk", '
        '"order_items": [{"description": "Blue notebook", "quantity": 2, "unit_price": null}, '
        '{"description": "Black pen", "quantity": 5, "unit_price": null}], '
        '"total_amount": null, "shipping_address": "14 Oak Street, Manchester"}',
    ),
]
