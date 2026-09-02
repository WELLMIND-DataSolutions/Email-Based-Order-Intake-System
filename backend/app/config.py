import os
import platform
import shutil
import socket
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# This dev machine's networks (WiFi and mobile hotspot both observed) hang
# on IPv6 connect attempts to Google's APIs and huggingface.co, while IPv4
# to the same hosts works. httplib2 (used by google-api-python-client) and
# some other libraries don't fall back to IPv4 the way browsers do (no
# Happy Eyeballs) - they just hang until timeout. Forcing getaddrinfo to
# only return IPv4 addresses process-wide sidesteps that.
_orig_getaddrinfo = socket.getaddrinfo


def _ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)


socket.getaddrinfo = _ipv4_only_getaddrinfo

BASE_DIR = Path(__file__).resolve().parent.parent

CLASSIFIER_MODEL = os.getenv("CLASSIFIER_MODEL", "valhalla/distilbart-mnli-12-3")
# 1.5B over 0.5B: the smaller model produces far more malformed JSON,
# especially on messy / Roman Urdu emails (see blueprint Point 4).
EXTRACTOR_MODEL = os.getenv("EXTRACTOR_MODEL", "Qwen/Qwen2.5-1.5B-Instruct")
SAMPLES_DIR = BASE_DIR / os.getenv("SAMPLES_DIR", "app/samples")
ATTACHMENTS_DIR = SAMPLES_DIR / "attachments"


def _discover_tesseract_cmd() -> str:
    """Cross-OS binary discovery (Technical Architecture doc roadmap item):
    an explicit env override always wins; otherwise prefer whatever's on
    PATH (covers `brew install tesseract` / `apt install tesseract-ocr`),
    falling back to the standard Windows installer path only on Windows."""
    env_override = os.getenv("TESSERACT_CMD")
    if env_override:
        return env_override
    on_path = shutil.which("tesseract")
    if on_path:
        return on_path
    if platform.system() == "Windows":
        return r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    return "tesseract"


TESSERACT_CMD = _discover_tesseract_cmd()

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'orders.db'}")

# ---- Gmail ingestion (Phase 6) ----
SECRETS_DIR = BASE_DIR / "secrets"
GMAIL_ENABLED = os.getenv("GMAIL_ENABLED", "false").lower() == "true"
GMAIL_CREDENTIALS_PATH = BASE_DIR / os.getenv("GMAIL_CREDENTIALS_PATH", "secrets/gmail_credentials.json")
GMAIL_TOKEN_PATH = BASE_DIR / os.getenv("GMAIL_TOKEN_PATH", "secrets/gmail_token.json")
GMAIL_POLL_INTERVAL_SECONDS = int(os.getenv("GMAIL_POLL_INTERVAL_SECONDS", "120"))

# Railway (or any host without the local machine's file) has no
# secrets/gmail_token.json - bootstrap it from an env var on cold start so
# app/ingestion/gmail_auth.py's existing file-based load_credentials() keeps
# working unchanged. Local dev never sets GMAIL_TOKEN_JSON, so this is a
# no-op there (the real file already exists).
_gmail_token_json = os.getenv("GMAIL_TOKEN_JSON")
if _gmail_token_json and not GMAIL_TOKEN_PATH.is_file():
    SECRETS_DIR.mkdir(parents=True, exist_ok=True)
    GMAIL_TOKEN_PATH.write_text(_gmail_token_json, encoding="utf-8")

# ---- Production hardening (Phase 7) ----
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")  # required to start the app; no insecure default
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")  # generate with `python -m app.security <password>`

FERNET_KEY = os.getenv("FERNET_KEY")  # required; generate with Fernet.generate_key()

OMS_PUSH_URL = os.getenv("OMS_PUSH_URL", "")  # empty = push is a logged no-op, no real OMS yet
OMS_PUSH_API_KEY = os.getenv("OMS_PUSH_API_KEY", "")

# Dev default covers localhost on any port; production (Railway) sets this to
# the deployed dashboard's actual origin(s), e.g. r"https://.*\.vercel\.app"
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX", r"http://(localhost|127\.0\.0\.1):\d+")

CLASSIFICATION_LABELS = ["Order", "Inquiry", "Support", "Spam"]

# Bare one-word labels give the NLI model too weak a hypothesis to reason
# against (e.g. "Spam" alone is easily confused with "Inquiry"). Fuller
# descriptive phrases produce far more reliable zero-shot entailment scores.
CLASSIFICATION_LABEL_DESCRIPTIONS = {
    "Order": "a purchase order requesting to buy specific products or quantities",
    "Inquiry": "a general question asking for information, pricing, or availability",
    "Support": "a complaint or support request about a problem with a past order",
    "Spam": "an unsolicited promotional, prize, or scam message",
}
