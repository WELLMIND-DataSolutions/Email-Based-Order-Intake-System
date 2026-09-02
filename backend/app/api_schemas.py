"""API response/request shapes — mirror the dashboard's src/types/oms.ts.

Keeping these 1:1 with the frontend types means Phase 5 is only an api/client.ts
rewrite; no screen or type changes.
"""

import json
from typing import Optional

from pydantic import BaseModel

from app.db.models import AuditLog, Email, Order


class ClassificationOut(BaseModel):
    predicted_label: str
    confidence: float
    all_scores: dict[str, float] = {}


class OrderItemOut(BaseModel):
    description: str
    quantity: int
    unit_price: Optional[float] = None


class ExtractionOut(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_items: list[OrderItemOut] = []
    total_amount: Optional[float] = None
    shipping_address: Optional[str] = None
    was_roman_urdu: bool = False


class EmailOut(BaseModel):
    id: int
    order_id: Optional[int] = None
    sender: Optional[str] = None
    sender_email: Optional[str] = None
    subject: Optional[str] = None
    body_text: Optional[str] = None
    received_at: Optional[str] = None
    source: str
    classification: ClassificationOut
    extraction: Optional[ExtractionOut] = None
    status: str  # pending_review | approved | rejected (from the order; 'pending_review' if none)


class OrderUpdateIn(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_items: list[OrderItemOut] = []
    total_amount: Optional[float] = None
    shipping_address: Optional[str] = None


class AuditOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    actor: str
    field: Optional[str] = None
    ai_value: Optional[str] = None
    human_value: Optional[str] = None
    was_roman_urdu: bool = False
    created_at: Optional[str] = None


def email_to_out(email: Email) -> EmailOut:
    order = email.orders[0] if email.orders else None
    extraction = None
    if order is not None:
        extraction = ExtractionOut(
            customer_name=order.customer_name,
            customer_email=order.customer_email,
            order_items=[
                OrderItemOut(description=li.description, quantity=li.quantity, unit_price=li.unit_price)
                for li in order.line_items
            ],
            total_amount=order.total_amount,
            shipping_address=order.shipping_address,
            was_roman_urdu=order.was_roman_urdu,
        )
    return EmailOut(
        id=email.id,
        order_id=order.id if order else None,
        sender=email.sender,
        sender_email=email.sender,
        subject=email.subject,
        body_text=email.body_text,
        received_at=(email.received_at or email.created_at).isoformat() if (email.received_at or email.created_at) else None,
        source=email.source,
        classification=ClassificationOut(
            predicted_label=email.predicted_label or "Inquiry",
            confidence=email.classification_confidence or 0.0,
        ),
        extraction=extraction,
        status=order.status if order else "pending_review",
    )


def audit_to_out(entry: AuditLog) -> AuditOut:
    details: dict = {}
    if entry.details:
        try:
            details = json.loads(entry.details)
        except json.JSONDecodeError:
            details = {"raw": entry.details}

    def as_text(value) -> Optional[str]:
        if value is None:
            return None
        return value if isinstance(value, str) else json.dumps(value)

    return AuditOut(
        id=entry.id,
        entity_type=entry.entity_type,
        entity_id=entry.entity_id,
        action=entry.action,
        actor=entry.actor,
        field=details.get("field"),
        ai_value=as_text(details.get("ai_value")),
        human_value=as_text(details.get("human_value")),
        was_roman_urdu=bool(details.get("was_roman_urdu", False)),
        created_at=entry.created_at.isoformat() if entry.created_at else None,
    )
