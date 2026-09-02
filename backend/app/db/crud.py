"""CRUD layer — the only place raw SQLAlchemy queries live.

Routes never touch the session directly beyond passing it in; this keeps the
door open for the PostgreSQL migration (blueprint Point 7) without route edits.
"""

import json
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models import AuditLog, Email, LineItem, Order, User

# ---------------------------------------------------------------- emails


def create_email(
    db: Session,
    *,
    source: str,
    sender: Optional[str],
    subject: Optional[str],
    body_text: str,
    predicted_label: str,
    classification_confidence: float,
    message_id: Optional[str] = None,
) -> Email:
    email = Email(
        source=source,
        sender=sender,
        subject=subject,
        body_text=body_text,
        predicted_label=predicted_label,
        classification_confidence=classification_confidence,
        message_id=message_id,
    )
    db.add(email)
    db.flush()  # assign id before audit rows reference it
    log_action(db, entity_type="email", entity_id=email.id, action="ingested",
               details=json.dumps({"source": source, "subject": subject}))
    log_action(db, entity_type="email", entity_id=email.id, action="classified",
               details=json.dumps({"label": predicted_label, "confidence": classification_confidence}))
    return email


def list_emails(db: Session) -> list[Email]:
    stmt = (
        select(Email)
        .options(selectinload(Email.orders).selectinload(Order.line_items))
        .order_by(Email.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def get_email(db: Session, email_id: int) -> Optional[Email]:
    stmt = (
        select(Email)
        .options(selectinload(Email.orders).selectinload(Order.line_items))
        .where(Email.id == email_id)
    )
    return db.scalars(stmt).first()


def get_email_by_message_id(db: Session, message_id: str) -> Optional[Email]:
    stmt = select(Email).where(Email.message_id == message_id)
    return db.scalars(stmt).first()


# ---------------------------------------------------------------- orders


def create_order_from_extraction(db: Session, email: Email, extraction: dict) -> Order:
    order = Order(
        email_id=email.id,
        customer_name=extraction.get("customer_name"),
        customer_email=extraction.get("customer_email"),
        shipping_address=extraction.get("shipping_address"),
        total_amount=extraction.get("total_amount"),
        was_roman_urdu=bool(extraction.get("was_roman_urdu", False)),
    )
    for item in extraction.get("order_items", []):
        order.line_items.append(
            LineItem(
                description=item.get("description", ""),
                quantity=item.get("quantity", 1),
                unit_price=item.get("unit_price"),
            )
        )
    db.add(order)
    db.flush()
    log_action(db, entity_type="order", entity_id=order.id, action="extracted",
               details=json.dumps({"email_id": email.id, "was_roman_urdu": order.was_roman_urdu}))
    return order


def get_order(db: Session, order_id: int) -> Optional[Order]:
    stmt = (
        select(Order)
        .options(selectinload(Order.line_items), selectinload(Order.email))
        .where(Order.id == order_id)
    )
    return db.scalars(stmt).first()


def _order_field_snapshot(order: Order) -> dict:
    return {
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "shipping_address": order.shipping_address,
        "total_amount": order.total_amount,
        "order_items": [
            {"description": li.description, "quantity": li.quantity, "unit_price": li.unit_price}
            for li in order.line_items
        ],
    }


def update_order_fields(db: Session, order: Order, payload: dict, actor: str = "user") -> Order:
    """Apply human edits; every changed field becomes a structured AuditLog row
    (ai_value vs human_value) — the active-learning training data (Feature 3)."""
    before = _order_field_snapshot(order)

    order.customer_name = payload.get("customer_name")
    order.customer_email = payload.get("customer_email")
    order.shipping_address = payload.get("shipping_address")
    order.total_amount = payload.get("total_amount")
    order.line_items.clear()
    for item in payload.get("order_items", []):
        order.line_items.append(
            LineItem(
                description=item.get("description", ""),
                quantity=item.get("quantity", 1),
                unit_price=item.get("unit_price"),
            )
        )
    db.flush()

    after = _order_field_snapshot(order)
    for field, old_value in before.items():
        if after[field] != old_value:
            log_action(
                db,
                entity_type="order",
                entity_id=order.id,
                action="edited",
                actor=actor,
                details=json.dumps({
                    "field": field,
                    "ai_value": old_value,
                    "human_value": after[field],
                    "was_roman_urdu": order.was_roman_urdu,
                }),
            )
    return order


def set_order_status(db: Session, order: Order, status: str, actor: str = "user") -> Order:
    order.status = status
    log_action(db, entity_type="order", entity_id=order.id,
               action="approved" if status == "approved" else "rejected",
               actor=actor,
               details=json.dumps({"was_roman_urdu": order.was_roman_urdu}))
    return order


# ---------------------------------------------------------------- users


def create_user(db: Session, *, username: str, password_hash: str) -> User:
    user = User(username=username, password_hash=password_hash)
    db.add(user)
    db.flush()
    return user


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    stmt = select(User).where(User.username == username)
    return db.scalars(stmt).first()


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User)).all())


# ---------------------------------------------------------------- audit


def log_action(
    db: Session,
    *,
    entity_type: str,
    entity_id: int,
    action: str,
    actor: str = "system",
    details: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor=actor,
        details=details,
    )
    db.add(entry)
    return entry


def list_audit_logs(db: Session, limit: int = 200) -> list[AuditLog]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(limit)
    return list(db.scalars(stmt).all())
