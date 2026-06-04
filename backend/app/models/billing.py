from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum as SQLAlchemyEnum, ForeignKey, Numeric, Date
from app.models.base import Base, IDMixin, TimestampMixin
import enum
from typing import Optional
import uuid
from datetime import date
from decimal import Decimal

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class Invoice(Base, IDMixin, TimestampMixin):
    __tablename__ = "invoices"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(SQLAlchemyEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(String, nullable=True) # PDF URL
    due_date: Mapped[date] = mapped_column(Date, nullable=False)

    client: Mapped["Client"] = relationship("Client", back_populates="invoices")
    payments: Mapped[list["Payment"]] = relationship(back_populates="invoice")

class Payment(Base, IDMixin, TimestampMixin):
    __tablename__ = "payments"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False)
    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, default=date.today)

    invoice: Mapped["Invoice"] = relationship(back_populates="payments")
    client: Mapped["Client"] = relationship("Client", back_populates="payments")
