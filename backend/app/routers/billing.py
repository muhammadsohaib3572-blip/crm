from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID
from decimal import Decimal
from app.database.session import get_db
from app.repositories.billing_repository import BillingRepository
from app.schemas.ops import InvoiceCreate, InvoiceInDB, PaymentCreate, PaymentInDB
from app.models.user import User, UserRole
from app.models.billing import Invoice, Payment, InvoiceStatus
from app.models.client import Client
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/invoices", response_model=List[InvoiceInDB])
async def read_invoices(
    client_id: UUID = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = BillingRepository(db)
    return await repo.get_invoices(client_id)

@router.post("/invoices", response_model=InvoiceInDB)
async def create_invoice(
    invoice_in: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTS]))
):
    repo = BillingRepository(db)
    invoice = await repo.create_invoice(invoice_in)

    # Audit log
    await ActivityLogService.log_activity(
        db,
        current_user.id,        current_user.full_name,        "CREATE",
        "Invoice",
        f"Created invoice {invoice.id} for client {invoice.client_id} amount {invoice.amount}",
        entity_id=invoice.id
    )

    return invoice

@router.post("/payments", response_model=PaymentInDB)
async def create_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTS]))
):
    repo = BillingRepository(db)
    payment = await repo.create_payment(payment_in)

    # Audit log
    await ActivityLogService.log_activity(
        db,
        current_user.id,        current_user.full_name,        "CREATE",
        "Payment",
        f"Recorded payment {payment.id} for invoice {payment.invoice_id} amount {payment.amount}",
        entity_id=payment.id
    )

    return payment

@router.get("/balance/{client_id}")
async def get_balance(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = BillingRepository(db)
    balance = await repo.get_client_balance(client_id)
    return {"client_id": client_id, "outstanding_balance": balance}

@router.get("/clients/{client_id}/arrears")
async def get_client_arrears(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate outstanding balance (arrears) for a client"""

    # Get total invoice amount for client
    invoice_query = select(func.sum(Invoice.amount)).where(
        Invoice.client_id == client_id,
        Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.OVERDUE])
    )
    invoice_result = await db.execute(invoice_query)
    total_invoiced = invoice_result.scalar() or Decimal(0)

    # Get total payments made by client
    payment_query = select(func.sum(Payment.amount)).where(
        Payment.client_id == client_id
    )
    payment_result = await db.execute(payment_query)
    total_paid = payment_result.scalar() or Decimal(0)

    # Calculate arrears
    arrears = total_invoiced - total_paid

    # Get client details
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

@router.get("/overdue")
async def get_overdue_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all overdue invoices"""

    query = select(Invoice).where(
        Invoice.status == InvoiceStatus.OVERDUE
    ).order_by(Invoice.due_date.asc())

    result = await db.execute(query)
    overdue_invoices = result.scalars().all()

    return {
        "count": len(overdue_invoices),
        "invoices": [
            {
                "id": str(inv.id),
                "client_id": str(inv.client_id),
                "amount": float(inv.amount),
                "due_date": inv.due_date.isoformat(),
                "status": inv.status
            }
            for inv in overdue_invoices
        ]
    }
