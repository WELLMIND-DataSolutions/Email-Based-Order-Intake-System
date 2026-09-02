"""One-time interactive Gmail OAuth setup.

Run once from rpa-engine/: `venv\\Scripts\\python scripts\\gmail_oauth_setup.py`

Opens a browser, asks you to sign into the Gmail account you want the app
to read, and saves a refresh token to GMAIL_TOKEN_PATH. After this,
app/ingestion/gmail_auth.py handles refreshing it automatically — you only
re-run this script if the token is revoked or (in OAuth "Testing" mode)
expires after 7 days.

Requires GMAIL_CREDENTIALS_PATH (a Desktop-app OAuth client JSON downloaded
from Google Cloud Console) to already exist.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google_auth_oauthlib.flow import InstalledAppFlow

from app.config import GMAIL_CREDENTIALS_PATH, GMAIL_TOKEN_PATH
from app.ingestion.gmail_auth import SCOPES


def main() -> None:
    if not GMAIL_CREDENTIALS_PATH.is_file():
        print(f"Missing credentials file: {GMAIL_CREDENTIALS_PATH}")
        print("Download it from Google Cloud Console (OAuth client, Desktop app type) first.")
        raise SystemExit(1)

    GMAIL_TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)

    flow = InstalledAppFlow.from_client_secrets_file(str(GMAIL_CREDENTIALS_PATH), scopes=SCOPES)
    creds = flow.run_local_server(port=0)

    GMAIL_TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
    print(f"Saved Gmail token to {GMAIL_TOKEN_PATH}")


if __name__ == "__main__":
    main()
