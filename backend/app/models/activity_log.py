from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Text, JSON, DateTime, func
from app.models.base import Base, IDMixin
from typing import Optional
import uuid
from datetime import datetime

class ActivityLog(Base, IDMixin):
    __tablename__ = "activity_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    user_name: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "CREATE", "UPDATE", "DELETE"
    entity_type: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "Device", "Client", "Task"
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    previous_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Additional context
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User")
