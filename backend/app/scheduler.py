"""APScheduler wiring: polls the connected Gmail inbox on an interval.

Each job owns its own DB session (SessionLocal directly — jobs run outside
any FastAPI request, so the Depends(get_db) generator doesn't apply) and
never lets an exception escape, so one bad poll can't crash the process."""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app import config
from app.db import crud
from app.db.database import SessionLocal
from app.ingestion.gmail_auth import GmailAuthExpiredError, get_gmail_service
from app.ingestion.gmail_client import fetch_and_parse_message, list_recent_message_ids
from app.ingestion.pipeline import ingest_email

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")


def _job_poll_gmail() -> None:
    db = SessionLocal()
    try:
        service = get_gmail_service()
        new_count = 0
        for gmail_message_id in list_recent_message_ids(service):
            message_id = f"gmail:{gmail_message_id}"
            if crud.get_email_by_message_id(db, message_id) is not None:
                continue  # already ingested — skip the full messages().get() call
            parsed = fetch_and_parse_message(service, gmail_message_id)
            _, created = ingest_email(db, source="gmail", **parsed)
            if created:
                new_count += 1
        logger.info("gmail poll: %d new message(s)", new_count)
    except GmailAuthExpiredError as exc:
        logger.error("gmail poll failed: %s", exc)
    except Exception:
        logger.exception("gmail poll failed")
    finally:
        db.close()


def start_scheduler() -> None:
    if config.GMAIL_ENABLED:
        scheduler.add_job(
            _job_poll_gmail,
            "interval",
            seconds=config.GMAIL_POLL_INTERVAL_SECONDS,
            id="gmail_poll",
            next_run_time=datetime.now(timezone.utc),
        )
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
