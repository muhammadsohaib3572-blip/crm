from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum as SQLAlchemyEnum, ForeignKey, Text, Date, DateTime, Numeric, JSON, func
from app.models.base import Base, IDMixin, TimestampMixin
import enum
from typing import Optional, List
import uuid
from datetime import datetime

class LeadStage(str, enum.Enum):
    NEW_LEAD = "NEW_LEAD"
    CONTACTED = "CONTACTED"
    MEETING_SCHEDULED = "MEETING_SCHEDULED"
    PROPOSAL_SENT = "PROPOSAL_SENT"
    NEGOTIATION = "NEGOTIATION"
    WON = "WON"
    LOST = "LOST"

# Valid forward transitions for lead stages
LEAD_STAGE_TRANSITIONS: dict[str, list[str]] = {
    "NEW_LEAD":           ["CONTACTED", "LOST"],
    "CONTACTED":          ["MEETING_SCHEDULED", "NEGOTIATION", "LOST"],
    "MEETING_SCHEDULED":  ["PROPOSAL_SENT", "NEGOTIATION", "LOST"],
    "PROPOSAL_SENT":      ["NEGOTIATION", "WON", "LOST"],
    "NEGOTIATION":        ["WON", "LOST", "PROPOSAL_SENT"],
    "WON":                [],
    "LOST":               ["NEW_LEAD"],  # allow re-open
}

class LeadActivityType(str, enum.Enum):
    FOLLOW_UP = "FOLLOW_UP"
    MEETING = "MEETING"
    FARM_VISIT = "FARM_VISIT"

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
    activities: Mapped[List["LeadActivity"]] = relationship(back_populates="lead", cascade="all, delete-orphan", lazy="selectin")


class LeadActivity(Base, IDMixin, TimestampMixin):
    __tablename__ = "lead_activities"

    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id"), nullable=False, index=True)
    activity_type: Mapped[LeadActivityType] = mapped_column(SQLAlchemyEnum(LeadActivityType), nullable=False)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    lead: Mapped["Lead"] = relationship(back_populates="activities")
    created_by: Mapped["User"] = relationship("User")
