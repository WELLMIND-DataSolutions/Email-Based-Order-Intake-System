from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api_schemas import AuditOut, EmailOut, OrderUpdateIn, audit_to_out, email_to_out
from app.db import crud
from app.db.database import get_db
from app.security import get_current_user
from app.services.oms_push import push_order_to_oms

router = APIRouter(prefix="/api", tags=["orders"], dependencies=[Depends(get_current_user)])


def _get_order_or_404(db: Session, order_id: int):
    order = crud.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


@router.patch("/orders/{order_id}", response_model=EmailOut)
def update_order(
    order_id: int, payload: OrderUpdateIn, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)
):
    order = _get_order_or_404(db, order_id)
    crud.update_order_fields(db, order, payload.model_dump(), actor=current_user)
    db.commit()
    return email_to_out(crud.get_email(db, order.email_id))


@router.post("/orders/{order_id}/approve", response_model=EmailOut)
def approve_order(
    order_id: int, payload: OrderUpdateIn, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)
):
    """Human sign-off: apply final edits (diffed into AuditLog), mark approved,
    then push the order JSON to the OMS (no-op + audit log if OMS_PUSH_URL unset)."""
    order = _get_order_or_404(db, order_id)
    if order.status != "pending_review":
        raise HTTPException(status_code=409, detail=f"Order already {order.status}")
    crud.update_order_fields(db, order, payload.model_dump(), actor=current_user)
    crud.set_order_status(db, order, "approved", actor=current_user)
    db.commit()
    push_order_to_oms(db, order)
    return email_to_out(crud.get_email(db, order.email_id))


@router.post("/orders/{order_id}/reject", response_model=EmailOut)
def reject_order(order_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    order = _get_order_or_404(db, order_id)
    if order.status != "pending_review":
        raise HTTPException(status_code=409, detail=f"Order already {order.status}")
    crud.set_order_status(db, order, "rejected", actor=current_user)
    db.commit()
    return email_to_out(crud.get_email(db, order.email_id))


@router.get("/audit", response_model=list[AuditOut])
def list_audit(db: Session = Depends(get_db)):
    return [audit_to_out(a) for a in crud.list_audit_logs(db)]
