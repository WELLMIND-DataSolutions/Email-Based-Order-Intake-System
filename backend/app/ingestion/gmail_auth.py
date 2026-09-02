"""Gmail OAuth token loading/refresh.

The token itself is produced once, out-of-band, by scripts/gmail_oauth_setup.py
(InstalledAppFlow, Desktop app credential). This module only ever reads and
refreshes that token — it never runs the interactive consent flow."""

from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import Resource, build

from app.config import GMAIL_TOKEN_PATH

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


class GmailAuthExpiredError(Exception):
    """Refresh token expired/revoked — rerun scripts/gmail_oauth_setup.py."""


def load_credentials() -> Credentials:
    if not GMAIL_TOKEN_PATH.is_file():
        raise GmailAuthExpiredError(
            f"No Gmail token found at {GMAIL_TOKEN_PATH} — run "
            "scripts/gmail_oauth_setup.py to authorize once."
        )

    creds = Credentials.from_authorized_user_file(str(GMAIL_TOKEN_PATH), SCOPES)

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except RefreshError as exc:
            raise GmailAuthExpiredError(
                "Gmail token refresh failed (expired/revoked) — rerun "
                "scripts/gmail_oauth_setup.py."
            ) from exc
        GMAIL_TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")

    return creds


def get_gmail_service() -> Resource:
    return build("gmail", "v1", credentials=load_credentials())
