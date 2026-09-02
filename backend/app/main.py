import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.ai.classifier import classify_email
from app.ai.structured_extractor import extract_order_fields
from app import config
from app.config import ATTACHMENTS_DIR, SAMPLES_DIR
from app.db import crud
from app.db.database import SessionLocal
from app.extraction.router import process_attachment
from app.extraction.text_extractor import html_to_text
from app.routes_auth import router as auth_router
from app.routes_emails import router as emails_router
from app.routes_orders import router as orders_router
from app.scheduler import start_scheduler, stop_scheduler

# Root logger defaults to WARNING - app.scheduler's "gmail poll: N new
# message(s)" INFO lines were silently swallowed without this.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s: %(message)s")


def _seed_admin_user() -> None:
    """One-time bootstrap: if no users exist yet and ADMIN_USERNAME/
    ADMIN_PASSWORD_HASH are set in .env, create that as the first account -
    carries over credentials from the single-admin setup without asking the
    user to redo it. password_hash is already hashed, inserted as-is."""
    if not (config.ADMIN_USERNAME and config.ADMIN_PASSWORD_HASH):
        return
    db = SessionLocal()
    try:
        if not crud.list_users(db):
            crud.create_user(db, username=config.ADMIN_USERNAME, password_hash=config.ADMIN_PASSWORD_HASH)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed_admin_user()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="AI Email Order Intake", lifespan=lifespan)

# The Expo dev server calls this API directly in Phase 5. Expo picks the next
# free port (8081, 8082, ...) if the default is busy, so match any localhost
# port here rather than hardcoding one.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=config.ALLOWED_ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(emails_router)
app.include_router(orders_router)


# ---- stateless dev/testing routes (Phase 1) — kept for quick model checks ----


@app.get("/api/dev/samples")
def list_samples():
    return sorted(p.name for p in SAMPLES_DIR.glob("*.txt"))


@app.post("/api/dev/samples/{filename}/process")
def process_sample(filename: str):
    path = SAMPLES_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"Sample '{filename}' not found")

    raw_text = path.read_text(encoding="utf-8")
    email_text = html_to_text(raw_text)

    classification = classify_email(email_text)

    extraction = None
    if classification["predicted_label"] == "Order":
        extraction = extract_order_fields(email_text)

    return {
        "filename": filename,
        "classification": classification,
        "extraction": extraction,
    }


@app.get("/api/dev/attachments")
def list_attachments():
    return sorted(p.name for p in ATTACHMENTS_DIR.glob("*") if p.is_file())


@app.post("/api/dev/attachments/{filename}/process")
def process_attachment_route(filename: str):
    path = ATTACHMENTS_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"Attachment '{filename}' not found")

    try:
        result = process_attachment(path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {"filename": filename, **result}
