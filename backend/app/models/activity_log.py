from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Text, JSON, DateTime, func, Enum as SQLAlchemyEnum
from app.models.base import Base, IDMixin
from app.models.user import UserRole
from typing import Optional
import uuid
from datetime import datetime

class ActivityLog(Base, IDMixin):
    __tablename__ = "audit_log"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    user_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[Optional[UserRole]] = mapped_column(SQLAlchemyEnum(UserRole), nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"
    entity_type: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "Device", "Client", "Task"
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    old_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Additional context
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User")

    # Compatibility properties for old code using previous_value / new_value
    @property
    def previous_value(self) -> Optional[str]:
        return self.old_values

    @previous_value.setter
    def previous_value(self, val: Optional[str]):
        self.old_values = val

    @property
    def new_value(self) -> Optional[str]:
        return self.new_values

    @new_value.setter
    def new_value(self, val: Optional[str]):
        self.new_values = val

