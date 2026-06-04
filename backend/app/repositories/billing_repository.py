from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, func


from app.models.billing import Invoice, Payment, InvoiceStatus
from app.schemas.ops import InvoiceCreate, PaymentCreate
from uuid import UUID
from typing import List, Optional

class BillingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_invoices(self, client_id: Optional[UUID] = None) -> List[Invoice]:
        query = select(Invoice).order_by(desc(Invoice.created_at))
        if client_id:
            query = query.where(Invoice.client_id == client_id)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_invoice(self, invoice_in: InvoiceCreate) -> Invoice:
        db_invoice = Invoice(**invoice_in.model_dump())
        self.db.add(db_invoice)
        await self.db.commit()
        await self.db.refresh(db_invoice)
        return db_invoice

    async def create_payment(self, payment_in: PaymentCreate) -> Payment:
        db_payment = Payment(**payment_in.model_dump())
        self.db.add(db_payment)
        
        # Check if invoice is fully paid
        invoice_id = payment_in.invoice_id
        result = await self.db.execute(select(Invoice).where(Invoice.id == invoice_id))
        invoice = result.scalars().first()
        
        if invoice:
            # Calculate total paid including this new payment
            paid_result = await self.db.execute(
                select(func.sum(Payment.amount)).where(Payment.invoice_id == invoice_id)
            )
            total_paid = paid_result.scalar() or 0
            if total_paid + payment_in.amount >= invoice.amount:
                invoice.status = InvoiceStatus.PAID
        
        await self.db.commit()
        await self.db.refresh(db_payment)
        return db_payment

    async def get_client_balance(self, client_id: UUID):
        total_invoiced_res = await self.db.execute(
            select(func.sum(Invoice.amount)).where(Invoice.client_id == client_id)
        )
        total_paid_res = await self.db.execute(
            select(func.sum(Payment.amount)).where(Payment.client_id == client_id)
        )
        total_invoiced = total_invoiced_res.scalar() or 0
        total_paid = total_paid_res.scalar() or 0
        return total_invoiced - total_paid
