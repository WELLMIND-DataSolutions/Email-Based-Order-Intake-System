"""Shared classify -> extract -> persist pipeline.

Every ingestion source (sample file, Gmail poll) funnels through
ingest_email() so the AI pipeline and persistence logic exist in exactly
one place. message_id is the dedupe key — Email.message_id is unique."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.ai.classifier import classify_email
from app.ai.structured_extractor import extract_order_fields
from app.db import crud
from app.db.models import Email


def ingest_email(
    db: Session,
    *,
    source: str,
    message_id: Optional[str],
    sender: Optional[str],
    subject: Optional[str],
    body_text: str,
    received_at: Optional[datetime] = None,
) -> tuple[Email, bool]:
    """Classify + (if Order) extract + persist. Returns (email, was_created).

    If message_id is given and already ingested, returns the existing row
    with was_created=False and skips classification/extraction entirely."""
    if message_id is not None:
        existing = crud.get_email_by_message_id(db, message_id)
        if existing is not None:
            return existing, False

    classification = classify_email(body_text)
    email = crud.create_email(
        db,
        source=source,
        sender=sender,
        subject=subject,
        body_text=body_text,
        predicted_label=classification["predicted_label"],
        classification_confidence=classification["confidence"],
        message_id=message_id,
    )

    if received_at is not None:
        email.received_at = received_at

    if classification["predicted_label"] == "Order":
        extraction = extract_order_fields(body_text)
        if "error" not in extraction:
            crud.create_order_from_extraction(db, email, extraction)

    db.commit()
    db.refresh(email)
    return email, True
