from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.encrypted_types import EncryptedString


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Email(Base):
    """One ingested email (sample file now; Gmail/IMAP message later)."""

    __tablename__ = "emails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True)  # provider Message-ID; null for samples
    source: Mapped[str] = mapped_column(String(20), default="sample")  # sample | gmail | imap
    sender: Mapped[Optional[str]] = mapped_column(String(255))
    subject: Mapped[Optional[str]] = mapped_column(String(500))
    body_text: Mapped[Optional[str]] = mapped_column(Text)
    body_html: Mapped[Optional[str]] = mapped_column(Text)
    received_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    predicted_label: Mapped[Optional[str]] = mapped_column(String(20))  # Order | Inquiry | Support | Spam
    classification_confidence: Mapped[Optional[float]] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    orders: Mapped[List["Order"]] = relationship(back_populates="email", cascade="all, delete-orphan")


class Order(Base):
    """AI-extracted order awaiting human review, mirrors ai.schemas.ExtractedOrder."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email_id: Mapped[int] = mapped_column(ForeignKey("emails.id"), index=True)

    # PII at rest (blueprint Point 12) - transparently Fernet-encrypted, see encrypted_types.py
    customer_name: Mapped[Optional[str]] = mapped_column(EncryptedString)
    customer_email: Mapped[Optional[str]] = mapped_column(EncryptedString)
    shipping_address: Mapped[Optional[str]] = mapped_column(EncryptedString)
    total_amount: Mapped[Optional[float]] = mapped_column(Float)

    status: Mapped[str] = mapped_column(String(20), default="pending_review")  # pending_review | approved | rejected
    was_roman_urdu: Mapped[bool] = mapped_column(Boolean, default=False)  # Roman Urdu few-shot path ran (Feature 1/3 tracking)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    email: Mapped["Email"] = relationship(back_populates="orders")
    line_items: Mapped[List["LineItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class LineItem(Base):
    """One product line inside an order, mirrors ai.schemas.OrderItem."""

    __tablename__ = "line_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)

    description: Mapped[str] = mapped_column(Text)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[Optional[float]] = mapped_column(Float)

    order: Mapped["Order"] = relationship(back_populates="line_items")


class User(Base):
    """A dashboard login (Phase 7 multi-user auth). password_hash is pbkdf2, see app/security.py."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    """Trail of every significant action (ingest, classify, approve, edit...)."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(50))  # email | order
    entity_id: Mapped[int] = mapped_column(Integer, index=True)
    action: Mapped[str] = mapped_column(String(50))  # ingested | classified | extracted | approved | rejected | edited
    actor: Mapped[str] = mapped_column(String(100), default="system")  # system | user identifier
    details: Mapped[Optional[str]] = mapped_column(Text)  # free-form JSON string with action context

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
