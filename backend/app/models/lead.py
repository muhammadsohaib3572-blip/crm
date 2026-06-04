from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum as SQLAlchemyEnum, ForeignKey, Text, Date, Numeric, JSON
from app.models.base import Base, IDMixin, TimestampMixin
import enum
from typing import Optional, List
import uuid

class LeadStage(str, enum.Enum):
    NEW_LEAD = "NEW_LEAD"
    CONTACTED = "CONTACTED"
    NEGOTIATION = "NEGOTIATION"
    CONVERTED = "CONVERTED"
    LOST = "LOST"

class Lead(Base, IDMixin, TimestampMixin):
    __tablename__ = "leads"

    name: Mapped[str] = mapped_column(String, nullable=False)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    stage: Mapped[LeadStage] = mapped_column(SQLAlchemyEnum(LeadStage), default=LeadStage.NEW_LEAD, nullable=False)
    contact_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    follow_up_date: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    quotation_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    proposal_link: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    service_tags: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("clients.id"), nullable=True)

    client: Mapped[Optional["Client"]] = relationship(back_populates="leads")
