from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api_schemas import EmailOut, email_to_out
from app.config import SAMPLES_DIR
from app.db import crud
from app.db.database import get_db
from app.extraction.text_extractor import html_to_text
from app.ingestion.pipeline import ingest_email
from app.security import get_current_user

router = APIRouter(prefix="/api/emails", tags=["emails"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[EmailOut])
def list_emails(db: Session = Depends(get_db)):
    return [email_to_out(e) for e in crud.list_emails(db)]


@router.get("/{email_id}", response_model=EmailOut)
def get_email(email_id: int, db: Session = Depends(get_db)):
    email = crud.get_email(db, email_id)
    if email is None:
        raise HTTPException(status_code=404, detail=f"Email {email_id} not found")
    return email_to_out(email)


@router.post("/ingest-sample/{filename}", response_model=EmailOut)
def ingest_sample(filename: str, db: Session = Depends(get_db)):
    """Run the full pipeline on a sample file and PERSIST the result —
    the Phase 4 replacement for the stateless /api/dev processing route.
    Phase 6 (app/ingestion/) swaps the file read for Gmail polling; the
    shared classify -> extract -> persist logic lives in ingest_email()."""
    path = SAMPLES_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"Sample '{filename}' not found")

    raw_text = path.read_text(encoding="utf-8")
    email_text = html_to_text(raw_text)

    email, _ = ingest_email(
        db,
        source="sample",
        message_id=None,
        sender=filename,
        subject=filename.replace(".txt", "").replace("_", " ").title(),
        body_text=email_text,
    )
    return email_to_out(crud.get_email(db, email.id))
