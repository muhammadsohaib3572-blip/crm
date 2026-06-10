from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Text, Date, JSON, Enum as SQLAlchemyEnum
from app.models.base import Base, IDMixin, TimestampMixin
from datetime import date
from typing import List, TYPE_CHECKING, Optional
import enum

if TYPE_CHECKING:
    from app.models.device import Device
    from app.models.lead import Lead
    from app.models.issue import ClientIssue
    from app.models.billing import Invoice, Payment
    from app.models.report import FieldReport

class ContractStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    PENDING = "PENDING"

class Client(Base, IDMixin, TimestampMixin):
    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(String, nullable=False)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    farm_size: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    onboarding_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    crop_cycle_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    services: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    farm_location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    third_party_credentials: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    contract_value: Mapped[Optional[float]] = mapped_column(Float, default=0.0, nullable=True)
    # Contract tracking fields
    contract_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    contract_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    contract_status: Mapped[Optional[ContractStatus]] = mapped_column(SQLAlchemyEnum(ContractStatus), nullable=True)

    # Relationships
    devices: Mapped[List["Device"]] = relationship("Device", back_populates="client", lazy="selectin")
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="client", cascade="all, delete-orphan")
    issues: Mapped[List["ClientIssue"]] = relationship("ClientIssue", back_populates="client", cascade="all, delete-orphan")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="client", cascade="all, delete-orphan")
    field_reports: Mapped[List["FieldReport"]] = relationship("FieldReport", back_populates="client", cascade="all, delete-orphan")
