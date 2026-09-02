"""Gmail API integration: list recent inbox messages, fetch + MIME-parse one.

Scope boundary: only text/plain and text/html body parts are read.
Non-text parts (attachments) are skipped — there's no Attachment DB model
yet, so nothing would persist them anyway (tracked as a follow-up)."""

import base64
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Optional

from googleapiclient.discovery import Resource

from app.extraction.text_extractor import html_to_text


def list_recent_message_ids(service: Resource, max_results: int = 25) -> list[str]:
    """Bounded recent-mail window — an efficiency bound only. Correctness
    comes from the message_id dedupe in ingest_email(), not this window."""
    response = (
        service.users()
        .messages()
        .list(userId="me", labelIds=["INBOX"], q="newer_than:2d", maxResults=max_results)
        .execute()
    )
    return [m["id"] for m in response.get("messages", [])]


def _header(headers: list[dict], name: str) -> Optional[str]:
    for h in headers:
        if h["name"].lower() == name.lower():
            return h["value"]
    return None


def _decode_part_data(data: str) -> str:
    return base64.urlsafe_b64decode(data.encode("ascii")).decode("utf-8", errors="replace")


def _walk_parts(payload: dict) -> tuple[Optional[str], Optional[str]]:
    """Returns (text_plain, text_html) found anywhere in the MIME tree."""
    mime_type = payload.get("mimeType", "")
    body_data = payload.get("body", {}).get("data")

    if mime_type == "text/plain" and body_data:
        return _decode_part_data(body_data), None
    if mime_type == "text/html" and body_data:
        return None, _decode_part_data(body_data)

    plain, html = None, None
    for part in payload.get("parts", []):
        p, h = _walk_parts(part)
        plain = plain or p
        html = html or h
    return plain, html


def _parse_received_at(headers: list[dict], internal_date_ms: Optional[str]) -> Optional[datetime]:
    date_header = _header(headers, "Date")
    if date_header:
        try:
            return parsedate_to_datetime(date_header)
        except (TypeError, ValueError):
            pass
    if internal_date_ms:
        return datetime.fromtimestamp(int(internal_date_ms) / 1000, tz=timezone.utc)
    return None


def fetch_and_parse_message(service: Resource, gmail_message_id: str) -> dict:
    message = (
        service.users()
        .messages()
        .get(userId="me", id=gmail_message_id, format="full")
        .execute()
    )
    payload = message.get("payload", {})
    headers = payload.get("headers", [])

    text_plain, text_html = _walk_parts(payload)
    body_text = text_plain if text_plain else html_to_text(text_html or "")

    return {
        "message_id": f"gmail:{gmail_message_id}",
        "sender": _header(headers, "From"),
        "subject": _header(headers, "Subject"),
        "body_text": body_text,
        "received_at": _parse_received_at(headers, message.get("internalDate")),
    }
