from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum as SQLAlchemyEnum, ForeignKey, Text, DateTime, func
from app.models.base import Base, IDMixin, TimestampMixin
import enum
from typing import Optional
import uuid
from datetime import datetime

class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Task(Base, IDMixin, TimestampMixin):
    __tablename__ = "tasks"

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(SQLAlchemyEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(SQLAlchemyEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    assigned_to_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)

    assigned_to: Mapped["User"] = relationship("User")
    device: Mapped[Optional["Device"]] = relationship("Device")
    client: Mapped[Optional["Client"]] = relationship("Client")
