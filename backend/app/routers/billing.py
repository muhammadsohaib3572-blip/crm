from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID
from decimal import Decimal
from app.database.session import get_db
from app.repositories.billing_repository import BillingRepository
from app.schemas.ops import InvoiceCreate, InvoiceUpdate, InvoiceInDB, PaymentCreate, PaymentInDB
from app.models.user import User, UserRole
from app.models.billing import Invoice, Payment, InvoiceStatus
from app.models.client import Client
from app.routers.deps import check_role
from app.core.rbac import BILLING_READ_ROLES, BILLING_WRITE_ROLES
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/invoices", response_model=List[InvoiceInDB])
async def read_invoices(
    client_id: UUID = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_READ_ROLES))
):
    repo = BillingRepository(db)
    return await repo.get_invoices(client_id)

@router.post("/invoices", response_model=InvoiceInDB)
async def create_invoice(
    invoice_in: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_WRITE_ROLES))
):
    repo = BillingRepository(db)
    invoice = await repo.create_invoice(invoice_in)
    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "CREATE",
        "Invoice",
        f"Created invoice {invoice.id} for client {invoice.client_id} amount {invoice.amount}",
        entity_id=invoice.id
    )
    return invoice

@router.get("/invoices/{invoice_id}", response_model=InvoiceInDB)
async def read_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_READ_ROLES))
):
    repo = BillingRepository(db)
    invoice = await repo.get_invoice_by_id(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.patch("/invoices/{invoice_id}", response_model=InvoiceInDB)
async def update_invoice(
    invoice_id: UUID,
    invoice_in: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_WRITE_ROLES))
):
    repo = BillingRepository(db)
    db_invoice = await repo.get_invoice_by_id(invoice_id)
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if db_invoice.status == InvoiceStatus.PAID and invoice_in.status and invoice_in.status != InvoiceStatus.PAID:
        raise HTTPException(status_code=422, detail="Cannot change status of a paid invoice")
    previous = {"status": db_invoice.status.value, "amount": str(db_invoice.amount)}
    updated = await repo.update_invoice(db_invoice, invoice_in)
    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "UPDATE", "Invoice",
        f"Updated invoice {invoice_id}",
        entity_id=invoice_id,
        previous_value=str(previous),
        new_value=str(invoice_in.model_dump(exclude_unset=True)),
    )
    return updated

@router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    repo = BillingRepository(db)
    db_invoice = await repo.get_invoice_by_id(invoice_id)
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if db_invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=422, detail="Cannot delete a paid invoice. Cancel instead.")
    paid_res = await db.execute(select(func.sum(Payment.amount)).where(Payment.invoice_id == invoice_id))
    if (paid_res.scalar() or 0) > 0:
        raise HTTPException(status_code=422, detail="Cannot delete invoice with recorded payments")
    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "DELETE", "Invoice",
        f"Deleted invoice {invoice_id} amount {db_invoice.amount}",
        entity_id=invoice_id,
    )
    await repo.delete_invoice(db_invoice)
    return {"message": "Invoice deleted successfully"}

@router.get("/payments", response_model=List[PaymentInDB])
async def read_payments(
    client_id: UUID = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_READ_ROLES))
):
    query = select(Payment).order_by(Payment.created_at.desc())
    if client_id:
        query = query.where(Payment.client_id == client_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/payments", response_model=PaymentInDB)
async def create_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_WRITE_ROLES))
):
    if payment_in.amount <= 0:
        raise HTTPException(status_code=422, detail="Payment amount must be positive")
    repo = BillingRepository(db)
    # Validate payment amount does not exceed remaining invoice balance
    repo = BillingRepository(db)
    # Fetch invoice to calculate remaining balance
    invoice_result = await db.execute(select(Invoice).where(Invoice.id == payment_in.invoice_id))
    invoice = invoice_result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    # Calculate total paid so far
    paid_res = await db.execute(select(func.sum(Payment.amount)).where(Payment.invoice_id == payment_in.invoice_id))
    total_paid = paid_res.scalar() or 0
    remaining = invoice.amount - total_paid
    if payment_in.amount > remaining:
        raise HTTPException(status_code=422, detail=f"Payment exceeds remaining invoice balance of {remaining}")
    # Proceed with payment creation
    payment = await repo.create_payment(payment_in)
    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "CREATE", "Payment",
        f"Recorded payment {payment.id} for invoice {payment.invoice_id} amount {payment.amount}",
        entity_id=payment.id
    )
    return payment

@router.get("/overdue", response_model=List[InvoiceInDB])
async def get_overdue_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_READ_ROLES))
):
    query = select(Invoice).where(Invoice.status == InvoiceStatus.OVERDUE).order_by(Invoice.due_date.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/balance/{client_id}")
async def get_balance(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_READ_ROLES)),
):
    repo = BillingRepository(db)
    balance = await repo.get_client_balance(client_id)
    return {"client_id": client_id, "outstanding_balance": balance}

@router.get("/clients/{client_id}/arrears")
async def get_client_arrears(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_READ_ROLES))
):

    invoice_query = select(func.sum(Invoice.amount)).where(
        Invoice.client_id == client_id,
        Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.OVERDUE])
    )
    invoice_result = await db.execute(invoice_query)
    total_invoiced = invoice_result.scalar() or Decimal(0)

    payment_query = select(func.sum(Payment.amount)).where(Payment.client_id == client_id)
    payment_result = await db.execute(payment_query)
    total_paid = payment_result.scalar() or Decimal(0)

    arrears = total_invoiced - total_paid

    client_result = await db.execute(select(Client).where(Client.id == client_id))
    client = client_result.scalars().first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return {
        "client_id": str(client_id),
        "client_name": client.name,
        "total_invoiced": float(total_invoiced),
        "total_paid": float(total_paid),
        "outstanding_balance": float(arrears),
        "arrears": float(arrears)
    }

@router.get("/clients/{client_id}/ledger")
async def get_client_ledger(
    client_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(BILLING_READ_ROLES))
):
    invoices_result = await db.execute(
        select(Invoice).where(Invoice.client_id == client_id).order_by(Invoice.created_at.desc())
    )
    invoices = invoices_result.scalars().all()

    payments_result = await db.execute(
        select(Payment).where(Payment.client_id == client_id).order_by(Payment.created_at.desc())
    )
    payments = payments_result.scalars().all()

    ledger = []
    for inv in invoices:
        ledger.append({
            "type": "INVOICE",
            "id": str(inv.id),
            "amount": float(inv.amount),
            "status": inv.status,
            "date": inv.created_at.isoformat(),
            "due_date": inv.due_date.isoformat() if inv.due_date else None,
        })
    for pay in payments:
        ledger.append({
            "type": "PAYMENT",
            "id": str(pay.id),
            "invoice_id": str(pay.invoice_id),
            "amount": float(pay.amount),
            "date": pay.payment_date.isoformat(),
        })

    ledger.sort(key=lambda x: x["date"], reverse=True)
    total = len(ledger)
    return {"total": total, "items": ledger[skip: skip + limit]}
