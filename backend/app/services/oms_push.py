"""Push an approved order to the downstream OMS (blueprint Point 10).

No real OMS exists yet, so OMS_PUSH_URL is optional: when unset, the push
is a logged no-op (oms_push_skipped) rather than an error - the moment a
real OMS endpoint exists, setting the env var turns this on with no code
change. A failed/unreachable OMS never fails the approve request itself;
the order stays approved locally and the failure is only recorded.
"""

import json
import logging

import httpx
from sqlalchemy.orm import Session

from app import config
from app.db import crud
from app.db.models import Order

logger = logging.getLogger(__name__)


def _order_payload(order: Order) -> dict:
    return {
        "order_id": order.id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "shipping_address": order.shipping_address,
        "total_amount": order.total_amount,
        "line_items": [
            {"description": li.description, "quantity": li.quantity, "unit_price": li.unit_price}
            for li in order.line_items
        ],
    }


def push_order_to_oms(db: Session, order: Order) -> None:
    payload = _order_payload(order)

    if not config.OMS_PUSH_URL:
        crud.log_action(
            db, entity_type="order", entity_id=order.id, action="oms_push_skipped",
            details=json.dumps({"reason": "OMS_PUSH_URL not configured"}),
        )
        db.commit()
        return

    headers = {"Authorization": f"Bearer {config.OMS_PUSH_API_KEY}"} if config.OMS_PUSH_API_KEY else {}
    try:
        response = httpx.post(config.OMS_PUSH_URL, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.error("OMS push failed for order %d: %s", order.id, exc)
        crud.log_action(
            db, entity_type="order", entity_id=order.id, action="oms_push_failed",
            details=json.dumps({"error": str(exc)}),
        )
    else:
        crud.log_action(
            db, entity_type="order", entity_id=order.id, action="oms_push_sent",
            details=json.dumps({"status_code": response.status_code}),
        )
    db.commit()
