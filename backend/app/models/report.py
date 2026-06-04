from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum as SQLAlchemyEnum, ForeignKey, Text, JSON, Date
from app.models.base import Base, IDMixin, TimestampMixin
import enum
from typing import Optional
import uuid
from datetime import date

class ReportType(str, enum.Enum):
    WEEKLY = "WEEKLY"
    BI_WEEKLY = "BI_WEEKLY"
    FIELD_OPERATION = "FIELD_OPERATION"
    QA = "QA"

class FieldReport(Base, IDMixin, TimestampMixin):
    __tablename__ = "field_reports"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False)
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    report_type: Mapped[ReportType] = mapped_column(SQLAlchemyEnum(ReportType), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    report_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    attachments: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)

    client: Mapped["Client"] = relationship("Client", back_populates="field_reports")
    device: Mapped[Optional["Device"]] = relationship("Device")
    created_by: Mapped["User"] = relationship("User")
